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
    thresholds = get_policy_thresholds(severity)
    theta_sim = thresholds["similarity"]
    theta_conf = thresholds["confidence"]
    # Separate threshold for cross-encoder (logits typically range from -10 to 10; >0 is usually positive relevance)
    theta_rerank = 0.0 if severity == IncidentSeverity.LOW else 1.0 if severity == IncidentSeverity.MEDIUM else 2.0 if severity == IncidentSeverity.HIGH else 3.0
    
    if not evidence:
        return {
            "passed": False,
            "status": "ABSTAINED",
            "reason": f"No candidate evidence chunks found for incident query.",
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
    
    # Filter by dense similarity AND rerank score (if reranker was used, they differ)
    surviving = []
    for e in evidence:
        if e.source_type == "telemetry":
            surviving.append(e)
            continue
            
        is_dense_ok = e.similarity_score >= theta_sim
        is_rerank_ok = True
        # If reranker was used, adjusted_similarity contains the logit, which is usually > 0 for relevance.
        # If it equals similarity_score exactly, reranker was not used or it was mocked.
        if e.adjusted_similarity != e.similarity_score:
            is_rerank_ok = e.adjusted_similarity >= theta_rerank
            
        if is_dense_ok and is_rerank_ok:
            surviving.append(e)
            
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
            "reason": f"Evidence failed severity thresholds (Sim >= {theta_sim:.2f}, Rerank >= {theta_rerank:.2f}).",
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
        "reason": f"Found {len(surviving)} strongly relevant chunks from {source_count} sources.",
        "confidence": confidence,
        "surviving_evidence": surviving,
        "retrieval_summary": retrieval_summary
    }
