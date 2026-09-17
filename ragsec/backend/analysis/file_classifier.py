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

    classification: str           # 'BENIGN' | 'THREAT' | 'UNKNOWN'
    threat_category: str          # ThreatCategory.value or 'N/A'
    severity: str                 # 'low' | 'medium' | 'high' | 'critical'
    rationale: str

    deterministic_signals: List[Dict[str, Any]]  # from static_analyzer
    ai_analysis: Optional[str]    # raw AI output (clearly labelled)
    ai_provider: Optional[str]

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
) -> FileAnalysisResult:
    """
    Aggregates deterministic static signals + AI analysis into a classification.
    AI output is advisory evidence, not ground truth.
    """
    from generation.generator import Generator
    gen = Generator()

    analysis_id = f"ANA-{uuid.uuid4().hex[:8].upper()}"
    ts = datetime.datetime.now(datetime.UTC).isoformat()

    signals = static_result.signals
    weight_sum = sum(s.severity_weight for s in signals)
    max_w = _max_weight(signals)

    ai_text: Optional[str] = None
    ai_provider: Optional[str] = None

    # Run AI only on text files with some content
    if static_result.is_text and content:
        try:
            text_content = content.decode("utf-8", errors="replace")
            prompt = _build_ai_prompt(filename, text_content)
            result = gen.generate(prompt)
            ai_text = result.get("answer", "")
            ai_provider = result.get("provider", "unknown")
        except Exception as e:
            ai_text = f"AI analysis unavailable: {e}"

    # -----------------------------------------------------------------
    # Classification logic:
    # THREAT  : deterministic signals meet threshold
    # UNKNOWN : no deterministic signals but file is text; AI may hint
    # BENIGN  : no signals, not suspicious
    # -----------------------------------------------------------------
    if weight_sum >= _MIN_THREAT_WEIGHT:
        classification = "THREAT"
        signal_text = " ".join(s.label for s in signals)
        tc = classifier_instance.classify_event(signal_text, is_suspicious=True)
        category_val = tc.category.value

        severity = "critical" if max_w >= 3 and weight_sum >= 6 else \
                   "high"     if max_w >= 3 else \
                   "medium"   if max_w >= 2 else "low"

        rationale = f"DETERMINISTIC: {len(signals)} behavioral signal(s) detected. " \
                    f"Highest-weight signal: '{signals[0].label}' (weight={signals[0].severity_weight})."
        if ai_text:
            rationale += " AI ANALYSIS: see ai_analysis field."

    elif not static_result.is_text or static_result.error:
        # Binary or unreadable files where we can't analyze the code
        classification = "UNKNOWN"
        category_val = ThreatCategory.UNKNOWN.value
        severity = "low"
        rationale = "DETERMINISTIC: File is binary or unreadable. Evidence insufficient for confident classification."
        if static_result.error:
            rationale += f" (Error: {static_result.error})"
    else:
        # Text file with no deterministic signals. 
        # Check if AI strongly suggests a threat.
        has_ai_threat = False
        if ai_text:
            for cat in ["Ransomware", "Malware", "Trojan", "Spyware", "Phishing",
                        "Brute-Force", "Data Exfiltration", "Command and Control"]:
                if cat.lower() in ai_text.lower():
                    has_ai_threat = True
                    category_val = cat
                    break
        
        if has_ai_threat:
            classification = "UNKNOWN"  # Keep UNKNOWN if only AI says it's bad but no deterministic signals
            severity = "low"
            rationale = "DETERMINISTIC: No behavioral signals matched. " \
                        f"AI ANALYSIS suggests possible {category_val} behavior — insufficient deterministic evidence to confirm."
        else:
            classification = "BENIGN"
            category_val = ThreatCategory.BENIGN.value
            severity = "low"
            rationale = "No suspicious behavioral signals detected. File classified as benign."

    return FileAnalysisResult(
        analysis_id=analysis_id,
        filename=filename,
        file_type=static_result.file_type,
        file_size=static_result.file_size,
        sha256=static_result.sha256,
        timestamp=ts,
        data_source=data_source,
        classification=classification,
        threat_category=category_val,
        severity=severity,
        rationale=rationale,
        deterministic_signals=_signals_to_dicts(signals),
        ai_analysis=ai_text,
        ai_provider=ai_provider,
        linked_event_id=linked_event_id,
        linked_incident_id=linked_incident_id,
    )
