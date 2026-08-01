from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import datetime
import random
import uuid

router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])

# Mocked network devices
MOCK_DEVICES = [
    {"id": "web-node-01", "name": "Web Server 01 (NGINX)", "status": "online", "os": "Linux Ubuntu 22.04"},
    {"id": "db-cluster-03", "name": "PostgreSQL DB Node 3", "status": "online", "os": "Linux Debian 11"},
    {"id": "employee-lt-42", "name": "Employee Laptop 42 (J.Doe)", "status": "online", "os": "Windows 11 Enterprise"},
]

# Mocked folders for devices
MOCK_FILE_SYSTEMS = {
    "web-node-01": [
        {"path": "/var/www/html", "type": "folder"},
        {"path": "/etc/nginx/nginx.conf", "type": "file"},
        {"path": "/tmp/suspect_payload.sh", "type": "file"},
    ],
    "db-cluster-03": [
        {"path": "/var/lib/postgresql/data", "type": "folder"},
        {"path": "/etc/postgresql/13/main/pg_hba.conf", "type": "file"},
    ],
    "employee-lt-42": [
        {"path": "C:\\Windows\\System32", "type": "folder"},
        {"path": "C:\\Users\\JDoe\\Downloads\\invoice_urgent.exe", "type": "file"},
    ]
}

@router.get("/devices")
def get_devices():
    return MOCK_DEVICES

@router.get("/device/{device_id}/fs")
def get_device_fs(device_id: str):
    if device_id not in MOCK_FILE_SYSTEMS:
        raise HTTPException(status_code=404, detail="Device not found")
    return MOCK_FILE_SYSTEMS[device_id]

@router.post("/scan")
def scan_target(data: dict, db: Session = Depends(get_db)):
    target = data.get("target")
    device_id = data.get("device_id")
    
    # Audit log
    audit = models.AuditLog(
        id=f"audit-{uuid.uuid4()}",
        user="system_scanner",
        action_type="SCAN",
        resource=f"{device_id}:{target}",
        details=f"Initiated antivirus deep scan on enterprise endpoint {device_id}.",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    # Mocked Virus Finding
    is_malicious = "suspect" in target or "invoice_urgent.exe" in target
    
    if is_malicious:
        return {
            "status": "infected",
            "findings": [{
                "threat": "Trojan.Ransom.Win32/LinuxShell",
                "severity": "Critical",
                "desc": "Known ransomware signature detected during static analysis."
            }]
        }
    
    return {
        "status": "clean",
        "findings": []
    }

@router.post("/mitigate")
def mitigate_threat(data: dict, db: Session = Depends(get_db)):
    target = data.get("target")
    device_id = data.get("device_id")
    action = data.get("action") # e.g. "Quarantine", "Delete", "Isolate Device"
    
    # Audit log
    audit = models.AuditLog(
        id=f"audit-{uuid.uuid4()}",
        user="soc_admin",
        action_type="MITIGATE",
        resource=f"{device_id}:{target}",
        details=f"Applied mitigation '{action}' to malicious resource on {device_id}.",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": f"Successfully applied {action} to {target}"}
