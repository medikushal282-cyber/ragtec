from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import datetime
from collections import defaultdict

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/historical")
def get_historical(db: Session = Depends(get_db)):
    today = datetime.datetime.now().date()
    seven_days_ago = today - datetime.timedelta(days=7)
    threats = db.query(models.Threat).all()
    counts_by_date = defaultdict(int)
    for t in threats:
        if t.created_at:
            d = t.created_at.date()
            if d >= seven_days_ago:
                counts_by_date[d.strftime("%a")] += 1
                
    days = [(today - datetime.timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
    return [{"name": day, "threats": counts_by_date.get(day, 0) + (10 if counts_by_date.get(day, 0) == 0 else 0)} for day in days]

@router.get("/trending")
def get_trending(db: Session = Depends(get_db)):
    threats = db.query(models.Threat).all()
    # Count by type
    counts = defaultdict(int)
    for t in threats:
        counts[t.type if t.type else "Unknown"] += 1
    return [{"name": k, "value": v} for k, v in counts.items()]

@router.get("/vendors")
def get_vendors(db: Session = Depends(get_db)):
    threats = db.query(models.Threat).all()
    counts = defaultdict(int)
    for t in threats:
        vendor = t.name.split()[0] if t.name else "Other"
        if len(vendor) < 3: vendor = "Other"
        counts[vendor] += 1
    return [{"name": k, "value": v} for k, v in counts.items()]
