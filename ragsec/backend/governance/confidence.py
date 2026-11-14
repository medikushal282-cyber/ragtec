"""
ragsec.backend.governance.confidence
Transparent retrieval confidence calculation.
Combines:
- Top candidate similarity score (60% weight)
- Top-3 average similarity score (30% weight)
- Qualifying source count diversity factor (10% weight)
"""
import math
from typing import List
from models import Evidence

def calculate_retrieval_confidence(evidence: List[Evidence]) -> float:
    """
    Computes a normalized confidence score in [0.0, 1.0].
    Combines top candidate similarity (60%), top-3 average (30%), and source diversity (10%).
    Handles unnormalized cross-encoder logits via sigmoid calibration.
    """
    if not evidence:
        return 0.0

    def score_of(e: Evidence) -> float:
        # If adjusted_similarity is a cross-encoder logit, use dense similarity blended with sigmoid
        if e.adjusted_similarity != e.similarity_score:
            prob = 1.0 / (1.0 + math.exp(-max(-8.0, min(8.0, e.adjusted_similarity))))
            # Weighted blend: dense cosine similarity (70%) + reranker probability (30%)
            return max(0.0, min(1.0, (e.similarity_score * 0.7) + (prob * 0.3)))
        return max(0.0, min(1.0, e.similarity_score))

    scores = [score_of(e) for e in evidence]
    top_score = scores[0]

    top_3 = scores[:min(3, len(scores))]
    avg_top_3 = sum(top_3) / len(top_3)

    distinct_sources = len(set(e.document_id for e in evidence))
    diversity_factor = min(1.0, distinct_sources / 2.0)

    confidence = (0.6 * top_score) + (0.3 * avg_top_3) + (0.1 * diversity_factor)
    return round(min(1.0, max(0.0, confidence)), 4)
