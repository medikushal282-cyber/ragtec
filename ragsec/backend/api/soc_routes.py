from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from domain.soc_models import Network, Device, SecurityEvent, Incident, MitigationAction, MitigationStatus, IncidentStatus
from pipeline.event_pipeline import pipeline_instance
from domain.mitigation import mitigation_service
from domain.ingestion import ingestion_normalizer
import json

router = APIRouter(prefix="/api/soc", tags=["soc_platform"])

# For MVP, we load the synthetic dataset into memory to serve the API
DATASET_PATH = "data/soc_dataset.json"

networks_db = {}
devices_db = {}

def load_dataset():
    try:
        with open(DATASET_PATH, "r") as f:
            data = json.load(f)
            for n in data.get("networks", []):
                networks_db[n["id"]] = Network(**n)
            for d in data.get("devices", []):
                devices_db[d["id"]] = Device(**d)
            for e in data.get("events", []):
                # We feed events through the pipeline to populate incidents
                pipeline_instance.process_event(SecurityEvent(**e))
    except FileNotFoundError:
        pass

# Load the dataset immediately upon module import
load_dataset()

@router.get("/networks", response_model=List[Network])
def get_networks():
    return list(networks_db.values())

@router.get("/devices", response_model=List[Device])
def get_devices(network_id: Optional[str] = None):
    devs = list(devices_db.values())
    if network_id:
        devs = [d for d in devs if d.network_id == network_id]
    return devs

@router.get("/events", response_model=List[SecurityEvent])
def get_events():
    return list(pipeline_instance.events.values())

@router.post("/events", response_model=Optional[Incident])
def submit_event(event: SecurityEvent):
    """Submits a raw event into the pipeline and returns the resulting incident."""
    incident = pipeline_instance.process_event(event)
    return incident

@router.post("/telemetry/fim", response_model=Optional[Incident])
def submit_fim_telemetry(payload: Dict[str, Any]):
    event = ingestion_normalizer.normalize_fim_event(payload)
    return pipeline_instance.process_event(event)

@router.post("/telemetry/ids", response_model=Optional[Incident])
def submit_ids_telemetry(payload: Dict[str, Any]):
    event = ingestion_normalizer.normalize_ids_event(payload)
    return pipeline_instance.process_event(event)

@router.post("/telemetry/syslog", response_model=Optional[Incident])
def submit_syslog_telemetry(payload: Dict[str, Any]):
    event = ingestion_normalizer.normalize_syslog_event(payload)
    return pipeline_instance.process_event(event)

@router.get("/incidents", response_model=List[Incident])
def get_incidents():
    return pipeline_instance.get_all_incidents()

@router.get("/incidents/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return inc

class RecommendMitigationReq(BaseModel):
    action_type: str
    description: str
    target_device_id: str

@router.post("/incidents/{incident_id}/mitigate", response_model=MitigationAction)
def recommend_mitigation(incident_id: str, req: RecommendMitigationReq):
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    action = mitigation_service.recommend_mitigation(inc, req.action_type, req.description, req.target_device_id)
    return action

@router.post("/mitigations/{action_id}/approve", response_model=MitigationAction)
def approve_mitigation(action_id: str, analyst_id: str = "SOC-ANALYST-1"):
    action = mitigation_service.approve_mitigation(action_id, analyst_id)
    if not action:
        raise HTTPException(status_code=400, detail="Cannot approve action.")
    return action

@router.post("/mitigations/{action_id}/execute", response_model=MitigationAction)
def execute_mitigation(action_id: str):
    action = mitigation_service.execute_mitigation(action_id)
    if not action:
        raise HTTPException(status_code=400, detail="Cannot execute action.")
    return action

@router.post("/mitigations/{action_id}/verify", response_model=MitigationAction)
def verify_mitigation(action_id: str, success: bool, notes: str):
    action = mitigation_service.verify_mitigation(action_id, success, notes)
    if not action:
        raise HTTPException(status_code=400, detail="Cannot verify action.")
    return action

from api.routes import execute_query
from models import QueryRequest, IncidentSeverity, SensitivityTier

@router.post("/incidents/{incident_id}/investigate")
def investigate_incident_rag(incident_id: str):
    """
    Uses the RAG engine to correlate CTI and playbooks for the incident.
    """
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    # Map SOC severity to RAGSec IncidentSeverity
    severity_map = {
        "low": IncidentSeverity.LOW,
        "medium": IncidentSeverity.MEDIUM,
        "high": IncidentSeverity.HIGH,
        "critical": IncidentSeverity.CRITICAL
    }
    rag_sev = severity_map.get(inc.threat_classification.severity.lower(), IncidentSeverity.MEDIUM)
    
    # Construct query based on incident events and threat
    threat = inc.threat_classification.category.value
    ev_context = " ".join([e.raw_message for e in inc.events])
    query = f"We have identified a {threat} threat. The suspicious events are: {ev_context}. What CTI, IOCs, CVEs, or playbooks relate to this, and what mitigation steps are recommended?"
    
    req = QueryRequest(
        query=query,
        severity=rag_sev,
        allowed_tiers=[SensitivityTier.PUBLIC, SensitivityTier.INTERNAL, SensitivityTier.RESTRICTED]
    )
    
    # Run canonical RAGSec query pipeline
    try:
        response = execute_query(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit", response_model=list)
def get_audit_trail():
    return mitigation_service.audits
