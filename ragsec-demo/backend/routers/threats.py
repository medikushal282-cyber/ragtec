from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

from auth import get_current_active_user

router = APIRouter(
    prefix="/api/threats",
    tags=["threats"]
)

@router.get("/", response_model=List[schemas.ThreatResponse])
def get_threats(db: Session = Depends(get_db), limit: int = 50):
    # Get the latest threats
    threats = db.query(models.Threat).order_by(models.Threat.created_at.desc()).limit(limit).all()
    return threats

@router.get("/initial", response_model=List[schemas.ThreatResponse])
def get_initial_threats(db: Session = Depends(get_db)):
    # Legacy endpoint used by frontend to populate initial dashboard state
    threats = db.query(models.Threat).order_by(models.Threat.created_at.desc()).limit(4).all()
    return threats

@router.get("/flags")
def get_network_flags(db: Session = Depends(get_db)):
    flags = db.query(models.NetworkFlag).order_by(models.NetworkFlag.timestamp.desc()).limit(10).all()
    return flags

from fastapi import HTTPException
from llm_engine import generate_mitigation
from routers.retrieve import retrieve_chunks_internal

@router.get("/{id}/mitigate")
def mitigate_threat(id: str, db: Session = Depends(get_db)):
    threat = db.query(models.Threat).filter(models.Threat.id == id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
        
    # RAGSec Internal Retrieval
    query = f"{threat.name} {threat.type} {threat.severity}"
    chunks = retrieve_chunks_internal(query, limit=3)
    
    mitigation_data = generate_mitigation(
        threat_name=threat.name,
        threat_type=threat.type,
        severity=threat.severity,
        context=threat.exceptions or "",
        cisa_solution=threat.solution or "",
        retrieved_chunks=chunks
    )
    
    return mitigation_data
