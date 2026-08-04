"""
masking/mask.py
Compliance buffer: regex-based masking applied to chunk text
BEFORE it is assembled into any LLM prompt.
"""
import re

def mask_chunk(text: str) -> tuple[str, list[dict]]:
    """
    Mask sensitive patterns in a chunk. Returns (masked_text, redactions_log).
    Replacements use placeholder tokens so the LLM still understands context
    (e.g. "an IP was involved") without seeing the real value.
    """
    redactions = []

    # IP addresses (IPv4)
    def replace_ip(m):
        redactions.append({"type": "IP", "original": m.group(0)})
        return "[IP_REDACTED]"
    text = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', replace_ip, text)

    # Internal hostnames matching common SOP/incident naming patterns
    # e.g. WS-10-45, FS-CORP-01, DC-01, SRV-APP-02
    def replace_host(m):
        redactions.append({"type": "HOST", "original": m.group(0)})
        return "[HOST_REDACTED]"
    text = re.sub(
        r'\b(?:WS|FS|DC|SRV|SERVER|CORP|APP|DB|WEB|MAIL|VPN)-[A-Z0-9\-]{2,20}\b',
        replace_host, text, flags=re.IGNORECASE
    )

    # Employee identifiers from synthetic incident data (name@company or EMP-XXXXX)
    def replace_emp(m):
        redactions.append({"type": "EMP_ID", "original": m.group(0)})
        return "[EMP_REDACTED]"
    text = re.sub(r'\bEMP-\d{3,8}\b', replace_emp, text)

    # Email addresses
    def replace_email(m):
        redactions.append({"type": "EMAIL", "original": m.group(0)})
        return "[EMAIL_REDACTED]"
    text = re.sub(
        r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,7}\b',
        replace_email, text
    )

    return text, redactions
