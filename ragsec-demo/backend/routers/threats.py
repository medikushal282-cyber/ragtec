from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

from auth import get_current_active_user

router = APIRouter(
    prefix="/api/threats",
    tags=["threats"],
    dependencies=[Depends(get_current_active_user)]
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

from fastapi import HTTPException
from llm_engine import generate_mitigation

@router.get("/{id}/mitigate")
def mitigate_threat(id: str, db: Session = Depends(get_db)):
    threat = db.query(models.Threat).filter(models.Threat.id == id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
        
    mitigation_data = generate_mitigation(
        threat_name=threat.name,
        threat_type=threat.type,
        severity=threat.severity,
        context=threat.exceptions or "",
        cisa_solution=threat.solution or ""
    )
    
    return mitigation_data
