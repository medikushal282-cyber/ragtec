"""
ragsec.backend.ingestion.classifier_service
AI-driven + deterministic NLP classifier and tagger for ingested knowledge documents.
Classifies incoming documents into:
- MITRE_PLAYBOOK / MITIGATION_PLAYBOOK
- THREAT_CLASSIFICATION_INTEL
- HYBRID_CTI
And automatically extracts:
- Target Threat Categories (10-category taxonomy)
- MITRE ATT&CK TTPs (e.g. T1486, T1059.001)
- CVEs (e.g. CVE-2023-38831)
- IOCs (IPs, Domains, Hashes)
- Structured Step-by-Step Mitigation Playbook Steps
"""
import re
from typing import Dict, Any, List, Optional
from ingestion.entities import extract_entities_from_text

# Target 10-category taxonomy keywords
TAXONOMY_KEYWORDS = {
    "Ransomware": ["ransomware", "encrypt", "shadow copy", "vssadmin", "ransom note", "decrypt", "blacksuit", "lockbit", "crypted", "wallet", "extortion"],
    "Malware": ["malware", "payload", "trojan", "dropper", "backdoor", "executable", "pe header", "process injection", "binary", "hook"],
    "Trojan": ["trojan", "remote access trojan", "rat", "darkcomet", "njrat", "gh0st", "backdoor access"],
    "Worm": ["worm", "self-replicating", "lateral propagation", "smb spread", "eternalblue", "autorun"],
    "Spyware": ["spyware", "keylogger", "keystroke", "screen capture", "webcam", "credential harvesting", "exfiltrate clipboard", "browser history"],
    "Rootkit": ["rootkit", "kernel driver", "bootkit", "ssdt hook", "hide process", "driver signature enforcement"],
    "Phishing / Credential Theft": ["phishing", "spearphishing", "credential theft", "lsass", "mimikatz", "sekurlsa", "dump creds", "fake login", "sam dump"],
    "Suspicious Script / Execution": ["powershell -enc", "base64", "invoke-expression", "iex", "downloadstring", "certutil", "cmd.exe /c", "wscript", "cscript", "mshta", "bash -i"],
    "Persistence / Privilege Abuse": ["persistence", "registry run key", "scheduled task", "schtasks", "service creation", "privilege escalation", "uac bypass", "token impersonation"],
    "Data Theft / Exfiltration": ["data exfiltration", "data theft", "mega.nz", "cloud upload", "stolen documents", "tar -czf", "zip archive exfil", "c2 egress", "rar a"]
}

# Mitigation / Playbook intent markers
PLAYBOOK_KEYWORDS = [
    "step 1", "step 2", "step 3", "step 4", "step 5",
    "mitigation step", "remediation", "containment", "eradication",
    "isolate host", "isolate endpoint", "quarantine file", "kill process",
    "block ip", "block domain", "firewall rule", "patch advisory",
    "restore backup", "incident response", "playbook", "action item",
    "remedial action", "containment procedure", "procedure:"
]

# Threat intelligence / classification markers
INTEL_KEYWORDS = [
    "threat intelligence", "threat actor", "apt", "campaign", "cve-",
    "vulnerability", "attack vector", "observed in the wild", "telemetry",
    "indicators of compromise", "iocs", "ttps", "mitre att&ck",
    "advisory", "malware analysis", "yara rule", "sigma rule"
]


def _extract_playbook_steps(text: str) -> List[Dict[str, Any]]:
    """
    Parses structured step-by-step mitigation instructions from text.
    Handles 'Step 1:', '1.', 'Action 1:', bullet points under Remediation/Mitigation.
    """
    steps: List[Dict[str, Any]] = []
    lines = text.splitlines()
    
    step_pattern = re.compile(r"^(?:step\s*(\d+)[:.]?|(\d+)\.\s+|action\s*(\d+)[:.]?|\-\s*\[?\s*step\s*(\d+)\s*\]?)(.*)", re.IGNORECASE)
    
    current_step_num = 1
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        m = step_pattern.match(line_clean)
        if m:
            s_num = next((int(g) for g in m.groups()[:4] if g is not None), current_step_num)
            desc = m.group(5).strip()
            
            # Infer action command or type
            action_type = "GENERAL_REMEDIATION"
            if re.search(r"quarantine|isolate.*file", desc, re.IGNORECASE):
                action_type = "QUARANTINE_FILE"
            elif re.search(r"isolate.*(?:host|endpoint|workstation|network)", desc, re.IGNORECASE):
                action_type = "ISOLATE_ENDPOINT"
            elif re.search(r"kill|terminate|stop.*process", desc, re.IGNORECASE):
                action_type = "TERMINATE_PROCESS"
            elif re.search(r"block.*(?:ip|domain|url|c2)", desc, re.IGNORECASE):
                action_type = "BLOCK_C2_IP"
            elif re.search(r"restore|shadow|backup", desc, re.IGNORECASE):
                action_type = "RESTORE_BACKUP"
            elif re.search(r"patch|upgrade|cve", desc, re.IGNORECASE):
                action_type = "APPLY_PATCH"
            elif re.search(r"verify|validate|scan", desc, re.IGNORECASE):
                action_type = "VERIFY_CONTAINMENT"

            steps.append({
                "step": s_num,
                "action_type": action_type,
                "title": f"Step {s_num}: {action_type.replace('_', ' ').title()}",
                "description": desc or line_clean
            })
            current_step_num = s_num + 1

    # Fallback: if no explicit numbered steps, search for imperative mitigation lines
    if not steps:
        mitigation_section = False
        fallback_idx = 1
        for line in lines:
            if re.search(r"(?:mitigation|containment|remediation|response actions|playbook)", line, re.IGNORECASE):
                mitigation_section = True
                continue
            if mitigation_section:
                clean = line.strip(" -*#•\t")
                if len(clean) > 10 and not clean.startswith("http") and fallback_idx <= 5:
                    steps.append({
                        "step": fallback_idx,
                        "action_type": "MITIGATION_ACTION",
                        "title": f"Action {fallback_idx}",
                        "description": clean
                    })
                    fallback_idx += 1

    return steps


def classify_and_tag_knowledge(content: str, title: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes raw text content and returns a rich classification dictionary:
    - doc_type: 'MITIGATION_PLAYBOOK' | 'THREAT_CLASSIFICATION_INTEL' | 'HYBRID_CTI'
    - target_categories: list of detected threat categories
    - extracted_entities: CVEs, TTPs, IPs, Hashes, Domains
    - mitigation_steps: structured list of action items
    - confidence: float 0.0-1.0
    - summary: short 1-2 sentence executive summary
    """
    text_to_analyze = f"{title or ''}\n{content}".strip()
    text_lower = text_to_analyze.lower()

    # 1. Extract raw regex entities
    extracted_entities = extract_entities_from_text(text_to_analyze)

    # 2. Count Playbook vs Intel signals
    playbook_signal_count = sum(1 for kw in PLAYBOOK_KEYWORDS if kw in text_lower)
    intel_signal_count = sum(1 for kw in INTEL_KEYWORDS if kw in text_lower)
    
    # 3. Extract structured playbook steps
    playbook_steps = _extract_playbook_steps(content)
    if len(playbook_steps) >= 2:
        playbook_signal_count += 3

    # 4. Determine Document Type Classification
    if playbook_signal_count >= 3 and intel_signal_count >= 3:
        doc_type = "HYBRID_CTI"
    elif playbook_signal_count >= 2 or len(playbook_steps) >= 2:
        doc_type = "MITIGATION_PLAYBOOK"
    else:
        doc_type = "THREAT_CLASSIFICATION_INTEL"

    # 5. Determine Target Threat Categories (from 10-category taxonomy)
    target_categories = []
    category_scores = {}
    for cat, keywords in TAXONOMY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            category_scores[cat] = score

    # Sort categories by matching score
    sorted_cats = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    if sorted_cats:
        target_categories = [c[0] for c in sorted_cats[:3]]
    else:
        target_categories = ["Threat Intelligence / General CTI"]

    # 6. Calculate Classification Confidence
    total_signals = playbook_signal_count + intel_signal_count + len(extracted_entities.cves) + len(extracted_entities.ttps)
    confidence = min(0.99, max(0.75, 0.70 + (total_signals * 0.03)))

    # 7. Generate Executive Summary
    category_str = ", ".join(target_categories)
    if doc_type == "MITIGATION_PLAYBOOK":
        summary = f"Mitigation Playbook targeting {category_str} with {len(playbook_steps)} structured containment and remediation steps."
    elif doc_type == "HYBRID_CTI":
        summary = f"Hybrid CTI & Response Guide for {category_str}, detailing campaign indicators and {len(playbook_steps)} mitigation procedures."
    else:
        cve_str = f" referencing {', '.join(extracted_entities.cves[:2])}" if extracted_entities.cves else ""
        summary = f"Threat Classification Intelligence on {category_str}{cve_str}, detailing adversary techniques and telemetry."

    # Format entity strings for frontend badges
    formatted_entities = []
    for cve in extracted_entities.cves: formatted_entities.append(f"cve:{cve}")
    for ttp in extracted_entities.ttps: formatted_entities.append(f"ttp:{ttp}")
    for ip in extracted_entities.ips[:4]: formatted_entities.append(f"ip:{ip}")
    for dom in extracted_entities.domains[:4]: formatted_entities.append(f"domain:{dom}")
    for h in extracted_entities.hashes[:3]: formatted_entities.append(f"hash:{h[:10]}...")

    return {
        "doc_type": doc_type,
        "target_categories": target_categories,
        "primary_category": target_categories[0] if target_categories else "Unknown",
        "mitigation_steps": playbook_steps,
        "extracted_entities": formatted_entities,
        "cves": extracted_entities.cves,
        "ttps": extracted_entities.ttps,
        "iocs": {
            "ips": extracted_entities.ips,
            "domains": extracted_entities.domains,
            "hashes": extracted_entities.hashes
        },
        "confidence": round(confidence, 2),
        "summary": summary
    }
