from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import datetime
import random

from database import get_db
import models
import schemas
from websocket_manager import manager

router = APIRouter(
    prefix="/api/ingest",
    tags=["ingest"],
)

def generate_threat_id():
    return f"THR-{random.randint(1000, 9999)}"

@router.post("/alert", response_model=schemas.ThreatResponse)
async def ingest_alert(threat_in: schemas.ThreatCreate, db: Session = Depends(get_db)):
    # 1. Parse and enhance data
    threat_data = threat_in.dict()
    if not threat_data.get("id"):
        threat_data["id"] = generate_threat_id()
    if not threat_data.get("ts"):
        threat_data["ts"] = datetime.datetime.now().strftime("%H:%M:%S")

    # 2. Save to database
    db_threat = models.Threat(**threat_data)
    db.add(db_threat)
    db.commit()
    db.refresh(db_threat)

    # 3. Broadcast to all connected frontend clients
    # Prepare dict for WebSocket JSON broadcast
    broadcast_data = {
        "id": db_threat.id,
        "name": db_threat.name,
        "type": db_threat.type,
        "origin": db_threat.origin,
        "severity": db_threat.severity,
        "solution": db_threat.solution,
        "exceptions": db_threat.exceptions,
        "ts": db_threat.ts
    }
    await manager.broadcast(broadcast_data)

    return db_threat
