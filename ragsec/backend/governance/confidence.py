"""
ragsec.backend.governance.confidence
Transparent retrieval confidence calculation.
Combines:
- Top candidate similarity score (60% weight)
- Top-3 average similarity score (30% weight)
- Qualifying source count diversity factor (10% weight)
"""
from typing import List
from models import Evidence

def calculate_retrieval_confidence(evidence: List[Evidence]) -> float:
    """
    Computes a normalized confidence score in [0.0, 1.0].
    Returns 0.0 if evidence is empty.
    """
    if not evidence:
        return 0.0
        
    top_score = evidence[0].adjusted_similarity
    
    top_3 = evidence[:min(3, len(evidence))]
    avg_top_3 = sum(e.adjusted_similarity for e in top_3) / len(top_3)
    
    distinct_sources = len(set(e.document_id for e in evidence))
    diversity_factor = min(1.0, distinct_sources / 2.0)
    
    confidence = (0.6 * top_score) + (0.3 * avg_top_3) + (0.1 * diversity_factor)
    return round(min(1.0, max(0.0, confidence)), 4)
