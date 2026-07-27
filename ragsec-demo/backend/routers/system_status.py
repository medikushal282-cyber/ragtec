from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import os

router = APIRouter(
    prefix="/api/system",
    tags=["system"],
)

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    threat_count = db.query(models.Threat).count()
    db_size_bytes = 0
    if os.path.exists("./ragsec.db"):
        db_size_bytes = os.path.getsize("./ragsec.db")

    return {
        "frontend": "online",
        "backend": "online",
        "database": {
            "status": "online",
            "threat_count": threat_count,
            "size_mb": round(db_size_bytes / (1024 * 1024), 2)
        },
        "websocket": {
            "status": "online",
            "active_connections": 1
        },
        "threat_feed": "online",
        "ai_engine": "online",
        "telemetry": "online"
    }
