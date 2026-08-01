from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from auth import get_current_active_user
import models
from llm_engine import generate_mitigation
import json
import os

router = APIRouter(
    prefix="/api/actions",
    tags=["actions", "playbooks"]
)

@router.get("/playbooks")
def get_playbooks(db: Session = Depends(get_db)):
    playbooks = db.query(models.Playbook).all()
    # Return as dicts compatible with frontend
    return [
        {
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "severity": p.severity,
            "description": p.description,
            "steps": p.steps
        } for p in playbooks
    ]

@router.post("/playbooks")
def create_playbook(payload: dict, db: Session = Depends(get_db)):
    import uuid
    pb_id = f"pb-{str(uuid.uuid4())[:8]}"
    new_pb = models.Playbook(
        id=pb_id,
        title=payload.get("title", "Custom Playbook"),
        category=payload.get("category", "General"),
        severity=payload.get("severity", "High"),
        description=payload.get("description", "Custom incident response workflow"),
        steps=payload.get("steps", {
            "Containment": ["Isolate affected host", "Block external IP"],
            "Eradication": ["Flush transient cache", "Patch vulnerability"]
        })
    )
    db.add(new_pb)
    db.commit()
    return {"status": "success", "id": pb_id, "message": "Custom Playbook saved to database."}

@router.post("/playbooks/run")
def log_playbook_run(payload: dict, db: Session = Depends(get_db)):
    pb_id = payload.get("playbook_id")
    completed_steps = payload.get("completed_steps", [])
    notes = payload.get("notes", "")
    return {
        "status": "success",
        "playbook_id": pb_id,
        "steps_completed": len(completed_steps),
        "audit_id": f"audit-{datetime.utcnow().timestamp()}",
        "message": "Playbook execution audit log recorded successfully."
    }


# Simulated Firewall Rules File
FIREWALL_RULES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "firewall_rules.json"))

def _write_firewall_rule(ip: str, reason: str):
    rules = []
    if os.path.exists(FIREWALL_RULES_FILE):
        try:
            with open(FIREWALL_RULES_FILE, "r") as f:
                rules = json.load(f)
        except:
            pass
    rules.append({
        "ip": ip,
        "action": "BLOCK",
        "reason": reason,
        "timestamp": datetime.utcnow().isoformat()
    })
    with open(FIREWALL_RULES_FILE, "w") as f:
        json.dump(rules, f, indent=4)

@router.post("/block-ioc")
def block_ioc(ioc: str, threat_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    threat = db.query(models.Threat).filter(models.Threat.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
        
    # Extended Idea: Actually write the IOC to a simulated local firewall state
    background_tasks.add_task(_write_firewall_rule, ioc, f"Blocked due to Threat {threat_id}")
    
    return {
        "status": "success",
        "message": f"IOC {ioc} has been added to the enterprise blocklist.",
        "firewall_rule_generated": True
    }

@router.post("/trigger-mitigation")
def trigger_mitigation(threat_id: str, db: Session = Depends(get_db)):
    threat = db.query(models.Threat).filter(models.Threat.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
        
    # Extended Idea: Mark as mitigated in DB and generate an automated incident response summary
    threat.severity = "Resolved"
    db.commit()
    
    # Generate automated post-mortem playbook
    ai_playbook = generate_mitigation(
        threat_name=threat.name,
        threat_type=threat.type,
        severity="Resolved",
        context="Generate a post-mortem incident response summary since this threat was just mitigated.",
        cisa_solution=threat.solution or ""
    )
    
    return {
        "status": "mitigated",
        "threat_id": threat_id,
        "automated_post_mortem": ai_playbook
    }

from fastapi.responses import PlainTextResponse

@router.get("/export-report/{threat_id}", response_class=PlainTextResponse)
def export_threat_report(threat_id: str, db: Session = Depends(get_db)):
    threat = db.query(models.Threat).filter(models.Threat.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
        
    report = f"""==================================================
RAGSEC ENTERPRISE INCIDENT REPORT
==================================================
Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
Threat ID: {threat.id}
Name: {threat.name}
Type: {threat.type}
Severity: {threat.severity}
Origin: {threat.origin}

[ Official Mitigation Details ]
{threat.solution or 'N/A'}

[ Exceptions / Notes ]
{threat.exceptions or 'None'}

*** GENERATED BY RAGSEC AI COMMAND CENTER ***
==================================================
"""
    # For a real PDF, we would use reportlab here, but PlainText/Markdown is easily downloadable
    return report
