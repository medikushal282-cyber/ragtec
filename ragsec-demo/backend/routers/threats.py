from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/threats",
    tags=["threats"],
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
