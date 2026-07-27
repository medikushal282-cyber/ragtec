import requests
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2"

def generate_mitigation(threat_name: str, threat_type: str, severity: str, context: str = "", cisa_solution: str = "", model: str = "llama3.2") -> dict:
    safe_threat_name = str(threat_name) if threat_name else "Unknown Threat"
    if model == "gemini-1.5-pro":
        # Cloud Placeholder
        return {
            "executive_summary": "[CLOUD MOCK] Gemini 1.5 Pro analysis of " + safe_threat_name,
            "technical_analysis": "[CLOUD MOCK] This is a placeholder for the cloud API endpoint.",
            "immediate_mitigation": ["Switch back to Llama 3.2 for local inference", "Provide API key for Cloud activation"],
            "is_zero_day": False
        }

    prompt = f"""
    You are an expert Cybersecurity AI Assistant working in a SOC Command Center.
    You are analyzing a threat based on CISA Intelligence documents.

    [THREAT DATA]
    Name: {threat_name}
    Type: {threat_type}
    Severity: {severity}
    Additional Context: {context}
    Official CISA Solution: {cisa_solution if cisa_solution else "No official solution provided."}

    [INSTRUCTIONS]
    1. If the "Official CISA Solution" is provided and valid, you MUST use it as the basis for your 'immediate_mitigation' steps. Format it neatly into actionable steps.
    2. If the "Official CISA Solution" is empty, missing, or says "No official solution provided.", you must assume this is a Zero-Day threat. 
       In this case, consult your internal knowledge of similar past zero-day vectors and provide a basic, robust fallback containment solution (e.g., isolating networks, checking logs).
    
    Please provide your response in valid JSON format exactly as follows:
    {{
        "executive_summary": "A brief summary of the threat and its business impact.",
        "technical_analysis": "A deeper technical look at how this threat operates.",
        "immediate_mitigation": ["Step 1", "Step 2", "Step 3"],
        "is_zero_day": <true if no CISA solution, false otherwise>
    }}
    
    Only output valid JSON.
    """
    
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
        return json.loads(result_text)
    except Exception as e:
        print(f"Error generating LLM mitigation: {e}")
        # Fallback empty response
        return {
            "executive_summary": f"Could not reach local LLM (Ollama). Error: {e}",
            "technical_analysis": "Offline fallback triggered.",
            "immediate_mitigation": ["Check Ollama status", "Verify model is pulled"],
            "is_zero_day": False
        }

def generate_diagnostic_chat(history: list, latest_msg: str, model: str = "llama3.2", image_b64: str = None) -> dict:
    if model == "gemini-1.5-pro":
        return {
            "type": "question",
            "content": "[CLOUD MOCK] Gemini 1.5 Pro acknowledges your message. Could you clarify what processes are running?"
        }

    system_prompt = """
    You are an expert Cybersecurity AI Assistant working in a SOC Command Center.
    Your goal is to diagnose user issues or analyze threats. 
    
    If the user's issue is ambiguous, you MUST ask 1 or 2 clarifying questions before giving a diagnosis. Do not make up your own issues to ask about.
    If you have enough information, or the user asks for a general playbook, you can provide a final diagnosis.

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
    
    # Append history
    for msg in history:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
        
    # Append latest message with optional image
    user_msg = {"role": "user", "content": latest_msg}
    if image_b64:
        user_msg["images"] = [image_b64]
        # Force model to llava if an image is provided, unless they explicitly use the cloud mock
        if model != "gemini-1.5-pro":
            model = "llava"
            
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
        print(f"Error generating diagnostic chat: {e}")
        return {
            "type": "question",
            "content": f"I'm having trouble connecting to the local LLM ({model}). Error: {e}"
        }

