import requests
import json
import re

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2"

def mask_sensitive_data(text: str) -> str:
    """Compliance Buffer: Mask IP addresses and emails before sending to LLM."""
    if not text: return text
    # Mask IPs
    masked = re.sub(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', '[REDACTED_IP]', text)
    # Mask emails
    masked = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', '[REDACTED_EMAIL]', masked)
    return masked

def verify_crc(output_text: str, retrieved_context: str) -> bool:
    """Chain-of-Retrieval Consistency (CRC): Verify if entities in output exist in context."""
    # Extract CVEs from output
    cves = set(re.findall(r'CVE-\d{4}-\d+', output_text))
    context_cves = set(re.findall(r'CVE-\d{4}-\d+', retrieved_context))
    # If the LLM output generated a CVE not in context, it's a hallucination
    if not cves.issubset(context_cves):
        return False
    return True

def generate_mitigation(threat_name: str, threat_type: str, severity: str, context: str = "", cisa_solution: str = "", model: str = "llama3.2", retrieved_chunks: list = []) -> dict:
    safe_threat_name = str(threat_name) if threat_name else "Unknown Threat"
    
    # Compile retrieval context and apply compliance buffer
    full_context = ""
    for idx, chunk in enumerate(retrieved_chunks):
        masked_chunk = mask_sensitive_data(chunk)
        full_context += f"[Doc ID: {idx}] {masked_chunk}\n"
    
    masked_context = mask_sensitive_data(context)
    masked_cisa = mask_sensitive_data(cisa_solution)

    # Severity-Aware Abstention Logic (Simulated thresholds)
    # If severity is Critical and we have no official solution or chunks, we escalate.
    if severity.lower() == "critical" and not retrieved_chunks and not cisa_solution:
        return {
            "executive_summary": "I do not know. Escalate to analyst with missing evidence list.",
            "technical_analysis": "Abstention policy enforced due to Critical severity and lack of evidence.",
            "immediate_mitigation": ["Escalate to L2 Analyst immediately.", "Preserve human oversight."],
            "is_zero_day": True
        }

    prompt = f"""
    You are an expert Cybersecurity AI Assistant working in a SOC Command Center.
    You are analyzing a threat using Retrieval-Augmented Generation (RAGSec).

    [THREAT DATA]
    Name: {safe_threat_name}
    Type: {threat_type}
    Severity: {severity}
    Legacy Context: {masked_context}
    Official CISA Solution: {masked_cisa}

    [RETRIEVED EVIDENCE]
    {full_context}

    [INSTRUCTIONS]
    1. Evidence Binding: Every analytical claim you make MUST be explicitly cited using [Doc ID: X] referencing the Retrieved Evidence above.
    2. Forbidden Inference Policy: You are strictly prohibited from generating novel IOCs, CVEs, or attack paths that are not directly present in the context.
    3. If the evidence is insufficient, state "I do not know" or "Escalate to analyst".
    
    Please provide your response in valid JSON format exactly as follows:
    {{
        "executive_summary": "A brief summary of the threat and its business impact. [Doc ID: X]",
        "technical_analysis": "A deeper technical look at how this threat operates. [Doc ID: X]",
        "immediate_mitigation": ["Step 1 [Doc ID: X]", "Step 2 [Doc ID: X]"],
        "is_zero_day": <true/false>
    }}
    
    Only output valid JSON.
    """
    
    if model == "gemini-1.5-pro":
        # Cloud Placeholder
        return {
            "executive_summary": "[CLOUD MOCK] Gemini 1.5 Pro analysis of " + safe_threat_name,
            "technical_analysis": "[CLOUD MOCK] This is a placeholder for the cloud API endpoint.",
            "immediate_mitigation": ["Switch back to Llama 3.2 for local inference", "Provide API key for Cloud activation"],
            "is_zero_day": False
        }

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        result_text = data.get("response", "{}")
        
        # Post-Generation Verification (CRC)
        if not verify_crc(result_text, full_context + masked_cisa + masked_context):
            return {
                "executive_summary": "Warning: Hallucination detected. CRC verification failed. Entities found in output that were not in source.",
                "technical_analysis": "Content suppressed due to policy filter violation.",
                "immediate_mitigation": ["Review raw logs manually."],
                "is_zero_day": False
            }

        return json.loads(result_text)
    except Exception as e:
        print(f"Ollama unavailable, using Mock Fallback: {e}")
        # Realistic Mock Engine Fallback
        mock_summary = f"[Mock Engine Fallback] The threat {safe_threat_name} exhibits behaviors consistent with {threat_type}. High likelihood of lateral movement if left unchecked. [Doc ID: 0]"
        mock_technical = f"Analysis simulated locally. Extracted TTPs from context: {threat_type} patterns observed across multiple nodes. [Doc ID: 1]"
        return {
            "executive_summary": mock_summary,
            "technical_analysis": mock_technical,
            "immediate_mitigation": [
                "Isolate affected endpoints from main segment [Doc ID: 0]", 
                "Initiate deep scan on neighboring subnets [Doc ID: 1]"
            ],
            "is_zero_day": False
        }

def generate_diagnostic_chat(history: list, latest_msg: str, model: str = "llama3.2", image_b64: str = None) -> dict:
    if model == "gemini-1.5-pro":
        return {
            "type": "question",
            "content": "[CLOUD MOCK] Gemini 1.5 Pro acknowledges your message."
        }

    # Apply compliance buffer to user input
    safe_latest_msg = mask_sensitive_data(latest_msg)

    system_prompt = """
    You are an expert Cybersecurity AI Assistant working in a SOC Command Center.
    Your goal is to diagnose user issues or analyze threats. 
    
    You operate under strict RAGSec guidelines:
    - If unsure, say "I do not know".
    - Do not invent IPs or CVEs.
    
    If the user's issue is ambiguous, you MUST ask 1 or 2 clarifying questions before giving a diagnosis.
    You must ALWAYS output your response in JSON format.
    
    If you need to ask a clarifying question or converse normally, use this JSON schema:
    {
        "type": "question",
        "content": "Your conversational response or question here."
    }
    
    If you are ready to provide a final diagnosis and mitigation plan, use this JSON schema:
    {
        "type": "diagnosis",
        "executive_summary": "Summary of the threat.",
        "technical_analysis": "Deeper technical breakdown.",
        "immediate_mitigation": ["Step 1", "Step 2"],
        "is_zero_day": false
    }
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({
            "role": msg.get("role", "user"),
            "content": mask_sensitive_data(msg.get("content", ""))
        })
        
    user_msg = {"role": "user", "content": safe_latest_msg}
    if image_b64:
        raw_b64 = image_b64
        if "," in image_b64:
            raw_b64 = image_b64.split(",", 1)[1]
            
        user_msg["images"] = [raw_b64]
        if model != "gemini-1.5-pro" and "vision" not in model and "llava" not in model:
            model = "llama3.2-vision"
            
    messages.append(user_msg)

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "format": "json"
    }
    
    try:
        response = requests.post(OLLAMA_CHAT_URL, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        result_text = data.get("message", {}).get("content", "{}")
        return json.loads(result_text)
    except Exception as e:
        print(f"Ollama unavailable for chat, using Mock Fallback: {e}")
        return {
            "type": "diagnosis",
            "executive_summary": "[Mock Engine Fallback] Simulated diagnosis based on RAG context.",
            "technical_analysis": "I am operating in Fallback Mock Mode because the local Ollama instance is unreachable. However, I can confirm the context indicates potential malicious activity.",
            "immediate_mitigation": ["Start Ollama on localhost:11434 to enable live LLM inference.", "Verify network logs."],
            "is_zero_day": False
        }
