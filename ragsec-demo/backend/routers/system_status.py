from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import datetime

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    metrics = db.query(models.SystemMetric).order_by(models.SystemMetric.timestamp.desc()).first()
    if not metrics:
        import random
        # Seed a generic metric if none exists
        metrics = models.SystemMetric(
            id="metric-1",
            cpu_usage=random.uniform(10.0, 30.0),
            memory_usage=random.uniform(40.0, 60.0),
            active_threats=db.query(models.Threat).count()
        )
        db.add(metrics)
        db.commit()

    return {
        "status": "Operational",
        "uptime": "99.99%",
        "cpu": f"{metrics.cpu_usage:.1f}%",
        "memory": f"{metrics.memory_usage:.1f}%",
        "active_threats": int(metrics.active_threats),
        "last_updated": metrics.timestamp.isoformat()
    }

@router.get("/audit")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(50).all()
    return logs

from pydantic import BaseModel
class FeedbackRequest(BaseModel):
    rating: int
    upvote: bool
    timestamp: str

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    # In a real system, this would write to a DB or telemetry service to calculate SPS (SOC Productivity Score)
    print(f"[FEEDBACK] Received Analyst Trust Rating: {req.rating}/5, Upvoted: {req.upvote} at {req.timestamp}")
    return {"status": "success", "message": "Feedback recorded"}

