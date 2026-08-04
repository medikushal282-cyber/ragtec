from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from retrieval import retrieve_and_gate

router = APIRouter(
    prefix="/api/retrieve",
    tags=["retrieve"],
)

class RetrieveRequest(BaseModel):
    query: str
    allowed_tiers: Optional[List[str]] = ["public", "internal"]
    theta_sim: Optional[float] = 0.55
    theta_conf: Optional[float] = 0.55

@router.post("/")
def handle_retrieve(req: RetrieveRequest) -> Dict[str, Any]:
    """
    Exposes the raw Retrieval Layer with Confidence Gating.
    Returns either sufficient chunks or an insufficient abstention reason.
    """
    result = retrieve_and_gate(
        query=req.query,
        allowed_tiers=req.allowed_tiers,
        theta_sim=req.theta_sim,
        theta_conf=req.theta_conf
    )
    return result
