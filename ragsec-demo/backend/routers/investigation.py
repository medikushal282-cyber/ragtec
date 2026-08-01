from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/investigation", tags=["investigation"])

@router.get("/{threat_id}/timeline")
def get_threat_timeline(threat_id: str, db: Session = Depends(get_db)):
    threat = db.query(models.Threat).filter(models.Threat.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
        
    return [
        {
            "timestamp": threat.created_at.isoformat() if threat.created_at else "",
            "event": "Threat Ingested",
            "actor": "System Pipeline",
            "details": f"Ingested {threat.name} from {threat.origin}"
        },
        {
            "timestamp": threat.created_at.isoformat() if threat.created_at else "",
            "event": "Auto-Analysis Completed",
            "actor": "RAGSec Copilot",
            "details": "Identified potential mitigation paths."
        }
    ]
