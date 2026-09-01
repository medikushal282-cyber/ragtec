import re
import os
from typing import Dict, Any, List, Optional
from domain.soc_models import ThreatCategory, ClassificationState, ThreatClassification

TEXT_EXTENSIONS = {
    '.ps1', '.bat', '.cmd', '.sh', '.py', '.js', '.vbs', '.php',
    '.txt', '.yaml', '.yml', '.json', '.conf', '.ini', '.log', '.csv', '.xml'
}

DANGEROUS_EXTENSIONS = {
    '.exe': (ThreatCategory.MALWARE, 'high', 'Executable binary placed in user-accessible workspace'),
    '.dll': (ThreatCategory.MALWARE, 'high', 'Dynamic link library drop detected'),
    '.crypted': (ThreatCategory.RANSOMWARE, 'critical', 'Ransomware encryption artifact identified by file extension'),
    '.locked': (ThreatCategory.RANSOMWARE, 'critical', 'Encrypted file artifact (.locked extension)'),
    '.ps1': (ThreatCategory.TROJAN, 'high', 'PowerShell script deployment in monitored workspace'),
    '.vbs': (ThreatCategory.MALWARE, 'high', 'VBScript automation payload drop'),
    '.bat': (ThreatCategory.TROJAN, 'medium', 'Batch execution script created'),
    '.cmd': (ThreatCategory.TROJAN, 'medium', 'Command script created in workspace'),
    '.php': (ThreatCategory.MALWARE, 'high', 'PHP script in web directory candidate (potential Web Shell)')
}

SIGNATURE_PATTERNS = [
    (r'ransom|readme_decrypt|how_to_decrypt|your_files_are_encrypted', ThreatCategory.RANSOMWARE, 'critical', 'Ransomware extortion note or indicator'),
    (r'vssadmin.*delete.*shadows|wmic.*shadowcopy.*delete', ThreatCategory.RANSOMWARE, 'critical', 'Shadow copy deletion command (Ransomware precursor)'),
    (r'downloadstring|invoke-webrequest|curl.*http|wget.*http', ThreatCategory.PHISHING, 'high', 'Remote payload download cradle'),
    (r'iex\s*\(|invoke-expression|powershell.*-enc|encodedcommand', ThreatCategory.TROJAN, 'high', 'PowerShell memory execution / Obfuscated execution cradle'),
    (r'mimikatz|sekurlsa|lsass|procdump', ThreatCategory.BRUTE_FORCE, 'critical', 'Credential dumping / LSASS memory access artifact'),
    (r'eval\s*\(\s*\|shell_exec|system\s*\(|passthru', ThreatCategory.MALWARE, 'high', 'Web shell backdoor execution function'),
    (r'beacon_interval|c2-tracker|badguy-command|\/bin\/bash\s*-i', ThreatCategory.C2, 'critical', 'Command & Control beaconing or interactive reverse shell'),
    (r'security\.evtx|security\.log', ThreatCategory.INSIDER_THREAT, 'high', 'Security event log tampering or clearing')
]

def safe_read_snippet(filepath: str, max_bytes: int = 4096) -> str:
    if not os.path.exists(filepath) or os.path.isdir(filepath):
        return ''
    ext = os.path.splitext(filepath)[1].lower()
    if ext not in TEXT_EXTENSIONS and ext != '':
        try:
            if os.path.getsize(filepath) > 102400:
                return ''
        except Exception:
            return ''
    try:
        with open(filepath, 'rb') as f:
            chunk = f.read(max_bytes)
            if b'\x00' in chunk:
                return ''
            return chunk.decode('utf-8', errors='replace')
    except Exception:
        return ''

class ThreatAnalyzer:
    def __init__(self):
        pass

    def analyze(self, filepath: str, action: str, file_hash: str = '', snippet: str = '') -> Dict[str, Any]:
        filename = os.path.basename(filepath)
        filename_lower = filename.lower()
        ext = os.path.splitext(filename_lower)[1]
        
        indicators = []
        is_threat = False
        matched_category = ThreatCategory.BENIGN
        severity = 'low'
        confidence = 0.95
        rationale = f'File {action.lower()} appears benign under normal operation.'
        detection_method = 'DETERMINISTIC_RULES'
        
        if ext in DANGEROUS_EXTENSIONS:
            cat, sev, rat = DANGEROUS_EXTENSIONS[ext]
            matched_category = cat
            severity = sev
            rationale = f'{rat} ({filename})'
            indicators.append(f'extension:{ext}')
            is_threat = True
            confidence = 0.88

        for pattern, cat, sev, desc in SIGNATURE_PATTERNS:
            if re.search(pattern, filename_lower):
                matched_category = cat
                severity = sev
                rationale = f'{desc} in filename ({filename})'
                indicators.append(f'filename_match:{pattern}')
                is_threat = True
                confidence = 0.92
                break

        if snippet:
            snippet_lower = snippet.lower()
            for pattern, cat, sev, desc in SIGNATURE_PATTERNS:
                if re.search(pattern, snippet_lower):
                    matched_category = cat
                    severity = sev
                    rationale = f'{desc} identified in file content payload'
                    indicators.append(f'content_signature:{pattern}')
                    is_threat = True
                    confidence = 0.96
                    break

        if action.upper() == 'DELETED' and ('security' in filename_lower or 'log' in filename_lower):
            matched_category = ThreatCategory.INSIDER_THREAT
            severity = 'high'
            rationale = f'Security-relevant log file deletion detected ({filename}) - potential track covering'
            indicators.append('action:log_tampering')
            is_threat = True
            confidence = 0.90

        mitigation_steps = self._generate_mitigation_steps(matched_category, severity, filepath, filename)

        return {
            'is_threat': is_threat,
            'classification': matched_category.value,
            'severity': severity.capitalize(),
            'confidence': round(confidence, 2),
            'rationale': rationale,
            'detection_method': detection_method,
            'indicators': indicators,
            'mitigation_steps': mitigation_steps
        }

    def _generate_mitigation_steps(self, category: ThreatCategory, severity: str, filepath: str, filename: str) -> List[Dict[str, str]]:
        steps = [
            {
                'step': 1,
                'title': 'Quarantine File',
                'action': 'QUARANTINE_FILE',
                'target': filepath,
                'description': f'Move {filename} to the isolated .quarantine security enclave and revoke read/execute permissions.'
            },
            {
                'step': 2,
                'title': 'Investigate Origin & Parent Process',
                'action': 'PROCESS_TRIAGE',
                'target': 'Host Endpoint',
                'description': 'Inspect process tree, active network sockets, and scheduled tasks related to the file creation.'
            }
        ]

        if category in [ThreatCategory.RANSOMWARE, ThreatCategory.TROJAN]:
            steps.append({
                'step': 3,
                'title': 'Endpoint Network Isolation',
                'action': 'ISOLATE_ENDPOINT',
                'target': 'Local Subnet',
                'description': 'Logically sever external connectivity to prevent lateral movement and C2 communications.'
            })
            steps.append({
                'step': 4,
                'title': 'Validate Shadow Copies & Backups',
                'action': 'RESTORE_BACKUP',
                'target': 'VSS / Cloud Storage',
                'description': 'Verify volume shadow copy integrity and prepare clean point-in-time recovery.'
            })
        elif category in [ThreatCategory.C2, ThreatCategory.PHISHING]:
            steps.append({
                'step': 3,
                'title': 'Block Remote Domain / IP at Edge',
                'action': 'BLOCK_IP',
                'target': 'Edge Gateway',
                'description': 'Deploy perimeter firewall block rules for external download URLs and beaconing IPs.'
            })
        else:
            steps.append({
                'step': 3,
                'title': 'Workspace Integrity Scan',
                'action': 'INTEGRITY_SCAN',
                'target': 'Workspace',
                'description': 'Execute a recursive SHA-256 integrity scan across all neighbor directories.'
            })

        return steps

threat_analyzer = ThreatAnalyzer()
