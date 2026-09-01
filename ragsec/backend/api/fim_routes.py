from fastapi import APIRouter
from db.database import get_records_by_fk
import os
from ingestion.fim.scanner import scan_workspace
import threading

router = APIRouter(prefix="/api/fim", tags=["fim"])

@router.get("/events")
def get_fim_events():
    # Fetch events where source_type is FIM
    all_events = get_records_by_fk("events", "id", "id") # Wait, get_records_by_fk doesn't work like this.
    # We should fetch all events and filter, or use raw SQL.
    # Let's import get_all_records
    from db.database import get_all_records
    events = get_all_records("events")
    fim_events = [e for e in events if e.get("source_type") == "FIM"]
    # Sort by timestamp descending
    fim_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return fim_events

@router.post("/scan")
def trigger_scan():
    workspace_dir = os.path.abspath(os.path.join(os.getcwd(), "..", "..", "test_monitor"))
    os.makedirs(workspace_dir, exist_ok=True)
    # Run in background to avoid blocking API
    threading.Thread(target=scan_workspace, args=(workspace_dir,)).start()
    return {"status": "Scan initiated on test_monitor"}
