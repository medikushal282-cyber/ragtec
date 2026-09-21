"""
ragsec.backend.api.siem_routes
API routes for Enterprise SIEM & Ticketing Export Gateway.
"""
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from connectors.siem_connectors import (
    siem_exporter, ExportIncidentPayload
)

router = APIRouter(prefix="/api/siem", tags=["siem-connectors"])


class ExportRequestPayload(BaseModel):
    platform: str = "servicenow" # servicenow | splunk | sentinel | qradar | all
    incident: ExportIncidentPayload


@router.get("/templates")
def get_siem_templates():
    """
    Returns supported SIEM platform schemas and field mappings.
    """
    sample = ExportIncidentPayload()
    return {
        "supported_platforms": [
            {
                "id": "servicenow",
                "name": "ServiceNow Incident Response (SIR)",
                "table": "sn_siem_incident",
                "format": "JSON / REST API",
                "features": ["Urgency/Impact auto-mapping", "Work notes citation binding", "CMDB CI assignment"]
            },
            {
                "id": "splunk",
                "name": "Splunk Enterprise Security (ES)",
                "table": "notable",
                "format": "JSON / Splunk HEC",
                "features": ["Notable Event generation", "Drilldown URI to RAGSec", "Search query auto-generation"]
            },
            {
                "id": "sentinel",
                "name": "Microsoft Sentinel",
                "table": "SecurityIncident",
                "format": "Azure Resource JSON",
                "features": ["ARM REST API Schema", "MITRE ATT&CK Tactics/Techniques tagging", "Entity relation graph"]
            },
            {
                "id": "qradar",
                "name": "IBM QRadar SIEM",
                "table": "offenses",
                "format": "QRadar REST API JSON",
                "features": ["Magnitude calculation (1-10)", "Credibility & Relevance weighting", "Rule correlation link"]
            }
        ],
        "sample_preview": {
            "servicenow": siem_exporter.to_servicenow(sample),
            "splunk": siem_exporter.to_splunk_es(sample),
            "sentinel": siem_exporter.to_microsoft_sentinel(sample),
            "qradar": siem_exporter.to_ibm_qradar(sample)
        }
    }


@router.post("/export")
def export_to_siem(req: ExportRequestPayload):
    """
    Exports incident data to the specified SIEM format with SHA-256 evidence integrity seal.
    """
    plat = req.platform.lower().strip()
    incident = req.incident

    if plat == "servicenow":
        payload = siem_exporter.to_servicenow(incident)
    elif plat in ["splunk", "splunk_es"]:
        payload = siem_exporter.to_splunk_es(incident)
    elif plat in ["sentinel", "microsoft_sentinel", "azure_sentinel"]:
        payload = siem_exporter.to_microsoft_sentinel(incident)
    elif plat in ["qradar", "ibm_qradar"]:
        payload = siem_exporter.to_ibm_qradar(incident)
    elif plat == "all":
        payload = {
            "servicenow": siem_exporter.to_servicenow(incident),
            "splunk": siem_exporter.to_splunk_es(incident),
            "sentinel": siem_exporter.to_microsoft_sentinel(incident),
            "qradar": siem_exporter.to_ibm_qradar(incident)
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported SIEM platform '{plat}'. Supported: servicenow, splunk, sentinel, qradar, all.")

    from domain.audit import audit_service
    audit_service.log_event("SYSTEM", "SIEM_EXPORT", incident.incident_id, f"Exported incident payload to {plat.upper()}")

    return {
        "status": "SUCCESS",
        "platform": plat,
        "incident_id": incident.incident_id,
        "sha256_evidence_seal": payload.get("sha256_evidence_seal") if isinstance(payload, dict) and "sha256_evidence_seal" in payload else "MULTIPLE",
        "payload": payload
    }


@router.post("/test-connection")
def test_siem_connection(platform: str = "servicenow"):
    """
    Simulates gateway connection health check and schema validation for a given SIEM platform.
    """
    return {
        "platform": platform,
        "status": "ONLINE",
        "latency_ms": 18,
        "endpoint": f"https://gateway.enterprise.local/api/v1/{platform}/ingest",
        "schema_validation": "PASSED",
        "tls_version": "TLSv1.3",
        "crypto_signature_verified": True
    }
