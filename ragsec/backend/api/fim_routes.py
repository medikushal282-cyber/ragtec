from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import shutil
import datetime
import uuid
from db.database import get_all_records, get_record, save_record
from ingestion.fim.scanner import scan_workspace

router = APIRouter(prefix="/api/fim", tags=["fim"])

def get_workspace_dir() -> str:
    return os.environ.get("RAGSEC_MONITORED_DIR", os.path.abspath(os.path.join(os.getcwd(), "..", "..", "monitored_workspace")))

@router.get("/events")
def get_fim_events():
    events = get_all_records("events")
    fim_events = [e for e in events if e.get("source_type") == "FIM"]
    fim_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return fim_events

@router.get("/alerts")
def get_fim_alerts():
    events = get_all_records("events")
    fim_alerts = [
        e for e in events 
        if e.get("source_type") == "FIM" and (e.get("is_suspicious") is True or (e.get("canonical", {}).get("risk_score", 0) > 50))
    ]
    fim_alerts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return fim_alerts

class QuarantineReq(BaseModel):
    file_path: Optional[str] = None
    event_id: Optional[str] = None

@router.post("/quarantine")
def quarantine_file(req: QuarantineReq):
    target_path = req.file_path
    evt_record = None

    if req.event_id:
        evt_record = get_record(\"events\", req.event_id)
        if evt_record and not target_path:
            target_path = evt_record.get(\"canonical\", {}).get(\"file_path\")

    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail=f\"Target file not found at: {target_path}\")

    workspace_dir = get_workspace_dir()
    quarantine_dir = os.path.join(workspace_dir, \".quarantine\")
    os.makedirs(quarantine_dir, exist_ok=True)

    filename = os.path.basename(target_path)
    ts = datetime.datetime.now().strftime(\"%Y%m%d_%H%M%S\")
    quarantined_filename = f\"{filename}.{ts}.quarantined\"
    dest_path = os.path.join(quarantine_dir, quarantined_filename)

    try:
        shutil.move(target_path, dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f\"Failed to quarantine file: {e}\")

    # Update event record if exists
    if evt_record:
        evt_record[\"status\"] = \"QUARANTINED\"
        evt_record[\"canonical\"][\"quarantine_path\"] = dest_path
        save_record(\"events\", req.event_id, evt_record)

    # Log to audit trail
    audit_id = f\"AUD-{uuid.uuid4().hex[:6].upper()}\"
    audit_data = {
        \"id\": audit_id,
        \"actor\": \"SOC_ANALYST\",
        \"action\": \"QUARANTINE_FILE\",
        \"target\": target_path,
        \"result\": f\"Moved to enclave: {dest_path}\",
        \"timestamp\": datetime.datetime.now(datetime.UTC).isoformat()
    }
    save_record(\"audit_logs\", audit_id, audit_data)

    return {
        \"status\": \"SUCCESS\",
        \"action\": \"QUARANTINE_FILE\",
        \"original_path\": target_path,
        \"quarantine_path\": dest_path,
        \"timestamp\": datetime.datetime.now(datetime.UTC).isoformat()
    }

class RestoreReq(BaseModel):
    quarantine_path: str
    original_path: str

@router.post(\"/restore\")
def restore_file(req: RestoreReq):
    if not os.path.exists(req.quarantine_path):
        raise HTTPException(status_code=404, detail=\"Quarantined file not found.\")

    dest_dir = os.path.dirname(req.original_path)
    if dest_dir:
        os.makedirs(dest_dir, exist_ok=True)

    try:
        shutil.move(req.quarantine_path, req.original_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f\"Failed to restore file: {e}\")

    # Log audit
    audit_id = f\"AUD-{uuid.uuid4().hex[:6].upper()}\"
    audit_data = {
        \"id\": audit_id,
        \"actor\": \"SOC_ANALYST\",
        \"action\": \"RESTORE_FILE\",
        \"target\": req.original_path,
        \"result\": f\"Restored from: {req.quarantine_path}\",
        \"timestamp\": datetime.datetime.now(datetime.UTC).isoformat()
    }
    save_record(\"audit_logs\", audit_id, audit_data)

    return {\"status\": \"SUCCESS\", \"restored_path\": req.original_path}

@router.get(\"/quarantined\")
def list_quarantined():
    workspace_dir = get_workspace_dir()
    quarantine_dir = os.path.join(workspace_dir, \".quarantine\")
    if not os.path.exists(quarantine_dir):
        return []

    files = []
    for f in os.listdir(quarantine_dir):
        full_p = os.path.join(quarantine_dir, f)
        if os.path.isfile(full_p):
            stat = os.stat(full_p)
            files.append({
                \"filename\": f,
                \"quarantine_path\": full_p,
                \"size_bytes\": stat.st_size,
                \"quarantined_at\": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat()
            })
    return files

@router.post(\"/scan\")
def trigger_scan():
    workspace_dir = get_workspace_dir()
    res = scan_workspace(workspace_dir)
    return {\"status\": \"COMPLETED\", \"workspace\": workspace_dir, **res}
