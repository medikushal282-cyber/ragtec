import uuid
import datetime
from typing import List, Dict, Any
from .base import BaseAdapter

class SyntheticIncidentAdapter(BaseAdapter):
    update_frequency = "manual"

    def fetch(self) -> List[Dict[str, Any]]:
        print("Generating synthetic incidents...")
        
        incidents = [
            {
                "title": "Synthetic Incident: Phishing leading to Credential Compromise",
                "body": """# Incident Report: INC-2026-001
## Summary
At 08:00 UTC, a user in the Finance department received a spear-phishing email containing a malicious link mimicking the corporate SSO portal.
The user submitted their credentials.
## Technical Details
- **Attacker IP**: 198.51.100.45
- **Compromised Account**: j.doe@ragsec.local
- **Actions Taken**: The attacker used the compromised credentials to log into the internal VPN at 08:15 UTC.
- **MITRE ATT&CK**: T1566 (Phishing), T1078 (Valid Accounts)
## Status
Resolved. Account passwords reset and MFA enforced.""",
            },
            {
                "title": "Synthetic Incident: Ransomware Execution on Endpoint",
                "body": """# Incident Report: INC-2026-002
## Summary
Endpoint WIN-DESK-402 exhibited rapid file encryption behavior at 14:30 UTC. 
## Technical Details
- **Malware Signature**: Detected behaviors matching WannaCry variants.
- **Lateral Movement**: Attempted lateral movement via SMB (Port 445) blocked by internal firewall.
- **MITRE ATT&CK**: T1486 (Data Encrypted for Impact), T1210 (Exploitation of Remote Services)
## Status
Contained. Endpoint WIN-DESK-402 isolated from the network. Remediation pending.""",
            },
            {
                "title": "Synthetic Incident: Suspicious Account Takeover Activity",
                "body": """# Incident Report: INC-2026-003
## Summary
Multiple failed login attempts followed by a successful login from an anomalous geolocation (IP: 203.0.113.88).
## Technical Details
- **Account**: admin_service_acct
- **Activity**: Accessed restricted HR databases and attempted bulk export.
- **MITRE ATT&CK**: T1078 (Valid Accounts), T1111 (Two-Factor Authentication Interception)
## Status
Under Investigation. Account suspended."""
            }
        ]

        documents = []
        for inc in incidents:
            doc_id = f"synth-{uuid.uuid4().hex[:8]}"
            doc = {
                "id": doc_id,
                "source_type": "synthetic",
                "title": inc["title"],
                "body": inc["body"],
                "published_date": datetime.datetime.utcnow(),
                "sensitivity_tier": "restricted",
                "url": None
            }
            documents.append(doc)

        return documents
