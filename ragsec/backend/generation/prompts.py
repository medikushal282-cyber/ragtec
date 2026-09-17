import re
from typing import List, Tuple, Dict, Any

def mask_compliance_buffer(text: str) -> Tuple[str, List[Dict[str, str]]]:
    redactions = []
    
    def repl_ip(m):
        redactions.append({"type": "IP", "original": m.group(0)})
        return "[IP_REDACTED]"
    text = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', repl_ip, text)
    
    def repl_host(m):
        redactions.append({"type": "HOST", "original": m.group(0)})
        return "[HOST_REDACTED]"
    text = re.sub(
        r'\b(?:WS|FS|DC|SRV|SERVER|CORP|APP|DB|WEB|MAIL|VPN)-[A-Z0-9\-]{2,20}\b',
        repl_host, text, flags=re.IGNORECASE
    )
    
    def repl_email(m):
        redactions.append({"type": "EMAIL", "original": m.group(0)})
        return "[EMAIL_REDACTED]"
    text = re.sub(
        r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b',
        repl_email, text
    )
    
    return text, redactions

def build_grounded_prompt(query: str, evidence: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    context_blocks = []
    masked_evidence = []
    
    for i, e in enumerate(evidence):
        tag = f"C{i+1}"
        raw_text = e.get("chunk_text", e.get("text", ""))
        masked_txt, _ = mask_compliance_buffer(raw_text)
        
        e_copy = dict(e)
        e_copy["masked_text"] = masked_txt
        e_copy["citation_tag"] = tag
        masked_evidence.append(e_copy)
        
        source = e.get("source_name", e.get("source", "Unknown"))
        source_type = e.get("source_type", "Unknown")
        
        context_blocks.append(
            f"[{tag}] (Source: {source}, Type: {source_type})\n{masked_txt}"
        )
        
    context_str = "\n\n".join(context_blocks)
    
    prompt = f"""You are RAGSec, an expert SOC Cybersecurity AI Co-Pilot.
Answer the security analyst's question directly, fluently, and naturally in plain English, using the retrieved evidence below as your factual grounding.

### RETRIEVED EVIDENCE:
{context_str}

### INSTRUCTIONS:
1. Speak naturally and authoritatively as a senior cybersecurity analyst.
2. Directly address the user's specific question using the factual details in the evidence.
3. Naturally cite evidence tags (e.g. [C1], [C2]) when referencing specific facts, IOCs, CVEs, or findings.
4. Do NOT use a rigid or repetitive template format. Explain the threat context, techniques, affected hosts, and mitigation in fluent, well-structured prose.
5. If specific requested information is not present in the evidence, clearly explain that it is not available in the ingested corpus.

### USER QUERY:
{query}

### RAGSEC RESPONSE:"""
    return prompt, masked_evidence
