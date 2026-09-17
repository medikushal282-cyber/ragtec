import uuid
import datetime
from typing import List, Optional
from domain.soc_models import (
    SecurityEvent, Incident, IncidentStatus,
    ThreatClassification, ClassificationState, ThreatCategory
)
from pipeline.classifier import classify_security_event
import db.database as db

# Correlation window: events on the same device with the same threat category
# within this window are merged into a single incident.
CORRELATION_WINDOW_HOURS = 1

# Severity escalation thresholds (correlated event count -> severity)
_ESCALATION_MAP = [
    (4, "critical"),
    (3, "high"),
    (2, "medium"),
]

def _escalate_severity(current: str, event_count: int) -> str:
    """Escalate severity if correlated evidence count crosses a threshold."""
    severity_rank = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    for threshold, new_sev in _ESCALATION_MAP:
        if event_count >= threshold:
            if severity_rank.get(new_sev, 0) > severity_rank.get(current, 0):
                return new_sev
            break
    return current


class EventPipeline:
    def __init__(self):
        # In-memory correlation index: maps correlation_key -> incident_id
        # Rebuilt from DB on first access via _rebuild_index()
        self._corr_index: dict = {}
        self._index_built = False

    def _rebuild_index(self):
        """Rebuild the in-memory correlation index from persisted incidents."""
        self._corr_index = {}
        rows = db.get_all_records('incidents')
        cutoff = (datetime.datetime.now(datetime.UTC)
                  - datetime.timedelta(hours=CORRELATION_WINDOW_HOURS)).isoformat()
        for row in rows:
            inc = Incident(**row)
            # Only index open (non-resolved/closed) incidents within the window
            if inc.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                continue
            if inc.updated_at < cutoff:
                continue
            key = self._corr_key(
                inc.network_id,
                inc.affected_device_ids[0] if inc.affected_device_ids else "",
                inc.threat_classification.category
            )
            self._corr_index[key] = inc.id
        self._index_built = True

    def _ensure_index(self):
        if not self._index_built:
            self._rebuild_index()

    @staticmethod
    def _corr_key(network_id: str, device_id: str, category: ThreatCategory) -> str:
        return f"{network_id}::{device_id}::{category.value}"

    def process_event(self, event: SecurityEvent) -> Optional[Incident]:
        """
        1. Persist event to DB
        2. Classify the raw message
        3. Correlate: find an existing open incident for (network, device, category)
           within the correlation window; if found merge; otherwise spawn new.
        """
        # 1. Persist
        db.save_record('events', event.id, event.model_dump(), 'network_id', event.network_id)

        # 2. Classify
        is_suspicious = event.is_suspicious if event.is_suspicious is not None else False
        classification = classify_security_event(event.raw_message, is_suspicious)

        if classification.state == ClassificationState.BENIGN:
            return None

        # 3. Correlate
        self._ensure_index()
        return self._correlate_or_spawn(event, classification)

    def _correlate_or_spawn(self, event: SecurityEvent, classification: ThreatClassification) -> Incident:
        """
        Merge event into an existing open incident when the correlation key matches.
        Unknown-category events are absorbed into the highest-severity open incident
        for that device (if one exists within the window).
        """
        cutoff = (datetime.datetime.now(datetime.UTC)
                  - datetime.timedelta(hours=CORRELATION_WINDOW_HOURS)).isoformat()

        # Primary lookup: exact (network, device, category) match
        corr_key = self._corr_key(event.network_id, event.device_id, classification.category)
        existing_id = self._corr_index.get(corr_key)

        # For UNKNOWN: absorb into any open incident on same device
        if not existing_id and classification.category == ThreatCategory.UNKNOWN:
            existing_id = self._find_any_open_incident_for_device(
                event.network_id, event.device_id, cutoff
            )

        if existing_id:
            existing = self.get_incident(existing_id)
            if (existing
                    and existing.updated_at >= cutoff
                    and existing.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]):
                return self._merge_event_into_incident(event, classification, existing)

        return self._spawn_incident(event, classification, corr_key)

    def _find_any_open_incident_for_device(self, network_id: str, device_id: str, cutoff: str) -> Optional[str]:
        """Find the highest-severity open incident for a device (any category)."""
        severity_rank = {"critical": 3, "high": 2, "medium": 1, "low": 0}
        best_id = None
        best_rank = -1
        rows = db.get_all_records('incidents')
        for row in rows:
            try:
                inc = Incident(**row)
            except Exception:
                continue
            if inc.network_id != network_id:
                continue
            if device_id not in inc.affected_device_ids:
                continue
            if inc.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                continue
            if inc.updated_at < cutoff:
                continue
            rank = severity_rank.get(inc.threat_classification.severity, 0)
            if rank > best_rank:
                best_rank = rank
                best_id = inc.id
        return best_id

    def _merge_event_into_incident(self, event: SecurityEvent, classification: ThreatClassification, incident: Incident) -> Incident:
        """Merge a correlated event into an existing incident."""
        existing_ids = {e.id for e in incident.events}
        if event.id not in existing_ids:
            incident.events.append(event)

        if event.device_id not in incident.affected_device_ids:
            incident.affected_device_ids.append(event.device_id)

        # Escalate severity based on correlated evidence count
        new_severity = _escalate_severity(
            incident.threat_classification.severity,
            len(incident.events)
        )
        if new_severity != incident.threat_classification.severity:
            incident.threat_classification.severity = new_severity
            incident.threat_classification.rationale += (
                f" [Escalated to {new_severity} after {len(incident.events)} correlated events]"
            )

        # Advance to INVESTIGATING once we have 2+ correlated events
        if len(incident.events) >= 2 and incident.status == IncidentStatus.DETECTED:
            incident.status = IncidentStatus.INVESTIGATING

        incident.updated_at = datetime.datetime.now(datetime.UTC).isoformat()
        self.update_incident(incident)
        return incident

    def _spawn_incident(self, event: SecurityEvent, classification: ThreatClassification, corr_key: str) -> Incident:
        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        incident = Incident(
            id=incident_id,
            network_id=event.network_id,
            affected_device_ids=[event.device_id],
            title=f"{classification.category.value} detected on {event.device_id}",
            status=IncidentStatus.DETECTED,
            threat_classification=classification,
            events=[event]
        )
        db.save_record('incidents', incident.id, incident.model_dump(), 'network_id', incident.network_id)
        from domain.audit import audit_service
        audit_service.log_event("SYSTEM", "CREATE_INCIDENT", incident.id, f"Created incident for {classification.category.value}")
        self._corr_index[corr_key] = incident.id
        return incident

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        data = db.get_record('incidents', incident_id)
        if data:
            return Incident(**data)
        return None

    def get_all_incidents(self) -> List[Incident]:
        rows = db.get_all_records('incidents')
        return [Incident(**row) for row in rows]

    def update_incident(self, incident: Incident) -> None:
        db.save_record('incidents', incident.id, incident.model_dump(), 'network_id', incident.network_id)
        from domain.audit import audit_service
        audit_service.log_event("SYSTEM_ORCHESTRATOR", "UPDATE_INCIDENT", incident.id, f"Updated incident status to {incident.status.value}")

    def find_cross_network_correlations(self) -> List['CrossNetworkCorrelation']:
        from domain.soc_models import CrossNetworkCorrelation
        correlations = []
        events = list(self.events.values())
        
        ioc_map = {}
        for e in events:
            for entity_type, values in e.extracted_entities.items():
                if entity_type.lower() in ["ip", "domain", "hash", "cve"]:
                    for v in values:
                        ioc_map.setdefault((entity_type.lower(), v), []).append(e)
            if e.canonical:
                if e.canonical.file_hash_sha256:
                    ioc_map.setdefault(("hash", e.canonical.file_hash_sha256), []).append(e)
                if e.canonical.source_ip:
                    ioc_map.setdefault(("ip", e.canonical.source_ip), []).append(e)
                if e.canonical.destination_ip:
                    ioc_map.setdefault(("ip", e.canonical.destination_ip), []).append(e)

        seen_pairs = set()
        import uuid
        for (ioc_type, ioc_val), ev_list in ioc_map.items():
            for i in range(len(ev_list)):
                for j in range(i + 1, len(ev_list)):
                    e1 = ev_list[i]
                    e2 = ev_list[j]
                    if e1.network_id != e2.network_id:
                        if e1.network_id > e2.network_id:
                            e1, e2 = e2, e1
                        pair_id = f"{e1.id}-{e2.id}-{ioc_type}-{ioc_val}"
                        if pair_id not in seen_pairs:
                            seen_pairs.add(pair_id)
                            correlations.append(CrossNetworkCorrelation(
                                id=f"CNC-{uuid.uuid4().hex[:6].upper()}",
                                network_a=e1.network_id,
                                network_b=e2.network_id,
                                indicator_type=ioc_type,
                                indicator_value=ioc_val,
                                reason=f"Shared IOC — {ioc_type}",
                                event_a_id=e1.id,
                                event_b_id=e2.id,
                                device_a_id=e1.device_id,
                                device_b_id=e2.device_id
                            ))
        return correlations

    @property
    def events(self):
        rows = db.get_all_records('events')
        return {row['id']: SecurityEvent(**row) for row in rows}


pipeline_instance = EventPipeline()
