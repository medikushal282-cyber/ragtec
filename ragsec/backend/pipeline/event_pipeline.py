import uuid
from typing import List, Dict, Any, Optional
from domain.soc_models import SecurityEvent, Incident, IncidentStatus, ThreatClassification, ClassificationState
from pipeline.classifier import classify_security_event
import db.database as db

class EventPipeline:
    def __init__(self):
        # We now use the database instead of in-memory dicts.
        pass

    def process_event(self, event: SecurityEvent) -> Optional[Incident]:
        """
        Processes a raw security event, extracts entities, determines suspiciousness,
        classifies it, and creates or updates an incident if it's a threat.
        """
        # Save event to DB
        db.save_record('events', event.id, event.model_dump(), 'network_id', event.network_id)

        # Step 1: Suspiciousness is already parsed from JSON for demo, but we ensure it's evaluated
        is_suspicious = event.is_suspicious if event.is_suspicious is not None else False

        # Step 2: Classify Threat
        classification = classify_security_event(event.raw_message, is_suspicious)
        
        # Step 3: Spawn or update incident
        if classification.state in [ClassificationState.THREAT, ClassificationState.UNKNOWN]:
            incident = self._spawn_incident(event, classification)
            return incident
            
        return None

    def _spawn_incident(self, event: SecurityEvent, classification: ThreatClassification) -> Incident:
        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        
        incident = Incident(
            id=incident_id,
            network_id=event.network_id,
            affected_device_ids=[event.device_id],
            title=f"Suspicious Activity on {event.device_id} ({classification.category.value})",
            status=IncidentStatus.DETECTED,
            threat_classification=classification,
            events=[event]
        )
        
        # Save incident to DB
        db.save_record('incidents', incident.id, incident.model_dump(), 'network_id', incident.network_id)
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

    @property
    def events(self):
        # Compatibility property to get all events as dict
        rows = db.get_all_records('events')
        return {row['id']: SecurityEvent(**row) for row in rows}

pipeline_instance = EventPipeline()
