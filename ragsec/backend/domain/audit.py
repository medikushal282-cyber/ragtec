import datetime
import hashlib
import json
import uuid
from typing import Optional, List
from domain.soc_models import AuditEvent
import db.database as db

class AuditService:
    def __init__(self):
        pass

    def _canonicalize(self, event_data: dict) -> bytes:
        # Canonicalize the event data before hashing
        # Removing previous_hash and current_hash if they are in the payload to hash the content
        payload = {k: v for k, v in event_data.items() if k not in ["previous_hash", "current_hash"]}
        return json.dumps(payload, sort_keys=True).encode("utf-8")

    def _get_latest_audit(self) -> Optional[AuditEvent]:
        records = db.get_all_records("audit_logs")
        if not records:
            return None
        # Sort by timestamp to get the last one
        sorted_records = sorted(records, key=lambda x: x["timestamp"])
        return AuditEvent(**sorted_records[-1])

    def log_event(self, actor: str, action: str, target: str, result: str, evidence_ref: Optional[str] = None) -> AuditEvent:
        latest = self._get_latest_audit()
        prev_hash = latest.current_hash if latest else None

        event = AuditEvent(
            id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
            actor=actor,
            action=action,
            target=target,
            result=result,
            evidence_ref=evidence_ref,
            previous_hash=prev_hash
        )

        canonical = self._canonicalize(event.model_dump())
        hash_input = (prev_hash or "") + canonical.decode("utf-8")
        event.current_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

        db.save_record("audit_logs", event.id, event.model_dump())
        return event

    def get_audit_trail(self) -> List[AuditEvent]:
        records = db.get_all_records("audit_logs")
        sorted_records = sorted(records, key=lambda x: x["timestamp"])
        return [AuditEvent(**r) for r in sorted_records]

    def verify_chain(self) -> str:
        records = db.get_all_records("audit_logs")
        if not records:
            return "VALID"
        
        sorted_records = sorted(records, key=lambda x: x["timestamp"])
        prev_hash = None
        
        for i, rec in enumerate(sorted_records):
            ev = AuditEvent(**rec)
            if ev.previous_hash != prev_hash:
                return f"INVALID: Broken previous-hash link at {ev.id}"
            
            canonical = self._canonicalize(rec)
            hash_input = (prev_hash or "") + canonical.decode("utf-8")
            expected_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()
            
            if ev.current_hash != expected_hash:
                return f"INVALID: Modified hash or payload at {ev.id}"
                
            prev_hash = ev.current_hash
            
        return "VALID"

audit_service = AuditService()
