"""
ragsec.backend.api.active_threat_routes
FastAPI routes for Active Threat Detection, Controlled Replicator Simulation,
Autonomous Thread Termination, Attack Banning, and Quarantine Management.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os

from analysis.controlled_replicator import replicator_manager, get_sandbox_dir, get_quarantine_dir
from analysis.active_threat_detector import active_threat_detector

router = APIRouter(prefix="/api/active-threats", tags=["active_threats"])

class LaunchReplicatorReq(BaseModel):
    max_replicas: Optional[int] = Field(default=4, ge=1, le=8, description="Max replicas before automatic hard stop (1-8)")
    interval_seconds: Optional[float] = Field(default=1.5, ge=0.5, le=5.0, description="Interval in seconds between replications")

class SentinelToggleReq(BaseModel):
    enabled: bool

@router.post("/replicator/launch")
def launch_replicator(req: LaunchReplicatorReq):
    """
    Spawns a strictly-controlled, harmless test replicator thread in the designated sandbox.
    Has hardcoded limits and safety timeouts to avoid any harm to the host system.
    """
    res = replicator_manager.launch_replicator(
        max_replicas=req.max_replicas or 4,
        interval_seconds=req.interval_seconds or 1.5
    )
    return {
        "status": "LAUNCHED",
        "message": f"Controlled replicator thread started with limit={req.max_replicas or 4} in designated sandbox.",
        **res
    }

@router.get("/replicator/status")
def get_replicator_status():
    """
    Returns real-time telemetry on active replicator threads, sandbox files,
    current generation count, and banned threat signatures.
    """
    status = replicator_manager.get_status()
    sentinel_active = active_threat_detector.sentinel_enabled
    last_verdict = active_threat_detector.last_scan_result

    # Count files in quarantine enclave
    q_dir = get_quarantine_dir()
    q_files = []
    if os.path.exists(q_dir):
        for f in os.listdir(q_dir):
            if "replica" in f.lower():
                p = os.path.join(q_dir, f)
                q_files.append({
                    "filename": f,
                    "filepath": p,
                    "size_bytes": os.path.getsize(p)
                })

    return {
        **status,
        "sentinel_enabled": sentinel_active,
        "quarantined_replica_count": len(q_files),
        "quarantined_replicas": q_files,
        "last_mitigation_verdict": last_verdict
    }

@router.post("/replicator/stop")
def stop_replicator():
    """Manually halts the running replicator thread."""
    res = replicator_manager.stop_replicator()
    return res

@router.post("/scan-and-mitigate")
def scan_and_mitigate_active_threats():
    """
    Actively inspects running worker threads and the controlled workspace.
    If a replication attack is detected:
      - Forcibly halts the running thread/process.
      - Bans the process and its signature.
      - Moves all replica artifacts to the specific .quarantine space.
      - Creates an Incident and Mitigation record in SQLite.
      - Logs the event to the cryptographic audit ledger.
    """
    result = active_threat_detector.scan_and_mitigate(trigger_source="API_INVOCATION")
    return result

@router.post("/restore-replicas")
def restore_quarantined_replicas():
    """
    Recovers the test incident replica files from the .quarantine enclave
    back to the sandbox space so the mitigation cycle can be tested again.
    """
    res = active_threat_detector.restore_quarantined_replicas()
    return res

@router.post("/purge-replicas")
def purge_quarantined_replicas():
    """Permanently purges quarantined test replica files."""
    res = active_threat_detector.purge_quarantined_replicas()
    return res

@router.post("/sentinel/toggle")
def toggle_sentinel(req: SentinelToggleReq):
    """Enables or disables autonomous real-time interceptor sentinel loop."""
    active_threat_detector.sentinel_enabled = req.enabled
    return {
        "status": "UPDATED",
        "sentinel_enabled": active_threat_detector.sentinel_enabled
    }

@router.get("/quarantined")
def list_quarantined_replicas():
    """Lists all files in the quarantine enclave related to replication attacks."""
    q_dir = get_quarantine_dir()
    files = []
    if os.path.exists(q_dir):
        for f in os.listdir(q_dir):
            if "replica" in f.lower():
                p = os.path.join(q_dir, f)
                files.append({
                    "filename": f,
                    "filepath": p,
                    "size_bytes": os.path.getsize(p)
                })
    return {"quarantine_space": q_dir, "files": files, "count": len(files)}
