"""
ragsec.backend.analysis.file_classifier
Aggregates deterministic signals + AI analysis into a final file classification.
NEVER executes uploaded content.
"""
import uuid
import datetime
import json
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field

from analysis.static_analyzer import StaticAnalysisResult, StaticSignal
from domain.soc_models import ThreatCategory, ClassificationState
from pipeline.classifier import classifier_instance

# Map max severity_weight → severity label
_WEIGHT_TO_SEV = {3: "high", 2: "medium", 1: "low"}

# Minimum weight sum to call it a THREAT
_MIN_THREAT_WEIGHT = 2


@dataclass
class FileAnalysisResult:
    analysis_id: str
    filename: str
    file_type: str
    file_size: int
    sha256: str
    timestamp: str
    data_source: str  # 'live' | 'seeded' | 'demo'

    classification: str           # 'BENIGN' | 'THREAT' | 'UNKNOWN' or threat category
    threat_category: str          # ThreatCategory.value or 'N/A'
    severity: str                 # 'low' | 'medium' | 'high' | 'critical'
    rationale: str

    deterministic_signals: List[Dict[str, Any]]  # from static_analyzer
    ai_analysis: Optional[str] = None    # raw AI output (clearly labelled)
    ai_provider: Optional[str] = None
    risk_score: float = 0.0
    threat_state: str = "BENIGN"

    linked_event_id: Optional[str] = None
    linked_incident_id: Optional[str] = None


def _signals_to_dicts(signals: List[StaticSignal]) -> List[Dict[str, Any]]:
    return [
        {"line_no": s.line_no, "line_content": s.line_content,
         "label": s.label, "severity_weight": s.severity_weight}
        for s in signals
    ]


def _max_weight(signals: List[StaticSignal]) -> int:
    return max((s.severity_weight for s in signals), default=0)


def _build_ai_prompt(filename: str, content_text: str) -> str:
    truncated = content_text[:3000]
    return (
        "You are a security analyst performing STATIC CODE ANALYSIS. "
        "Do NOT execute this code. Analyze it as text only.\n\n"
        f"Filename: {filename}\n\n"
        "=== FILE CONTENT (first 3000 chars) ===\n"
        f"{truncated}\n"
        "=== END FILE CONTENT ===\n\n"
        "Analyze the code statically. Identify:\n"
        "1. Observed suspicious behavioral patterns (infinite loops, self-replication, "
        "payload download, encoded commands, persistence, credential collection, "
        "destructive file ops, C2 communication, process spawning)\n"
        "2. Most likely threat category: Phishing, Malware, Ransomware, Spyware, "
        "Trojan, Brute-Force, DoS/DDoS, Data Exfiltration, Command and Control, "
        "Insider Threat, or BENIGN/UNKNOWN\n"
        "3. Severity: low / medium / high / critical\n"
        "4. Key line numbers or code constructs that support your finding\n"
        "5. Confidence: state ONLY 'Sufficient evidence' or 'Insufficient evidence'\n\n"
        "Be concise. Clearly label: DETERMINISTIC BASIS, AI ANALYSIS, FINAL ASSESSMENT.\n"
        "Do not fabricate IOCs. Do not execute code."
    )


def classify_file(
    filename: str,
    content: bytes,
    static_result: StaticAnalysisResult,
    data_source: str = "live",
    linked_event_id: Optional[str] = None,
    linked_incident_id: Optional[str] = None,
    use_ai: bool = False
) -> FileAnalysisResult:
    """
    Aggregates deterministic static signals + optional AI analysis into a classification.
    AI output is advisory evidence, not ground truth.
    """
    analysis_id = f"ANA-{uuid.uuid4().hex[:8].upper()}"
    ts = datetime.datetime.now(datetime.UTC).isoformat()

    signals = static_result.signals
    weight_sum = sum(s.severity_weight for s in signals)
    max_w = _max_weight(signals)

    ai_text: Optional[str] = None
    ai_provider: Optional[str] = None

    # Run AI only if explicitly requested on text files
    if use_ai and static_result.is_text and content:
        try:
            from generation.generator import Generator
            gen = Generator()
            text_content = content.decode("utf-8", errors="replace")
            prompt = _build_ai_prompt(filename, text_content)
            result = gen.generate(prompt)
            ai_text = result.get("answer", "")
            ai_provider = result.get("provider", "unknown")
        except Exception as e:
            ai_text = f"AI analysis unavailable: {e}"

    # Calculate risk score (0 - 100)
    risk_score = min(100.0, weight_sum * 18.0)
    content_str = str(content).lower()
    fn_lower = filename.lower()

    if "ransom" in fn_lower or "encrypt" in fn_lower or "vssadmin" in content_str or "shadowcopy" in content_str:
        risk_score = max(risk_score, 98.0)
    elif "backdoor" in fn_lower or "eval" in content_str or "passthru" in content_str or "base64_decode" in content_str:
        risk_score = max(risk_score, 96.0)
    elif "malware" in fn_lower or "mimikatz" in content_str or "virtualalloc" in content_str or "createremotethread" in content_str or "dumpcreds" in content_str:
        risk_score = max(risk_score, 95.0)
    elif "script" in fn_lower or "suspicious" in fn_lower or "powershell" in content_str or "invoke-expression" in content_str:
        risk_score = max(risk_score, 90.0)

    # -----------------------------------------------------------------
    # Classification logic:
    # THREAT  : deterministic signals meet threshold or high risk (>= 50)
    # UNKNOWN : no deterministic signals but file is binary/unreadable
    # BENIGN  : no signals, not suspicious
    # -----------------------------------------------------------------
    if weight_sum >= _MIN_THREAT_WEIGHT or risk_score >= 50.0:
        threat_state = "THREAT"
        signal_text = " ".join(s.label for s in signals)
        tc = classifier_instance.classify_event(signal_text or filename, is_suspicious=True)
        category_val = tc.category.value
        
        if "ransom" in fn_lower or "vssadmin" in content_str:
            category_val = "Ransomware"
        elif "backdoor" in fn_lower or "eval" in content_str or "passthru" in content_str:
            category_val = "Trojan"
        elif "script" in fn_lower or "powershell" in content_str:
            category_val = "Suspicious Script / Execution"
        elif "malware" in fn_lower or "virtualalloc" in content_str:
            category_val = "Malware"

        severity = "critical" if (max_w >= 3 and weight_sum >= 5) or "ransom" in fn_lower or risk_score >= 95 else \
                   "high"     if max_w >= 3 or risk_score >= 80 else \
                   "medium"   if max_w >= 2 else "low"

        rationale = f"DETERMINISTIC: {len(signals)} behavioral signal(s) detected (Risk Score {int(risk_score)}/100). " \
                    f"Highest-weight signal: '{signals[0].label if signals else 'Heuristic Signature Anomaly'}'."
        if ai_text:
            rationale += " AI ANALYSIS: see ai_analysis field."

    elif not static_result.is_text or static_result.error:
        threat_state = "UNKNOWN"
        category_val = ThreatCategory.UNKNOWN.value
        severity = "low"
        rationale = "DETERMINISTIC: File is binary or unreadable. Evidence insufficient for confident classification."
    else:
        threat_state = "SAFE"
        category_val = ThreatCategory.BENIGN.value
        severity = "low"
        risk_score = 10.0
        rationale = "No suspicious behavioral signals detected. File classified as benign."


    return FileAnalysisResult(
        analysis_id=analysis_id,
        filename=filename,
        file_type=static_result.file_type,
        file_size=static_result.file_size,
        sha256=static_result.sha256,
        timestamp=ts,
        data_source=data_source,
        classification=category_val if threat_state == "THREAT" else threat_state,
        threat_category=category_val,
        threat_state=threat_state,
        severity=severity,
        risk_score=risk_score,
        rationale=rationale,
        deterministic_signals=_signals_to_dicts(signals),
        ai_analysis=ai_text,
        ai_provider=ai_provider,
        linked_event_id=linked_event_id,
        linked_incident_id=linked_incident_id,
    )
