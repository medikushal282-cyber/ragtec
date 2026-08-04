import re
import json
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If the model isn't downloaded yet (e.g. during early test phases), 
    # fallback to a blank English model or prompt the user.
    import spacy.blank
    nlp = spacy.blank("en")

# Add an EntityRuler to catch domains/hostnames
ruler = nlp.add_pipe("entity_ruler", before="ner" if "ner" in nlp.pipe_names else None)
patterns = [
    # Basic domain/hostname pattern (e.g., example.com, RAGSEC-DC01)
    {"label": "HOSTNAME", "pattern": [{"TEXT": {"REGEX": r"(?i)^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$"}}]},
    {"label": "HOSTNAME", "pattern": [{"TEXT": {"REGEX": r"(?i)^[a-z0-9-]{3,15}$"}}]} # very crude flat hostname matcher
]
ruler.add_patterns(patterns)

def extract_entities(text: str) -> str:
    """
    Extracts entities using Regex (CVEs, IPs, Hashes, MITRE) and Spacy (Hostnames).
    Returns a JSON string list of extracted tags.
    """
    entities = set()
    
    # 1. Regex Extractions
    # CVE IDs
    cves = re.findall(r"CVE-\d{4}-\d+", text, re.IGNORECASE)
    entities.update(cves)
    
    # MITRE ATT&CK T-codes
    tcodes = re.findall(r"T\d{4}(?:\.\d{3})?", text)
    entities.update(tcodes)
    
    # IP Addresses (IPv4)
    ips = re.findall(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", text)
    entities.update(ips)
    
    # MD5 / SHA Hashes
    # Match 32 (MD5), 40 (SHA-1), 64 (SHA-256) hex chars
    hashes = re.findall(r"\b([a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b", text)
    entities.update(hashes)
    
    # 2. Spacy Extractions for Hostnames
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "HOSTNAME":
            entities.add(ent.text)
            
    return json.dumps(list(entities))
