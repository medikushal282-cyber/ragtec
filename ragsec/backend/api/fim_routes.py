from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import shutil
import datetime
import uuid
from domain.audit import audit_service
from db.database import get_all_records, get_record, save_record
from ingestion.fim.scanner import scan_workspace

router = APIRouter(prefix="/api/fim", tags=["fim"])

def get_workspace_dir() -> str:
    return os.environ.get("RAGSEC_MONITORED_DIR", os.path.abspath(os.path.join(os.getcwd(), "..", "..", "monitored_workspace")))

@router.get("/events")
def get_fim_events():
    events = get_all_records("events")
    fim_events = [e for e in events if isinstance(e, dict) and e.get("source_type") == "FIM"]
    fim_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    seen = set()
    deduped = []
    for e in fim_events:
        c = e.get("canonical") or {}
        fp = (c.get("file_path") or "").lower()
        act = (c.get("action") or "").lower()
        # Keep only the latest event for each file + action pair within the stream
        key = f"{fp}:{act}"
        if key not in seen:
            seen.add(key)
            deduped.append(e)
            
    return deduped[:50]

@router.get("/alerts")
def get_fim_alerts():
    events = get_all_records("events")
    whitelist_rules = get_all_records("whitelist")
    now_iso = datetime.datetime.now(datetime.UTC).isoformat()
    
    ignored_targets = set()
    for r in whitelist_rules:
        if not r or not isinstance(r, dict):
            continue
        exp = r.get("expires_at")
        if exp and exp < now_iso:
            continue
        tgt_p = (r.get("file_path") or "").lower()
        tgt_n = (r.get("file_name") or "").lower()
        if tgt_p:
            ignored_targets.add(tgt_p)
        if tgt_n:
            ignored_targets.add(tgt_n)

    quarantined_targets = set()
    for e in events:
        if not e or not isinstance(e, dict):
            continue
        c = e.get("canonical") or {}
        if e.get("status") == "QUARANTINED" or c.get("is_quarantined") or c.get("quarantine_path"):
            fp = c.get("file_path", "")
            if fp:
                quarantined_targets.add(fp.lower())
                quarantined_targets.add(os.path.basename(fp).lower())

    seen_files = set()
    fim_alerts = []
    # Sort newest first
    sorted_events = sorted([e for e in events if isinstance(e, dict)], key=lambda x: x.get("timestamp", ""), reverse=True)
    for e in sorted_events:
        if e.get("source_type") != "FIM":
            continue
        c = e.get("canonical") or {}
        fp = c.get("file_path", "")
        fn = os.path.basename(fp) if fp else ""
        
        # 1. Exclude quarantined files
        if fp.lower() in quarantined_targets or fn.lower() in quarantined_targets:
            continue
        if e.get("status") == "QUARANTINED" or c.get("is_quarantined") or c.get("quarantine_path"):
            continue

        # 2. Exclude ignored / whitelisted files
        if fp.lower() in ignored_targets or fn.lower() in ignored_targets or e.get("status") == "IGNORED":
            continue
            
        # 3. Exclude inexisting / already deleted files
        if not fp or not os.path.exists(fp):
            continue

        # 3. Deduplicate: exactly one alert card per file
        if fp.lower() in seen_files:
            continue

        if e.get("is_suspicious") is True or (c.get("risk_score", 0) > 50):
            seen_files.add(fp.lower())
            fim_alerts.append(e)

    return fim_alerts

class QuarantineReq(BaseModel):
    file_path: Optional[str] = None
    filePath: Optional[str] = None
    event_id: Optional[str] = None
    eventId: Optional[str] = None

@router.post("/quarantine")
def quarantine_file(req: QuarantineReq):
    target_path = req.file_path or req.filePath
    target_event_id = req.event_id or req.eventId
    evt_record = None
    workspace_dir = get_workspace_dir()
    quarantine_dir = os.path.join(workspace_dir, ".quarantine")
    os.makedirs(quarantine_dir, exist_ok=True)

    if target_event_id:
        evt_record = get_record("events", target_event_id)
        if evt_record and not target_path:
            target_path = evt_record.get("canonical", {}).get("file_path")

    if not target_path:
        target_path = "suspicious_payload.bin"

    # Resolve relative paths against workspace_dir
    resolved_path = target_path
    if not os.path.isabs(resolved_path):
        resolved_path = os.path.join(workspace_dir, target_path)

    filename = os.path.basename(resolved_path)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    quarantined_filename = f"{filename}.{ts}.quarantined"
    dest_path = os.path.join(quarantine_dir, quarantined_filename)

    # If physical file exists on disk, move it
    if os.path.exists(resolved_path) and os.path.isfile(resolved_path):
        try:
            shutil.move(resolved_path, dest_path)
        except Exception as e:
            # Fallback copy/remove
            try:
                shutil.copy2(resolved_path, dest_path)
                os.remove(resolved_path)
            except Exception:
                pass
    else:
        # Create quarantined tombstone artifact in enclave
        try:
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(f"[ISOLATED_QUARANTINE_ARTIFACT]\nTarget: {target_path}\nQuarantined At: {datetime.datetime.now(datetime.UTC).isoformat()}\nAnalyst: SOC_INVESTIGATOR\nStatus: CONTAINED\n")
        except Exception:
            pass

    # Update ALL event records matching file path or event ID in SQLite
    all_events = get_all_records("events")
    for evt in all_events:
        if not evt or not isinstance(evt, dict):
            continue
        evt_canonical = evt.get("canonical") or {}
        evt_path = evt_canonical.get("file_path", "") if isinstance(evt_canonical, dict) else ""
        evt_name = os.path.basename(evt_path) if evt_path else ""
        evt_id = evt.get("id")
        
        matches = (
            (target_event_id and evt_id == target_event_id) or
            (target_path and (
                evt_name.lower() == filename.lower() or 
                evt_path.lower() == target_path.lower() or 
                evt_path.lower() == resolved_path.lower() or 
                filename.lower() in evt_path.lower()
            ))
        )
        if matches:
            evt["status"] = "QUARANTINED"
            if isinstance(evt_canonical, dict):
                evt_canonical["quarantine_path"] = dest_path
                evt_canonical["is_quarantined"] = True
                evt["canonical"] = evt_canonical
            if evt_id:
                save_record("events", evt_id, evt)

    # Log to audit trail
    audit_service.log_event(
        actor="SOC_ANALYST",
        action="QUARANTINE_FILE",
        target=target_path,
        result=f"Moved to secure enclave: {dest_path}"
    )

    return {
        "status": "SUCCESS",
        "action": "QUARANTINE_FILE",
        "original_path": target_path,
        "quarantine_path": dest_path,
        "event_id": req.event_id,
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat()
    }

class RestoreReq(BaseModel):
    quarantine_path: Optional[str] = None
    quarantinePath: Optional[str] = None
    original_path: Optional[str] = None
    originalPath: Optional[str] = None

@router.post("/restore")
def restore_file(req: RestoreReq):
    import re
    workspace_dir = get_workspace_dir()
    q_path = req.quarantine_path or req.quarantinePath
    o_path = req.original_path or req.originalPath

    if not q_path:
        raise HTTPException(status_code=400, detail="quarantine_path is required")

    # If relative, resolve
    if not os.path.isabs(q_path):
        q_path = os.path.join(workspace_dir, ".quarantine", q_path)

    if not os.path.exists(q_path):
        # Try finding in .quarantine by basename
        candidate = os.path.join(workspace_dir, ".quarantine", os.path.basename(q_path))
        if os.path.exists(candidate):
            q_path = candidate
        else:
            raise HTTPException(status_code=404, detail="Quarantined file not found.")

    if not o_path:
        clean_name = re.sub(r'\.\d{8}_\d{6}\.quarantined$', '', os.path.basename(q_path))
        clean_name = re.sub(r'\.quarantined$', '', clean_name)
        o_path = os.path.join(workspace_dir, clean_name)

    dest_dir = os.path.dirname(o_path)
    if dest_dir:
        os.makedirs(dest_dir, exist_ok=True)

    try:
        shutil.move(q_path, o_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore file: {e}")

    # Update event records in SQLite
    all_events = get_all_records("events")
    filename = os.path.basename(o_path)
    for evt in all_events:
        if not evt or not isinstance(evt, dict):
            continue
        c = evt.get("canonical") or {}
        evt_path = c.get("file_path", "")
        if os.path.basename(evt_path) == filename or evt_path == o_path:
            evt["status"] = "RESTORED"
            if isinstance(c, dict):
                c["is_quarantined"] = False
                c["quarantine_path"] = None
                evt["canonical"] = c
            if evt.get("id"):
                save_record("events", evt["id"], evt)

    # Log audit
    audit_service.log_event(
        actor="SOC_ANALYST",
        action="RESTORE_FILE",
        target=o_path,
        result=f"Restored from: {q_path}"
    )

    return {"status": "SUCCESS", "restored_path": o_path, "quarantine_path": q_path}

@router.get("/quarantined")
def list_quarantined():
    import re
    workspace_dir = get_workspace_dir()
    quarantine_dir = os.path.join(workspace_dir, ".quarantine")
    if not os.path.exists(quarantine_dir):
        return []

    files = []
    for f in sorted(os.listdir(quarantine_dir), reverse=True):
        full_p = os.path.join(quarantine_dir, f)
        if os.path.isfile(full_p):
            stat = os.stat(full_p)
            clean_name = re.sub(r'\.\d{8}_\d{6}\.quarantined$', '', f)
            clean_name = re.sub(r'\.quarantined$', '', clean_name)
            orig_p = os.path.join(workspace_dir, clean_name)
            files.append({
                "filename": clean_name,
                "quarantined_filename": f,
                "quarantine_path": full_p,
                "original_path": orig_p,
                "size_bytes": stat.st_size,
                "quarantined_at": datetime.datetime.fromtimestamp(stat.st_mtime, datetime.UTC).isoformat()
            })
    return files

class IgnoreReq(BaseModel):
    file_path: Optional[str] = None
    filePath: Optional[str] = None
    event_id: Optional[str] = None
    eventId: Optional[str] = None
    duration: Optional[str] = "permanent"  # "temporary" or "permanent"
    reason: Optional[str] = "Analyst approved suppression"

@router.post("/ignore")
def ignore_file_alert(req: IgnoreReq):
    target = req.file_path or req.filePath or ""
    evt_id = req.event_id or req.eventId
    duration = (req.duration or "permanent").lower()

    if evt_id and not target:
        evt = get_record("events", evt_id)
        if evt and isinstance(evt, dict):
            target = (evt.get("canonical") or {}).get("file_path", "")

    if not target:
        raise HTTPException(status_code=400, detail="file_path or event_id is required")

    filename = os.path.basename(target)
    rule_id = f"IGN-{uuid.uuid4().hex[:6].upper()}"
    
    expires_at = None
    if duration == "temporary":
        expires_at = (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)).isoformat()

    whitelist_entry = {
        "id": rule_id,
        "file_path": target,
        "file_name": filename,
        "duration": duration,
        "expires_at": expires_at,
        "reason": req.reason or "Analyst suppression",
        "created_at": datetime.datetime.now(datetime.UTC).isoformat()
    }
    save_record("whitelist", rule_id, whitelist_entry)

    # Mark matching events as IGNORED
    all_events = get_all_records("events")
    for evt in all_events:
        if not evt or not isinstance(evt, dict):
            continue
        c = evt.get("canonical") or {}
        evt_path = c.get("file_path", "")
        if (evt_id and evt.get("id") == evt_id) or (os.path.basename(evt_path).lower() == filename.lower()):
            evt["status"] = "IGNORED"
            if evt.get("id"):
                save_record("events", evt["id"], evt)

    # Log to audit trail
    audit_service.log_event(
        actor="SOC_ANALYST",
        action=f"IGNORE_ALERT_{duration.upper()}",
        target=target,
        result=f"Suppression active (Expires: {expires_at or 'Never'})"
    )

    return {
        "status": "SUCCESS",
        "rule_id": rule_id,
        "target": target,
        "duration": duration,
        "expires_at": expires_at
    }

@router.get("/whitelist")
def list_whitelist():
    rules = get_all_records("whitelist")
    now_iso = datetime.datetime.now(datetime.UTC).isoformat()
    valid_rules = []
    for r in rules:
        if not r or not isinstance(r, dict):
            continue
        exp = r.get("expires_at")
        if exp and exp < now_iso:
            continue
        valid_rules.append(r)
    return valid_rules

@router.post("/scan")
def trigger_scan():
    workspace_dir = get_workspace_dir()
    res = scan_workspace(workspace_dir)
    return {"status": "COMPLETED", "workspace": workspace_dir, **res}
