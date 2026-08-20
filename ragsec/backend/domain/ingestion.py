import hashlib
import json
import uuid
from typing import Dict, Any, Optional
from domain.soc_models import SecurityEvent, ProvenanceMetadata, CanonicalFields

class IngestionNormalizer:
    @staticmethod
    def _generate_immutable_hash(payload: Dict[str, Any]) -> str:
        # Sort keys to ensure consistent hashing
        serialized = json.dumps(payload, sort_keys=True).encode('utf-8')
        return hashlib.sha256(serialized).hexdigest()

    def normalize_fim_event(self, raw_payload: Dict[str, Any]) -> SecurityEvent:
        """Normalize FIM (File Integrity Monitoring) telemetry."""
        immutable_hash = self._generate_immutable_hash(raw_payload)
        
        prov = ProvenanceMetadata(
            source_id=raw_payload.get("sensor_id", "unknown_fim"),
            sensor_type="FIM",
            sensitivity_level="internal",
            retention_policy="90d",
            immutable_hash=immutable_hash
        )
        
        canon = CanonicalFields(
            event_kind="event",
            event_category="file",
            event_type=raw_payload.get("action", "change"),
            file_path=raw_payload.get("file_path"),
            file_hash_sha256=raw_payload.get("sha256"),
            user_name=raw_payload.get("user"),
            action=raw_payload.get("action")
        )
        
        # Build raw message representing the event
        msg = f"FIM {canon.action} on {canon.file_path} by {canon.user_name} (hash: {canon.file_hash_sha256})"
        
        return SecurityEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            network_id=raw_payload.get("network_id", "unknown_net"),
            device_id=raw_payload.get("device_id", "unknown_dev"),
            source_type="FIM",
            event_type=canon.event_type,
            raw_message=msg,
            provenance=prov,
            canonical=canon,
            is_suspicious=raw_payload.get("is_suspicious", False)
        )

    def normalize_ids_event(self, raw_payload: Dict[str, Any]) -> SecurityEvent:
        """Normalize IDS/IPS/Network telemetry."""
        immutable_hash = self._generate_immutable_hash(raw_payload)
        
        prov = ProvenanceMetadata(
            source_id=raw_payload.get("sensor_id", "unknown_ids"),
            sensor_type="IDS",
            sensitivity_level="confidential",
            retention_policy="1y",
            immutable_hash=immutable_hash
        )
        
        canon = CanonicalFields(
            event_kind="alert",
            event_category="network",
            event_type="connection",
            source_ip=raw_payload.get("src_ip"),
            destination_ip=raw_payload.get("dst_ip"),
            action=raw_payload.get("action", "allowed")
        )
        
        rule_name = raw_payload.get("rule_name", "Unknown Alert")
        msg = f"IDS Alert: {rule_name} | {canon.source_ip} -> {canon.destination_ip} ({canon.action})"
        
        return SecurityEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            network_id=raw_payload.get("network_id", "unknown_net"),
            device_id=raw_payload.get("device_id", "unknown_dev"),
            source_type="IDS",
            event_type=canon.event_type,
            raw_message=msg,
            provenance=prov,
            canonical=canon,
            is_suspicious=raw_payload.get("is_suspicious", True)
        )

    def normalize_syslog_event(self, raw_payload: Dict[str, Any]) -> SecurityEvent:
        """Normalize standard Windows/Syslog events."""
        immutable_hash = self._generate_immutable_hash(raw_payload)
        
        prov = ProvenanceMetadata(
            source_id=raw_payload.get("sensor_id", "unknown_syslog"),
            sensor_type="Syslog",
            sensitivity_level="internal",
            retention_policy="90d",
            immutable_hash=immutable_hash
        )
        
        canon = CanonicalFields(
            event_kind="event",
            event_category="process",
            event_type="start",
            process_name=raw_payload.get("process_name"),
            user_name=raw_payload.get("user")
        )
        
        msg = raw_payload.get("message", "Unknown Syslog Event")
        
        return SecurityEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            network_id=raw_payload.get("network_id", "unknown_net"),
            device_id=raw_payload.get("device_id", "unknown_dev"),
            source_type="Syslog",
            event_type=canon.event_type,
            raw_message=msg,
            provenance=prov,
            canonical=canon,
            is_suspicious=raw_payload.get("is_suspicious", False)
        )

ingestion_normalizer = IngestionNormalizer()
