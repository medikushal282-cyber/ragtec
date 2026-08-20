import uuid
from typing import Dict, List, Optional
from domain.soc_models import MitigationAction, MitigationStatus, Incident, IncidentStatus, AuditEvent
from pipeline.event_pipeline import pipeline_instance
import db.database as db

class MitigationLifecycle:
    def __init__(self):
        # Using SQLite for persistence
        pass
        
    def add_audit(self, actor: str, action: str, target: str, result: str, evidence_ref: str = None):
        audit = AuditEvent(
            id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
            actor=actor,
            action=action,
            target=target,
            result=result,
            evidence_ref=evidence_ref
        )
        db.save_record('audit_logs', audit.id, audit.model_dump())

    def recommend_mitigation(self, incident: Incident, action_type: str, description: str, target_device_id: str) -> MitigationAction:
        action = MitigationAction(
            id=f"MIT-{uuid.uuid4().hex[:6].upper()}",
            incident_id=incident.id,
            action_type=action_type,
            target_device_id=target_device_id,
            description=description,
            status=MitigationStatus.RECOMMENDED
        )
        # We need to save the mitigation action, and the incident.
        # Incident contains mitigation_actions as a list inside it. We should append and save incident.
        incident.mitigation_actions.append(action)
        incident.status = IncidentStatus.MITIGATION_RECOMMENDED
        pipeline_instance.update_incident(incident)
        
        db.save_record('mitigations', action.id, action.model_dump(), 'incident_id', incident.id)
        self.add_audit("SYSTEM", "RECOMMEND_MITIGATION", incident.id, f"Recommended: {action_type}")
        return action

    def get_mitigation(self, action_id: str) -> Optional[MitigationAction]:
        data = db.get_record('mitigations', action_id)
        if data:
            return MitigationAction(**data)
        return None

    def approve_mitigation(self, action_id: str, analyst_id: str) -> Optional[MitigationAction]:
        action = self.get_mitigation(action_id)
        if action and action.status in [MitigationStatus.RECOMMENDED, MitigationStatus.AWAITING_APPROVAL]:
            action.status = MitigationStatus.APPROVED
            action.approved_by = analyst_id
            
            # Save mitigation
            db.save_record('mitigations', action.id, action.model_dump(), 'incident_id', action.incident_id)
            
            # Sync to incident
            incident = pipeline_instance.get_incident(action.incident_id)
            if incident:
                for m in incident.mitigation_actions:
                    if m.id == action.id:
                        m.status = action.status
                        m.approved_by = action.approved_by
                pipeline_instance.update_incident(incident)
                
            self.add_audit(analyst_id, "APPROVE_MITIGATION", action.id, "Approved")
            return action
        return None

    def execute_mitigation(self, action_id: str) -> Optional[MitigationAction]:
        action = self.get_mitigation(action_id)
        if action and action.status == MitigationStatus.APPROVED:
            # SIMULATED EXECUTION
            action.status = MitigationStatus.EXECUTED
            db.save_record('mitigations', action.id, action.model_dump(), 'incident_id', action.incident_id)
            
            incident = pipeline_instance.get_incident(action.incident_id)
            if incident:
                for m in incident.mitigation_actions:
                    if m.id == action.id:
                        m.status = action.status
                pipeline_instance.update_incident(incident)
                
            self.add_audit("SYSTEM_ORCHESTRATOR", "EXECUTE_MITIGATION", action.id, "Executed (Simulated)")
            return action
        return None

    def verify_mitigation(self, action_id: str, success: bool, notes: str) -> Optional[MitigationAction]:
        action = self.get_mitigation(action_id)
        if action and action.status == MitigationStatus.EXECUTED:
            action.status = MitigationStatus.VERIFIED if success else MitigationStatus.FAILED
            action.verification_notes = notes
            db.save_record('mitigations', action.id, action.model_dump(), 'incident_id', action.incident_id)
            
            incident = pipeline_instance.get_incident(action.incident_id)
            if incident:
                for m in incident.mitigation_actions:
                    if m.id == action.id:
                        m.status = action.status
                        m.verification_notes = action.verification_notes
                
                all_done = all(m.status in [MitigationStatus.VERIFIED, MitigationStatus.REJECTED] for m in incident.mitigation_actions)
                if all_done:
                    incident.status = IncidentStatus.RESOLVED
                    self.add_audit("SYSTEM", "RESOLVE_INCIDENT", incident.id, "All mitigations processed")
                
                pipeline_instance.update_incident(incident)
            
            self.add_audit("SYSTEM_ORCHESTRATOR", "VERIFY_MITIGATION", action.id, f"{action.status.value}: {notes}")
            return action
        return None

    @property
    def audits(self):
        rows = db.get_all_records('audit_logs')
        # Ensure we sort them by timestamp or ID since they are fetched unordered from SQLite usually
        return rows

mitigation_service = MitigationLifecycle()
