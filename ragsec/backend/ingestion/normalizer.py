"""
ragsec.backend.ingestion.normalizer
Normalizes raw incoming content:
- Removes control characters and harmful non-printable bytes
- Standardizes line breaks
- Computes SHA-256 content hash for deduplication
- Treats all incoming text as UNTRUSTED evidence data
"""
import hashlib
import re
from typing import Tuple

def normalize_text(raw_text: str) -> Tuple[str, str]:
    """
    Normalizes whitespace and cleans invalid control characters.
    Returns (cleaned_text, sha256_hash).
    """
    if not raw_text:
        return "", ""
        
    # Standardize line endings to \n
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    
    # Strip non-printable control characters (except newline, tab)
    text = re.sub(r'[^\x20-\x7E\n\t]', '', text)
    
    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Trim leading/trailing whitespace
    clean_text = text.strip()
    
    content_hash = hashlib.sha256(clean_text.encode('utf-8')).hexdigest()
    return clean_text, content_hash
