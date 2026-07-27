from fastapi import APIRouter
from typing import List, Dict

router = APIRouter(prefix="/api/v1/patch", tags=["Patch Management"])

@router.get("/pending")
def get_pending_patches():
    return {
        "total_pending": 8,
        "critical_zero_day": 3,
        "nodes_affected": 4,
        "patches": [
            {"id": "PATCH-2024-001", "vendor": "Microsoft", "description": "Exchange Server Security Update", "severity": "critical", "status": "pending"},
            {"id": "PATCH-2024-002", "vendor": "Linux Kernel", "description": "eBPF Privilege Escalation Fix", "severity": "high", "status": "pending"}
        ]
    }

@router.get("/queue")
def get_rollout_queue():
    return {
        "status": "In Progress",
        "completion_percentage": 33,
        "current_node": "auth-gateway-01"
    }

@router.post("/rollout")
def trigger_rollout():
    return {"status": "success", "message": "Rollout initiated."}
