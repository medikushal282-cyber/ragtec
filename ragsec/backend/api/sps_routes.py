"""
ragsec.backend.api.sps_routes
API routes for SOC Productivity Score (SPS) and 3-Way Baseline Benchmarks.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from evaluation.sps_evaluator import (
    sps_evaluator, SPSWeights, BENCHMARK_SCENARIOS
)

router = APIRouter(prefix="/api/sps", tags=["sps-evaluation"])


class CustomEvaluationPayload(BaseModel):
    query: str
    response: str
    ground_truth_entities: Optional[List[str]] = None
    evidence_texts: Optional[List[str]] = None
    baseline_time_min: float = 18.5
    actual_time_min: float = 13.5
    alpha: float = 1.0
    beta: float = 1.5
    gamma: float = 0.8


class RunBenchmarkPayload(BaseModel):
    alpha: float = 1.0
    beta: float = 1.5
    gamma: float = 0.8


@router.get("/benchmarks")
def get_benchmarks(alpha: float = 1.0, beta: float = 1.5, gamma: float = 0.8):
    """
    Returns pre-computed and dynamically weighted 3-Way Architectural Comparison Matrix:
    RAGSec vs. LLM-Only vs. Search+Analyst.
    """
    weights = SPSWeights(alpha=alpha, beta=beta, gamma=gamma)
    matrix = sps_evaluator.run_3way_benchmark_matrix(weights)
    return matrix


@router.get("/scenarios")
def get_scenarios():
    """
    Returns the 6 IEEE Benchmark Ground-Truth Test Scenarios.
    """
    return {
        "count": len(BENCHMARK_SCENARIOS),
        "scenarios": BENCHMARK_SCENARIOS
    }


@router.post("/evaluate")
def evaluate_custom_response(payload: CustomEvaluationPayload):
    """
    Evaluates any arbitrary query and response pair against IEEE mathematical formulas.
    Calculates FA, RS, CI, USR, TE, UTR, and overall SPS.
    """
    if not payload.query.strip() or not payload.response.strip():
        raise HTTPException(status_code=400, detail="Query and response cannot be empty.")

    weights = SPSWeights(alpha=payload.alpha, beta=payload.beta, gamma=payload.gamma)
    
    # Auto-extract ground truth entities if not supplied
    gt_entities = payload.ground_truth_entities or []
    if not gt_entities:
        from ingestion.entities import extract_entities_from_text
        ents = extract_entities_from_text(payload.query + " " + payload.response)
        gt_entities = list(ents.ips.union(ents.domains).union(ents.cves).union(ents.ttps).union(ents.hashes))
        if not gt_entities:
            gt_entities = [w for w in payload.query.split() if len(w) > 4][:5]

    eval_result = sps_evaluator.evaluate_response(
        query=payload.query,
        response_text=payload.response,
        ground_truth_entities=gt_entities,
        evidence_texts=payload.evidence_texts or [],
        baseline_time_min=payload.baseline_time_min,
        actual_time_min=payload.actual_time_min,
        weights=weights
    )

    return {
        "status": "EVALUATED",
        "query": payload.query,
        "weights": weights.model_dump(),
        "metrics": eval_result.model_dump(),
        "formula": "SPS = α(FA + RS + CI) - β(USR) + γ(TE)",
        "interpretation": {
            "sps_grade": "EXCELLENT" if eval_result.sps_score >= 2.5 else "GOOD" if eval_result.sps_score >= 1.5 else "DEFICIENT",
            "hallucination_status": "CONTROLLED" if eval_result.unsupported_statement_rate < 0.15 else "ELEVATED",
            "grounding_passed": eval_result.factual_alignment >= 0.80
        }
    }


@router.post("/run-benchmark")
def run_benchmark(payload: RunBenchmarkPayload):
    """
    Triggers dynamic recalculation of the 3-way benchmark suite with custom weight parameters.
    """
    weights = SPSWeights(alpha=payload.alpha, beta=payload.beta, gamma=payload.gamma)
    return sps_evaluator.run_3way_benchmark_matrix(weights)
