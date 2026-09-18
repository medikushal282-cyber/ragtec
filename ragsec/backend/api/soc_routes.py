from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from domain.soc_models import Network, Device, SecurityEvent, Incident, MitigationAction, MitigationStatus, IncidentStatus
from pipeline.event_pipeline import pipeline_instance
from domain.mitigation import mitigation_service
from domain.ingestion import ingestion_normalizer
import db.database as db_module
from db.database import get_events_by_device, get_events_by_network
import json

from pathlib import Path
import os
import json

router = APIRouter(prefix="/api/soc", tags=["soc_platform"])

# For MVP, we load the synthetic dataset into memory to serve the API
DATASET_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "soc_dataset.json"
if not DATASET_PATH.exists():
    DATASET_PATH = Path(__file__).resolve().parent.parent / "data" / "soc_dataset.json"

networks_db = {}
devices_db = {}

def load_dataset():
    try:
        with open(DATASET_PATH, "r") as f:
            data = json.load(f)
            for n in data.get("networks", []):
                net = Network(**n)
                networks_db[n["id"]] = net
                # Persist to SQLite so the DB reflects the full network topology
                db_module.save_record('networks', n["id"], n)
            for d in data.get("devices", []):
                dev = Device(**d)
                devices_db[d["id"]] = dev
                # Persist with network_id FK
                db_module.save_record('devices', d["id"], d, 'network_id', d["network_id"])
            for e in data.get("events", []):
                # Tag seeded events so a future DemoProvider can filter them
                e["data_source"] = "seeded"
                pipeline_instance.process_event(SecurityEvent(**e))
    except FileNotFoundError:
        pass

# Load the dataset immediately upon module import
load_dataset()

@router.get("/networks", response_model=List[Network])
def get_networks():
    return list(networks_db.values())

@router.get("/networks/{network_id}/devices", response_model=List[Device])
def get_devices_for_network(network_id: str):
    """Returns all devices belonging to a specific network (Network → Device chain)."""
    devs = [d for d in devices_db.values() if d.network_id == network_id]
    if not devs:
        # Fallback to DB if in-memory cache missed
        rows = db_module.get_records_by_fk('devices', 'network_id', network_id)
        devs = [Device(**r) for r in rows]
    return devs

@router.get("/devices", response_model=List[Device])
def get_devices(network_id: Optional[str] = None):
    devs = list(devices_db.values())
    if network_id:
        devs = [d for d in devs if d.network_id == network_id]
    return devs

@router.get("/devices/{device_id}/events")
def get_events_for_device(device_id: str):
    """Returns all security events attributed to a specific device (Device → Event chain)."""
    rows = get_events_by_device(device_id)
    return rows

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



from api.routes import execute_query
from models import QueryRequest, IncidentSeverity, SensitivityTier, Evidence
from db.database import get_record

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
    
    # Fetch cross-network correlations
    correlations = pipeline_instance.find_cross_network_correlations()
    incident_event_ids = {e.id for e in inc.events}
    
    print(f"DEBUG RAG: Incident {incident_id} has event IDs {incident_event_ids}")
    print(f"DEBUG RAG: Found {len(correlations)} correlations")
    
    extra_evidence = []
    seen_event_ids = set()
    
    for c in correlations:
        correlated_event_id = None
        is_a = False
        print(f"DEBUG RAG: checking corr {c.event_a_id} <-> {c.event_b_id}")
        if c.event_a_id in incident_event_ids and c.event_b_id not in incident_event_ids:
            correlated_event_id = c.event_b_id
            is_a = False
        elif c.event_b_id in incident_event_ids and c.event_a_id not in incident_event_ids:
            correlated_event_id = c.event_a_id
            is_a = True
            
        print(f"DEBUG RAG: correlated_event_id determined as {correlated_event_id}")
        if correlated_event_id and correlated_event_id not in seen_event_ids:
            seen_event_ids.add(correlated_event_id)
            ev_data = get_record("events", correlated_event_id)
            print(f"DEBUG RAG: fetched ev_data: {ev_data is not None}")
            if ev_data:
                net_id = c.network_a if is_a else c.network_b
                dev_id = c.device_a_id if is_a else c.device_b_id
                extra_evidence.append(Evidence(
                    chunk_id=f"EV-{correlated_event_id}",
                    document_id=correlated_event_id,
                    source_name=f"Correlated Telemetry ({net_id})",
                    source_type="telemetry",
                    text=ev_data.get("raw_message", ""),
                    similarity_score=1.0,
                    adjusted_similarity=1.0,
                    sensitivity_tier=SensitivityTier.RESTRICTED,
                    network_id=net_id,
                    device_id=dev_id,
                    correlation_reason=c.reason
                ))
    
    print(f"DEBUG RAG: extra_evidence size: {len(extra_evidence)}")            
    req = QueryRequest(
        query=query,
        severity=rag_sev,
        allowed_tiers=[SensitivityTier.PUBLIC, SensitivityTier.INTERNAL, SensitivityTier.RESTRICTED],
        extra_evidence=extra_evidence
    )
    
    # Run canonical RAGSec query pipeline
    try:
        response = execute_query(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/correlations/cross-network")
def get_cross_network_correlations():
    from pipeline.event_pipeline import pipeline_instance
    return [c.model_dump() for c in pipeline_instance.find_cross_network_correlations()]

@router.get("/audit", response_model=list)
def get_audit_trail():
    from domain.audit import audit_service
    return audit_service.get_audit_trail()

@router.get("/audit/verify")
def verify_audit_chain():
    from domain.audit import audit_service
    return {"status": audit_service.verify_chain()}

@router.get("/dashboard")
def get_dashboard_telemetry():
    from db.database import get_all_records
    events = get_all_records("events")
    incidents = pipeline_instance.get_all_incidents()
    
    # Process events for FIM vs other
    fim_events = [e for e in events if e.get("source_type") == "FIM"]
    other_events = [e for e in events if e.get("source_type") != "FIM"]
    
    recent_incidents = [i.model_dump() for i in incidents[:10]] if incidents else []
    
    # Count network devices
    device_count = len(devices_db)
    
    # Count critical incidents
    critical_incidents = [i for i in incidents if str(getattr(i.threat_classification.severity, "value", i.threat_classification.severity) or "").lower() == "critical"]
    
    return {
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").UTC).isoformat(),
        "simulated": False,
        "metrics": {
            "total_events": len(events),
            "fim_events": len(fim_events),
            "total_incidents": len(incidents),
            "device_count": device_count,
            "critical_incidents": len(critical_incidents)
        },
        "incidents": recent_incidents,
        "fim": fim_events[:10]
    }

class MitigationRequest(BaseModel):
    action_type: str
    description: str
    target_device_id: str

class AnalystDecision(BaseModel):
    analyst_id: str

class VerifyRequest(BaseModel):
    success: bool
    notes: str

@router.post("/incidents/{incident_id}/mitigations", response_model=MitigationAction)
def recommend_mitigation(incident_id: str, req: MitigationRequest):
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    action = mitigation_service.recommend_mitigation(inc, req.action_type, req.description, req.target_device_id)
    return action

@router.get("/incidents/{incident_id}/mitigations", response_model=List[MitigationAction])
def get_mitigations_for_incident(incident_id: str):
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc.mitigation_actions

@router.post("/mitigations/{action_id}/approve", response_model=MitigationAction)
def approve_mitigation(action_id: str, req: AnalystDecision):
    action = mitigation_service.approve_mitigation(action_id, req.analyst_id)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not in pending state")
    return action

@router.post("/mitigations/{action_id}/reject", response_model=MitigationAction)
def reject_mitigation(action_id: str, req: AnalystDecision):
    action = mitigation_service.reject_mitigation(action_id, req.analyst_id)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not in pending state")
    return action

@router.post("/mitigations/{action_id}/execute", response_model=MitigationAction)
def execute_mitigation(action_id: str):
    action = mitigation_service.execute_mitigation(action_id)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not approved")
    return action

@router.post("/mitigations/{action_id}/verify", response_model=MitigationAction)
def verify_mitigation(action_id: str, req: VerifyRequest):
    action = mitigation_service.verify_mitigation(action_id, req.success, req.notes)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not executed")
    return action

@router.get("/mitigations/history", response_model=List[MitigationAction])
def get_mitigation_history():
    rows = db_module.get_all_records("mitigations")
    return [MitigationAction(**row) for row in rows]
