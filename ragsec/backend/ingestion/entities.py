"""
ragsec.backend.ingestion.entities
Regex-based cybersecurity entity extraction:
- IPv4 addresses
- Domains
- Enterprise hostnames
- Hashes (MD5, SHA1, SHA256)
- CVE identifiers
- MITRE ATT&CK techniques & tactics
"""
import re
from typing import Dict, List, Set
from models import ExtractedEntities

IPV4_PATTERN = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
DOMAIN_PATTERN = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|biz|info|xyz|ru|cn|internal|local|corp)\b', re.IGNORECASE)
HOSTNAME_PATTERN = re.compile(r'\b(?:WS|FS|DC|SRV|SERVER|CORP|APP|DB|WEB|MAIL|VPN)-[A-Z0-9\-]{2,20}\b', re.IGNORECASE)
HASH_MD5_PATTERN = re.compile(r'\b[a-fA-F0-9]{32}\b')
HASH_SHA1_PATTERN = re.compile(r'\b[a-fA-F0-9]{40}\b')
HASH_SHA256_PATTERN = re.compile(r'\b[a-fA-F0-9]{64}\b')
CVE_PATTERN = re.compile(r'\bCVE-\d{4}-\d{4,7}\b', re.IGNORECASE)
TTP_PATTERN = re.compile(r'\bT\d{4}(?:\.\d{3})?\b|\bTA\d{4}\b', re.IGNORECASE)

def extract_entities_from_text(text: str) -> ExtractedEntities:
    """Extracts and deduplicates cybersecurity entities from raw text."""
    ips = sorted(list(set(IPV4_PATTERN.findall(text))))
    domains = sorted(list(set(m.lower() for m in DOMAIN_PATTERN.findall(text))))
    hostnames = sorted(list(set(m.upper() for m in HOSTNAME_PATTERN.findall(text))))
    
    hashes = set(HASH_MD5_PATTERN.findall(text)) | set(HASH_SHA1_PATTERN.findall(text)) | set(HASH_SHA256_PATTERN.findall(text))
    sorted_hashes = sorted(list(hashes))
    
    cves = sorted(list(set(m.upper() for m in CVE_PATTERN.findall(text))))
    ttps = sorted(list(set(m.upper() for m in TTP_PATTERN.findall(text))))
    
    return ExtractedEntities(
        ips=ips,
        domains=domains,
        hostnames=hostnames,
        hashes=sorted_hashes,
        cves=cves,
        ttps=ttps
    )
