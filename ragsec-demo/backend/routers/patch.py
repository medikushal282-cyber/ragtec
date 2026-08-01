from fastapi import APIRouter, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/v1/patch", tags=["Patch Management"])

@router.get("/pending")
def get_pending_patches(db: Session = Depends(get_db)):
    patches = db.query(models.Patch).filter(models.Patch.status == "Pending").all()
    return {
        "total_pending": len(patches),
        "critical_zero_day": sum(1 for p in patches if p.severity.lower() == "critical"),
        "nodes_affected": len(patches) * 2,
        "patches": patches
    }

@router.get("/queue")
def get_patch_queue(db: Session = Depends(get_db)):
    patches = db.query(models.Patch).all()
    return {
        "pending": [p for p in patches if p.status == "Pending"],
        "rolling_out": [p for p in patches if p.status == "Rolling Out"]
    }

@router.post("/rollout")
def trigger_rollout():
    return {"status": "success", "message": "Rollout initiated."}
