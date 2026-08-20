import re
from typing import Dict, Any, Tuple
from domain.soc_models import ThreatCategory, ClassificationState, ThreatClassification

class RuleBasedClassifier:
    def __init__(self):
        self.rules = [
            (ThreatCategory.PHISHING, [r"suspicious link", r"phishing", r"credential harvest", r"oauth spoof", r"downloadstring.*http"]),
            (ThreatCategory.RANSOMWARE, [r"encryption of", r"shadow cop(?:y|ies) deleted", r"vssadmin", r"ransom note", r"\.crypted"]),
            (ThreatCategory.SPYWARE, [r"keylogger", r"key_hook", r"unauthorized audio", r"screen capture", r"mic access"]),
            (ThreatCategory.TROJAN, [r"masquerading", r"backdoor", r"svchost\.exe spawned cmd\.exe"]),
            (ThreatCategory.BRUTE_FORCE, [r"failed login attempts", r"logon bursts", r"kerberoasting", r"brute[- ]force"]),
            (ThreatCategory.DOS_DDOS, [r"syn flood", r"http request flood", r"packets per second", r"ddos"]),
            (ThreatCategory.DATA_EXFILTRATION, [r"gb of.*transferred", r"dns tunneling", r"exfiltration", r"high volume egress"]),
            (ThreatCategory.C2, [r"beaconing", r"periodic dns", r"c2-tracker", r"command and control"]),
            (ThreatCategory.INSIDER_THREAT, [r"accessed all.*3:00 am", r"off-hours bulk access", r"privilege misuse"]),
            (ThreatCategory.MALWARE, [r"cobalt strike", r"executable drops", r"malware detected", r"signature match"])
        ]

    def classify_event(self, raw_message: str, is_suspicious: bool) -> ThreatClassification:
        if not is_suspicious:
            return ThreatClassification(
                state=ClassificationState.BENIGN,
                category=ThreatCategory.BENIGN,
                confidence=0.95,
                severity="low",
                rationale="Event does not meet suspiciousness criteria."
            )

        msg_lower = raw_message.lower()
        matched_category = None
        
        for category, patterns in self.rules:
            for pattern in patterns:
                if re.search(pattern, msg_lower):
                    matched_category = category
                    break
            if matched_category:
                break
        
        if matched_category:
            # Assign severity based on category (simple heuristic for MVP)
            severity = "medium"
            if matched_category in [ThreatCategory.RANSOMWARE, ThreatCategory.C2, ThreatCategory.DATA_EXFILTRATION]:
                severity = "critical"
            elif matched_category in [ThreatCategory.TROJAN, ThreatCategory.DOS_DDOS, ThreatCategory.INSIDER_THREAT]:
                severity = "high"
                
            return ThreatClassification(
                state=ClassificationState.THREAT,
                category=matched_category,
                confidence=0.85,
                severity=severity,
                rationale=f"Pattern match for {matched_category.value} found in event payload."
            )
        
        # If suspicious but doesn't match any specific threat rule
        return ThreatClassification(
            state=ClassificationState.UNKNOWN,
            category=ThreatCategory.UNKNOWN,
            confidence=0.5,
            severity="medium",
            rationale="Event is flagged as suspicious but does not match any known threat taxonomy pattern."
        )

classifier_instance = RuleBasedClassifier()

def classify_security_event(raw_message: str, is_suspicious: bool) -> ThreatClassification:
    return classifier_instance.classify_event(raw_message, is_suspicious)
