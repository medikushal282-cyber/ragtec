"""
ragsec.backend.governance.policy
Enforces severity-dependent evidence and confidence thresholds.
Thresholds scale strictly by incident severity:
- LOW:      similarity >= 0.55, confidence >= 0.55
- MEDIUM:   similarity >= 0.60, confidence >= 0.60
- HIGH:     similarity >= 0.65, confidence >= 0.65
- CRITICAL: similarity >= 0.70, confidence >= 0.70
"""
from typing import Dict, Any, List
from models import IncidentSeverity, Evidence, RetrievalSummary
from governance.confidence import calculate_retrieval_confidence
from config import settings

def get_policy_thresholds(severity: IncidentSeverity) -> Dict[str, float]:
    """Retrieves similarity and confidence thresholds for a given incident severity."""
    sev_key = severity.value
    return settings.SEVERITY_THRESHOLDS.get(sev_key, {"similarity": 0.55, "confidence": 0.55})

def evaluate_evidence_policy(
    evidence: List[Evidence],
    severity: IncidentSeverity = IncidentSeverity.LOW,
    min_distinct_sources: int = settings.MIN_SOURCE_DIVERSITY
) -> Dict[str, Any]:
    """
    Applies multi-stage severity governance check:
    1. Check for empty evidence
    2. Check top candidate meets severity similarity threshold
    3. Check aggregate confidence meets severity confidence threshold
    4. Check source diversity constraint
    """
    thresholds = get_policy_thresholds(severity)
    theta_sim = thresholds["similarity"]
    theta_conf = thresholds["confidence"]
    
    if not evidence:
        return {
            "passed": False,
            "status": "ABSTAINED",
            "reason": f"No candidate evidence chunks found for incident query (Severity: {severity.value.upper()}).",
            "confidence": 0.0,
            "surviving_evidence": [],
            "retrieval_summary": RetrievalSummary(
                results_count=0,
                qualifying_sources_count=0,
                avg_confidence=0.0,
                threshold_met=False,
                theta_sim_applied=theta_sim,
                theta_conf_applied=theta_conf
            )
        }
        
    confidence = calculate_retrieval_confidence(evidence)
    
    # Filter surviving chunks that meet theta_sim
    surviving = [e for e in evidence if e.adjusted_similarity >= theta_sim]
    
    distinct_docs = set(e.document_id for e in surviving)
    source_count = len(distinct_docs)
    
    retrieval_summary = RetrievalSummary(
        results_count=len(surviving),
        qualifying_sources_count=source_count,
        avg_confidence=confidence,
        threshold_met=False,
        theta_sim_applied=theta_sim,
        theta_conf_applied=theta_conf
    )
    
    if not surviving:
        return {
            "passed": False,
            "status": "ABSTAINED",
            "reason": f"Top evidence similarity ({evidence[0].adjusted_similarity:.2f}) failed {severity.value.upper()} similarity threshold ({theta_sim:.2f}).",
            "confidence": confidence,
            "surviving_evidence": [],
            "retrieval_summary": retrieval_summary
        }
        
    if confidence < theta_conf:
        return {
            "passed": False,
            "status": "ABSTAINED",
            "reason": f"Retrieval confidence ({confidence:.2f}) failed {severity.value.upper()} confidence threshold ({theta_conf:.2f}).",
            "confidence": confidence,
            "surviving_evidence": surviving,
            "retrieval_summary": retrieval_summary
        }
        
    # Check source diversity if multiple chunks returned
    if len(surviving) >= min_distinct_sources and source_count < min_distinct_sources:
        return {
            "passed": False,
            "status": "ABSTAINED",
            "reason": f"Source diversity requirement failed ({source_count} source found; required >= {min_distinct_sources}).",
            "confidence": confidence,
            "surviving_evidence": surviving,
            "retrieval_summary": retrieval_summary
        }
        
    retrieval_summary.threshold_met = True
    return {
        "passed": True,
        "status": "SUFFICIENT",
        "reason": None,
        "confidence": confidence,
        "surviving_evidence": surviving,
        "retrieval_summary": retrieval_summary
    }
