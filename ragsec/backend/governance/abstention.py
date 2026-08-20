"""
ragsec.backend.governance.abstention
Formats abstention and escalation query responses when governance checks fail.
"""
from models import QueryResponse, ResponseStatus, IncidentSeverity, VerificationResult, RetrievalSummary, Evidence

def create_abstention_response(
    severity: IncidentSeverity,
    reason: str,
    confidence: float,
    retrieval_summary: RetrievalSummary
) -> QueryResponse:
    """
    Constructs an explicit QueryResponse with ABSTAINED status.
    No speculative claims are generated.
    """
    return QueryResponse(
        status=ResponseStatus.ABSTAINED,
        severity=severity,
        answer=f"ABSTAINED: {reason}",
        confidence=confidence,
        retrieval=retrieval_summary,
        evidence=[],
        citations=[],
        verification=VerificationResult(
            passed=True,
            status="ABSTAINED",
            warnings=[f"Policy abstention triggered due to insufficient evidence for {severity.value.upper()} incident."]
        ),
        reason=reason
    )
