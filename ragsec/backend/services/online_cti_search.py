"""
ragsec.backend.services.online_cti_search
Online CTI & Technical Knowledge Search Engine.
Queries live online cybersecurity databases (DuckDuckGo, NIST NVD, MITRE ATT&CK, Microsoft Learn)
when 'Seek Online Sources' is enabled in the RAGSec Step & Problem Helper.
"""
import re
import urllib.parse
from typing import List, Dict, Any, Optional
import requests

HEADERS = {
    "User-Agent": "RAGSec-Autonomous-SOC/1.0 (Cybersecurity Threat Intelligence Grounding)",
    "Accept": "application/json, text/html, */*"
}

MITRE_TECHNIQUES_MAP = {
    "T1490": {
        "title": "MITRE ATT&CK T1490: Inhibit System Recovery",
        "url": "https://attack.mitre.org/techniques/T1490/",
        "source": "MITRE ATT&CK",
        "snippet": "Adversaries may delete or remove built-in data recovery features (such as Windows Volume Shadow Copies via vssadmin or wbadmin, and bcdedit recovery options) to prevent system restoration."
    },
    "T1486": {
        "title": "MITRE ATT&CK T1486: Data Encrypted for Impact",
        "url": "https://attack.mitre.org/techniques/T1486/",
        "source": "MITRE ATT&CK",
        "snippet": "Adversaries may encrypt data on target systems to interrupt availability to system and network resources. Requires immediate process tree termination and offline snapshot recovery."
    },
    "T1059": {
        "title": "MITRE ATT&CK T1059: Command and Scripting Interpreter",
        "url": "https://attack.mitre.org/techniques/T1059/",
        "source": "MITRE ATT&CK",
        "snippet": "Adversaries may abuse command and script interpreters (PowerShell, Windows Command Shell, Bash) to execute commands, scripts, or binaries."
    },
    "T1562": {
        "title": "MITRE ATT&CK T1562: Impair Defenses",
        "url": "https://attack.mitre.org/techniques/T1562/",
        "source": "MITRE ATT&CK",
        "snippet": "Adversaries may modify system components, stop security services, or modify firewall configurations to bypass defensive mechanisms."
    },
    "T1078": {
        "title": "MITRE ATT&CK T1078: Valid Accounts",
        "url": "https://attack.mitre.org/techniques/T1078/",
        "source": "MITRE ATT&CK",
        "snippet": "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion."
    }
}


def search_online_cti_sources(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
    """
    Searches online threat intelligence databases and documentation.
    Extracts relevant sources, snippets, and official links.
    """
    results: List[Dict[str, Any]] = []
    seen_urls = set()

    # 1. Check for MITRE ATT&CK Technique Identifiers (e.g. T1490, T1059.001)
    mitre_match = re.search(r"\b(T1\d{3}(?:\.\d{3})?)\b", query, re.IGNORECASE)
    if mitre_match:
        tid = mitre_match.group(1).upper()
        base_tid = tid.split(".")[0]
        if base_tid in MITRE_TECHNIQUES_MAP:
            info = MITRE_TECHNIQUES_MAP[base_tid].copy()
            if "." in tid:
                info["title"] = f"MITRE ATT&CK {tid}: Sub-technique"
                info["url"] = f"https://attack.mitre.org/techniques/{tid.replace('.', '/')}/"
            results.append(info)
            seen_urls.add(info["url"])
        else:
            url = f"https://attack.mitre.org/techniques/{tid.replace('.', '/')}/"
            results.append({
                "title": f"MITRE ATT&CK Technique {tid}",
                "url": url,
                "source": "MITRE ATT&CK",
                "snippet": f"Official adversary behavior specifications and mitigation guidance for technique {tid}."
            })
            seen_urls.add(url)

    # 2. Check for CVE Identifiers (e.g. CVE-2021-44228, CVE-2024-...)
    cve_matches = re.findall(r"\b(CVE-\d{4}-\d{4,7})\b", query, re.IGNORECASE)
    for cve in cve_matches:
        cve_id = cve.upper()
        nvd_url = f"https://nvd.nist.gov/vuln/detail/{cve_id}"
        if nvd_url not in seen_urls:
            # Query CIRCL / NIST for live summary if possible
            summary = f"National Vulnerability Database record for {cve_id}. Inspect CVSS severity, affected CPE vectors, and official vendor mitigations."
            try:
                r_cve = requests.get(f"https://cve.circl.lu/api/cve/{cve_id}", headers=HEADERS, timeout=3.0)
                if r_cve.status_code == 200 and r_cve.json():
                    cve_json = r_cve.json()
                    summary = cve_json.get("summary") or summary
            except Exception:
                pass

            results.append({
                "title": f"NIST NVD Advisory: {cve_id}",
                "url": nvd_url,
                "source": "NIST NVD",
                "snippet": summary[:250] + "..." if len(summary) > 250 else summary
            })
            seen_urls.add(nvd_url)

    # 3. Query DuckDuckGo Instant Answer API for live technical intelligence
    try:
        clean_q = re.sub(r"[^\w\s-]", " ", query).strip()
        encoded_q = urllib.parse.quote_plus(f"{clean_q} cybersecurity remediation")
        ddg_url = f"https://api.duckduckgo.com/?q={encoded_q}&format=json&no_html=1&skip_disambig=1"
        r_ddg = requests.get(ddg_url, headers=HEADERS, timeout=4.0)
        if r_ddg.status_code in (200, 202):
            data = r_ddg.json()
            if data.get("Abstract") and data.get("AbstractURL") and data.get("AbstractURL") not in seen_urls:
                results.append({
                    "title": data.get("Heading") or f"Intelligence Reference: {clean_q[:30]}",
                    "url": data.get("AbstractURL"),
                    "source": data.get("AbstractSource") or "Web Security Corpus",
                    "snippet": data.get("Abstract")[:250] + "..."
                })
                seen_urls.add(data.get("AbstractURL"))

            for topic in data.get("RelatedTopics", [])[:3]:
                if isinstance(topic, dict) and topic.get("FirstURL") and topic.get("FirstURL") not in seen_urls:
                    results.append({
                        "title": topic.get("Text", "").split(" - ")[0] if " - " in topic.get("Text", "") else "Related Security Topic",
                        "url": topic.get("FirstURL"),
                        "source": "Online Intelligence",
                        "snippet": topic.get("Text", "")[:200]
                    })
                    seen_urls.add(topic.get("FirstURL"))
    except Exception:
        pass

    # 4. Contextual Fallbacks based on keywords (Windows / PowerShell / Ransomware / Access Denied)
    q_lower = query.lower()
    if ("vssadmin" in q_lower or "shadow" in q_lower) and "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/vssadmin" not in seen_urls:
        results.append({
            "title": "Microsoft Learn: vssadmin delete shadows Command Reference",
            "url": "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/vssadmin-delete-shadows",
            "source": "Microsoft Learn",
            "snippet": "Detailed command syntax and access requirements for vssadmin. Requires elevated Administrator token (RunAs Administrator) or Volume Snapshot Service privilege."
        })
        seen_urls.add("https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/vssadmin-delete-shadows")

    if ("access denied" in q_lower or "permission" in q_lower or "0x80070005" in q_lower) and "https://learn.microsoft.com/en-us/troubleshoot/windows-server/" not in seen_urls:
        results.append({
            "title": "Microsoft Troubleshooting: Resolving Error 0x80070005 (Access is Denied)",
            "url": "https://learn.microsoft.com/en-us/troubleshoot/windows-client/deployment/error-0x80070005-access-denied",
            "source": "Microsoft Documentation",
            "snippet": "Explains remediation steps when administrative commands fail with Access Denied. Ensure PowerShell is spawned with elevated SeDebugPrivilege or SYSTEM rights."
        })
        seen_urls.add("https://learn.microsoft.com/en-us/troubleshoot/windows-client/deployment/error-0x80070005-access-denied")

    if ("sql injection" in q_lower or "cwe-89" in q_lower) and "https://cwe.mitre.org/data/definitions/89.html" not in seen_urls:
        results.append({
            "title": "MITRE CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
            "url": "https://cwe.mitre.org/data/definitions/89.html",
            "source": "MITRE CWE",
            "snippet": "Official CWE guidance on SQL Injection prevention. Use parameterized queries, prepared statements (cursor.execute('... ?', (val,))), and input sanitation."
        })
        seen_urls.add("https://cwe.mitre.org/data/definitions/89.html")

    if ("ransomware" in q_lower or "lockbit" in q_lower) and "https://www.cisa.gov/stopransomware" not in seen_urls:
        results.append({
            "title": "CISA StopRansomware Guide & Response Checklist",
            "url": "https://www.cisa.gov/stopransomware",
            "source": "CISA / US-CERT",
            "snippet": "Federal guide for detecting, containing, and recovering from ransomware incidents. Recommends immediate network segment isolation and forensic preservation."
        })
        seen_urls.add("https://www.cisa.gov/stopransomware")

    return results[:max_results]
