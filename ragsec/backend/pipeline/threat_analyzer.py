import re
import os
import base64
from typing import Dict, Any, List, Optional
from domain.soc_models import ThreatCategory, ClassificationState, ThreatClassification
from analysis.static_analyzer import run_static_analysis, calculate_shannon_entropy, generate_remediated_code

TEXT_EXTENSIONS = {
    '.ps1', '.bat', '.cmd', '.sh', '.py', '.js', '.vbs', '.php',
    '.txt', '.yaml', '.yml', '.json', '.conf', '.ini', '.log', '.csv', '.xml'
}

DANGEROUS_EXTENSIONS = {
    '.crypted': (ThreatCategory.RANSOMWARE, 'critical', 'Ransomware encryption artifact identified by file extension'),
    '.locked': (ThreatCategory.RANSOMWARE, 'critical', 'Encrypted file artifact (.locked extension)'),
}

SIGNATURE_PATTERNS = [
    (r'vssadmin.*delete.*shadows|wmic.*shadowcopy.*delete', ThreatCategory.RANSOMWARE, 'critical', 'Shadow copy deletion command (Ransomware precursor)'),
    (r'downloadstring|invoke-webrequest|curl.*http|wget.*http', ThreatCategory.PHISHING, 'high', 'Remote payload download cradle'),
    (r'iex\s*\(|invoke-expression|powershell.*-enc|encodedcommand', ThreatCategory.TROJAN, 'high', 'PowerShell memory execution / Obfuscated execution cradle'),
    (r'mimikatz|sekurlsa|lsass|procdump|dumpcreds', ThreatCategory.BRUTE_FORCE, 'critical', 'Credential dumping / LSASS memory access artifact'),
    (r'eval\s*\(\s*|shell_exec|system\s*\(|passthru', ThreatCategory.MALWARE, 'high', 'Web shell backdoor execution function'),
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
        rationale = f'File {action.lower()} verified benign based on content inspection.'
        detection_method = 'CONTENT_HEURISTIC_ENGINE'

        # Read actual file content bytes if file exists
        raw_bytes = b""
        if os.path.exists(filepath) and not os.path.isdir(filepath):
            try:
                with open(filepath, "rb") as f:
                    raw_bytes = f.read(2 * 1024 * 1024)
            except Exception:
                pass

        if not raw_bytes and snippet:
            raw_bytes = snippet.encode("utf-8", errors="ignore")

        # Static content analysis
        static_res = run_static_analysis(filename, raw_bytes) if raw_bytes else None
        rule_signals = static_res.signals if static_res else []
        entropy_val = static_res.entropy if static_res else 0.0

        # Automatic base64 decoding check for obfuscated payloads in content
        decoded_threats = []
        try:
            content_sample = raw_bytes.decode("utf-8", errors="replace")
            for b64 in re.findall(r'[A-Za-z0-9+/]{20,}={0,2}', content_sample)[:6]:
                try:
                    dec = base64.b64decode(b64).decode("utf-8", errors="ignore")
                    if any(kw in dec.lower() for kw in ["mimikatz", "dumpcreds", "vssadmin", "shadowcopy", "downloadstring", "virtualalloc"]):
                        decoded_threats.append(dec[:80])
                        indicators.append(f"deobfuscated_threat:{dec[:60]}")
                except Exception:
                    pass
        except Exception:
            pass

        # Multi-factor formula calculation
        sev3_signals = [s for s in rule_signals if s.severity_weight >= 3]
        sev2_signals = [s for s in rule_signals if s.severity_weight == 2]
        sev1_signals = [s for s in rule_signals if s.severity_weight == 1]

        signal_points = (len(sev3_signals) * 35) + (len(sev2_signals) * 20) + (len(sev1_signals) * 10)
        entropy_points = 25 if entropy_val >= 7.2 and len(raw_bytes) >= 256 else (15 if entropy_val >= 6.8 and len(raw_bytes) >= 256 else 0)
        decoded_points = 35 if decoded_threats else 0

        raw_score = signal_points + entropy_points + decoded_points

        for s in rule_signals:
            indicators.append(f"content_signal:{s.label}")

        if ext in DANGEROUS_EXTENSIONS:
            cat, sev, rat = DANGEROUS_EXTENSIONS[ext]
            matched_category = cat
            severity = sev
            indicators.append(f"ransomware_extension:{ext}")
            is_threat = True
            raw_score = max(raw_score, 90)

        if len(sev3_signals) > 0 or decoded_threats or raw_score >= 60:
            is_threat = True
            risk_score = min(100, max(75, raw_score))
        elif len(rule_signals) >= 1:
            is_threat = True
            risk_score = min(100, max(65, raw_score))
        else:
            is_threat = False
            risk_score = min(15, int(entropy_val * 2))

        # Check for SAST Vulnerable Code if not active threat
        is_vulnerable = False
        vuln_details = None
        mitigation_options = []
        suggested_patch = None
        vulnerabilities = static_res.vulnerabilities if static_res else []

        if not is_threat and vulnerabilities:
            is_vulnerable = True
            prim_vuln = vulnerabilities[0]
            matched_category = ThreatCategory.VULNERABLE_CODE
            severity = prim_vuln.severity.lower()
            risk_score = prim_vuln.risk_score
            detection_method = 'SAST_STATIC_ENGINE'
            rationale = f"SAST Code Analysis: {prim_vuln.title} ({prim_vuln.cwe}) detected at line {prim_vuln.line_no}. {prim_vuln.description}"
            indicators.append(f"sast_vulnerability:{prim_vuln.cwe}")
            raw_text = raw_bytes.decode('utf-8', errors='replace') if raw_bytes else snippet
            suggested_patch = generate_remediated_code(raw_text, prim_vuln.vulnerability_type)
            mitigation_options = prim_vuln.mitigation_options
            vuln_details = {
                "vulnerability_type": prim_vuln.vulnerability_type,
                "cwe": prim_vuln.cwe,
                "title": prim_vuln.title,
                "severity": prim_vuln.severity.upper(),
                "line_no": prim_vuln.line_no,
                "line_content": prim_vuln.line_content,
                "description": prim_vuln.description,
                "recommended_mitigation": prim_vuln.recommended_mitigation,
                "mitigation_options": prim_vuln.mitigation_options,
                "suggested_patch": suggested_patch
            }
        elif is_threat:
            all_labels = " ".join(s.label.lower() for s in rule_signals)
            if decoded_threats:
                all_labels += " " + " ".join(decoded_threats).lower()

            if "shadow copy" in all_labels or "ransom" in all_labels or "encrypt" in all_labels or "vssadmin" in all_labels:
                matched_category = ThreatCategory.RANSOMWARE
                severity = 'critical'
            elif "mimikatz" in all_labels or "credential" in all_labels or "dumpcreds" in all_labels or "lsass" in all_labels:
                matched_category = ThreatCategory.TROJAN
                severity = 'critical'
            elif "injection" in all_labels or "virtualalloc" in all_labels or "process" in all_labels:
                matched_category = ThreatCategory.MALWARE
                severity = 'critical'
            elif "web shell" in all_labels or "eval" in all_labels:
                matched_category = ThreatCategory.MALWARE
                severity = 'high'
            elif "download" in all_labels or "cradle" in all_labels:
                matched_category = ThreatCategory.PHISHING
                severity = 'high'
            else:
                matched_category = ThreatCategory.MALWARE
                severity = 'high'

            rationale = f"Harmful payload detected via deep content inspection. Identified {len(rule_signals)} behavioral indicators (Risk: {risk_score}/100)."
        else:
            matched_category = ThreatCategory.BENIGN
            severity = 'low'
            rationale = f"File {action.lower()} verified safe. Content inspection detected 0 malicious patterns (Risk: {risk_score}/100)."

        if action.upper() == 'DELETED' and ('security' in filename_lower or 'log' in filename_lower):
            matched_category = ThreatCategory.INSIDER_THREAT
            severity = 'high'
            is_threat = True
            risk_score = 85
            rationale = f'Security-relevant log file deletion detected ({filename}) - potential track covering'
            indicators.append('action:log_tampering')

        mitigation_steps = self._generate_mitigation_steps(matched_category, severity, filepath, filename)

        verdict_val = "UNSAFE" if is_threat else ("VULNERABLE" if is_vulnerable else "SAFE")
        cls_val = f"Vulnerable Code: {prim_vuln.title}" if is_vulnerable else matched_category.value

        return {
            'is_threat': is_threat,
            'is_vulnerable': is_vulnerable,
            'verdict': verdict_val,
            'threat_state': verdict_val,
            'classification': cls_val,
            'severity': severity.capitalize(),
            'confidence': 0.98 if (is_threat or is_vulnerable) else 0.95,
            'risk_score': risk_score,
            'entropy': round(entropy_val, 3),
            'rationale': rationale,
            'detection_method': detection_method,
            'indicators': indicators,
            'mitigation_steps': mitigation_steps,
            'vulnerability_details': vuln_details,
            'mitigation_options': mitigation_options,
            'suggested_patch': suggested_patch
        }

    def _generate_mitigation_steps(self, category: ThreatCategory, severity: str, filepath: str, filename: str) -> List[Dict[str, str]]:
        if category == ThreatCategory.VULNERABLE_CODE:
            return [
                {
                    'step': 1,
                    'title': 'Apply SAST Security Remediation',
                    'action': 'APPLY_SAST_PATCH',
                    'target': filepath,
                    'description': f'Remediate vulnerability in {filename} using automated parameterized code pattern.'
                },
                {
                    'step': 2,
                    'title': 'SAST Regression Verification',
                    'action': 'REGRESSION_TEST',
                    'target': 'CI/CD Pipeline',
                    'description': 'Run automated unit & integration test suites to ensure zero functionality breaks.'
                },
                {
                    'step': 3,
                    'title': 'Code Review & Security Sign-off',
                    'action': 'SECURITY_REVIEW',
                    'target': 'Git Repository',
                    'description': 'Peer-review sanitized input queries before staging to production.'
                }
            ]

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
