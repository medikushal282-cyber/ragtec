from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/settings", tags=["System Settings"])

@router.get("/profile")
def get_profile():
    return {
        "username": "admin",
        "role": "Super Admin",
        "mfa_enabled": True,
        "last_login": "2026-07-27T10:00:00Z"
    }

@router.get("/keys")
def get_api_keys():
    return [
        {"id": "key-01", "name": "Grafana Integration", "created_at": "2026-01-15", "last_used": "2 mins ago"},
        {"id": "key-02", "name": "SIEM Forwarder", "created_at": "2026-03-22", "last_used": "Just now"}
    ]

@router.post("/keys/generate")
def generate_key(payload: dict):
    return {"status": "success", "message": "API Key generated", "key": "ragsec_tk_xxxxxxxxxxxxxxxx"}
