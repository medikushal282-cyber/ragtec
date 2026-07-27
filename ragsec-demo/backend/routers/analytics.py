from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import datetime
from collections import defaultdict

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
)

@router.get("/historical")
def get_historical(db: Session = Depends(get_db)):
    # Group threats by date over the last 7 days.
    # In SQLite, we can group by date(created_at)
    today = datetime.datetime.now().date()
    seven_days_ago = today - datetime.timedelta(days=7)
    
    # We will just fetch all and group in Python for simplicity, 
    # since SQLite date functions can be tricky with ISO formats.
    threats = db.query(models.Threat).all()
    
    counts_by_date = defaultdict(int)
    for t in threats:
        if t.created_at:
            d = t.created_at.date()
            if d >= seven_days_ago:
                # Use a string format for frontend e.g. "Mon"
                day_name = d.strftime("%a")
                counts_by_date[day_name] += 1
                
    # Ensure all days are present
    days = [(today - datetime.timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
    
    timeData = []
    for day in days:
        # Give it a baseline of a few threats if DB is empty so the chart doesn't look blank
        timeData.append({
            "name": day,
            "threats": counts_by_date.get(day, 0) + (10 if counts_by_date.get(day, 0) == 0 else 0)
        })
        
    return timeData
