from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"],
)

@router.get("")
def get_notifications(db: Session = Depends(get_db)):
    # Fetch recent critical threats and generate notifications
    critical_threats = (
        db.query(models.Threat)
        .filter(models.Threat.severity.ilike("critical"))
        .order_by(models.Threat.created_at.desc())
        .limit(10)
        .all()
    )
    
    results = []
    for t in critical_threats:
        results.append({
            "id": f"notif-{t.id}",
            "type": "CRITICAL_ALERT",
            "message": f"CRITICAL: {t.id} - {t.name or t.type}",
            "threat_id": t.id,
            "severity": t.severity,
            "timestamp": t.ts or "Recent",
            "read": False
        })
        
    return results
