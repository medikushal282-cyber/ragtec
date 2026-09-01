import os
import hashlib
import uuid
import datetime
import json
from domain.soc_models import SecurityEvent, ProvenanceMetadata, CanonicalFields
from db.database import save_record
from pipeline.classifier import classify_security_event

def get_file_hash(filepath: str) -> str:
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return ""

def generate_fim_event(filepath: str, action: str, file_hash: str = "") -> SecurityEvent:
    event_id = f"evt_{uuid.uuid4().hex}"
    
    # Lightweight suspiciousness check (e.g. extension)
    is_suspicious = False
    if filepath.endswith(".crypted") or "ransom" in filepath.lower() or filepath.endswith(".exe"):
        is_suspicious = True

    raw_message = f"FIM: File {action} detected at {filepath}"
    
    event = SecurityEvent(
        id=event_id,
        network_id="net_workspace",
        device_id="dev_local",
        source_type="FIM",
        event_type="file_integrity",
        raw_message=raw_message,
        is_suspicious=is_suspicious,
        provenance=ProvenanceMetadata(
            source_id="workspace_scanner",
            sensor_type="FIM",
            sensitivity_level="internal",
            retention_policy="90d",
            immutable_hash=hashlib.sha256(raw_message.encode()).hexdigest()
        ),
        canonical=CanonicalFields(
            event_kind="event",
            event_category="file",
            event_type=action,
            file_path=filepath,
            file_hash_sha256=file_hash,
            action=action
        )
    )
    
    # Save event
    save_record("events", event_id, event.model_dump())
    
    return event

def scan_workspace(directory: str):
    print(f"Scanning workspace: {directory}")
    for root, dirs, files in os.walk(directory):
        # Ignore common noisy directories
        if ".git" in root or "node_modules" in root or "__pycache__" in root or ".gemini" in root:
            continue
        for file in files:
            filepath = os.path.join(root, file)
            file_hash = get_file_hash(filepath)
            generate_fim_event(filepath, "scan", file_hash)
    print("Scan complete.")

if __name__ == "__main__":
    scan_workspace(os.getcwd())
