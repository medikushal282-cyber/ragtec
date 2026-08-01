from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

@router.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    username_setting = db.query(models.Setting).filter(models.Setting.key == "admin_username").first()
    theme_setting = db.query(models.Setting).filter(models.Setting.key == "theme").first()
    return {
        "username": username_setting.value if username_setting else "Administrator",
        "role": "Super Admin",
        "theme": theme_setting.value if theme_setting else "dark"
    }

@router.post("/profile")
def update_profile(payload: dict, db: Session = Depends(get_db)):
    username_setting = db.query(models.Setting).filter(models.Setting.key == "admin_username").first()
    theme_setting = db.query(models.Setting).filter(models.Setting.key == "theme").first()
    
    if username_setting and "username" in payload:
        username_setting.value = payload["username"]
    
    if theme_setting and "theme" in payload:
        theme_setting.value = payload["theme"]
        
    db.commit()
    return {"status": "success"}
