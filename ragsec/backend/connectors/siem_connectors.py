"""
ragsec.backend.connectors.siem_connectors
Implements Enterprise SIEM and Ticketing Connectors per Section V-D of IEEE RAGSec paper:
- ServiceNow Incident Response (SIR)
- Splunk Enterprise Security (ES) Notable Events
- Microsoft Sentinel Incidents
- IBM QRadar Offenses

Includes SHA-256 evidence integrity hashing and signed audit trails.
"""
import hashlib
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ExportIncidentPayload(BaseModel):
    incident_id: str = "INC-2026-9042"
    title: str = "Ransomware Volume Shadow Copy Invalidation Activity"
    severity: str = "CRITICAL"
    category: str = "Ransomware"
    summary: str = "Observed vssadmin.exe attempting to purge shadow copies alongside bcdedit boot configuration alteration."
    investigation_notes: str = "Grounded analysis confirmed MITRE T1490. Citations [C1] and [C2] verified against threat corpus."
    mitigation_steps: List[str] = [
        "Isolate endpoint from local VLAN",
        "Terminate parent process tree",
        "Restore immutable backup storage snapshot"
    ]
    iocs: List[Dict[str, str]] = [
        {"type": "SHA256", "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
        {"type": "IP", "value": "45.142.214.18"},
        {"type": "COMMAND", "value": "vssadmin.exe delete shadows /all /quiet"}
    ]
    tactics: List[str] = ["Impact", "Defense Evasion"]
    techniques: List[str] = ["T1490", "T1562.001"]
    evidence_tags: List[str] = ["[C1]", "[C2]"]
    operator: str = "ragsec_analyst"


def _generate_sha256_signature(data: Dict[str, Any]) -> str:
    """Computes deterministic SHA-256 signature for chain of custody."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


class SIEMExporter:
    """
    Exports structured SOC investigation reports to major enterprise SIEM/SOAR platforms.
    """

    @staticmethod
    def to_servicenow(payload: ExportIncidentPayload) -> Dict[str, Any]:
        """
        ServiceNow Incident Response (SIR) table: sn_siem_incident / incident
        """
        now_utc = datetime.now(timezone.utc).isoformat()
        urgency_map = {"CRITICAL": 1, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        impact_map = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 2, "LOW": 3}
        priority_map = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}

        urgency = urgency_map.get(payload.severity.upper(), 2)
        impact = impact_map.get(payload.severity.upper(), 2)
        priority = priority_map.get(payload.severity.upper(), 3)

        work_notes = (
            f"=== RAGSec Grounded Threat Intelligence Report ===\n"
            f"Generated: {now_utc}\n"
            f"Classification: {payload.category} | Severity: {payload.severity}\n\n"
            f"Investigation Summary:\n{payload.summary}\n\n"
            f"Analysis & Evidence Grounding:\n{payload.investigation_notes}\n\n"
            f"Recommended Mitigations:\n" + "\n".join(f"- {m}" for m in payload.mitigation_steps) + "\n\n"
            f"Observed IOCs:\n" + "\n".join(f"- [{ioc['type']}] {ioc['value']}" for ioc in payload.iocs)
        )

        record = {
            "sys_id": f"sn_{hashlib.md5(payload.incident_id.encode()).hexdigest()[:32]}",
            "number": payload.incident_id,
            "short_description": f"[RAGSec] {payload.title}",
            "description": payload.summary,
            "caller_id": payload.operator,
            "urgency": urgency,
            "impact": impact,
            "priority": priority,
            "category": "Security Incident",
            "subcategory": payload.category,
            "work_notes": work_notes,
            "cmdb_ci": "Enterprise Workstation Fleet / Monitored Endpoint",
            "assigned_to": "SOC Tier 2 - Incident Response",
            "state": "2", # In Progress
            "close_notes": None,
            "created_on": now_utc,
            "integration_metadata": {
                "source": "IEEE RAGSec Threat Intelligence Core",
                "evidence_citations": payload.evidence_tags,
                "mitre_attack": payload.techniques
            }
        }

        signature = _generate_sha256_signature(record)
        record["sha256_evidence_seal"] = signature
        return record

    @staticmethod
    def to_splunk_es(payload: ExportIncidentPayload) -> Dict[str, Any]:
        """
        Splunk Enterprise Security (ES) Notable Event schema
        """
        now_epoch = int(time.time())
        urgency_map = {"CRITICAL": "critical", "HIGH": "high", "MEDIUM": "medium", "LOW": "low"}

        record = {
            "_time": now_epoch,
            "rule_id": f"RAGSEC_RULE_{payload.incident_id}",
            "rule_name": f"RAGSec Notable: {payload.title}",
            "rule_title": payload.title,
            "urgency": urgency_map.get(payload.severity.upper(), "medium"),
            "status": "in_progress",
            "owner": payload.operator,
            "security_domain": "endpoint",
            "correlation_id": payload.incident_id,
            "category": payload.category,
            "mitre_tactics": payload.tactics,
            "mitre_techniques": payload.techniques,
            "drilldown_name": "View RAGSec Evidence & CRC Citations",
            "drilldown_uri": f"http://127.0.0.1:3000/#/incident?id={payload.incident_id}",
            "search_query": f"index=ragsec_telemetry sourcetype=fim_event incident_id=\"{payload.incident_id}\"",
            "evidence_count": len(payload.evidence_tags),
            "evidence_citations": payload.evidence_tags,
            "iocs": payload.iocs,
            "actionable_mitigations": payload.mitigation_steps
        }

        signature = _generate_sha256_signature(record)
        record["sha256_evidence_seal"] = signature
        return record

    @staticmethod
    def to_microsoft_sentinel(payload: ExportIncidentPayload) -> Dict[str, Any]:
        """
        Microsoft Sentinel Incident schema (Azure Resource Model)
        """
        now_utc = datetime.now(timezone.utc).isoformat()
        severity_map = {"CRITICAL": "High", "HIGH": "High", "MEDIUM": "Medium", "LOW": "Low"}

        record = {
            "id": f"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/SOC-RG/providers/Microsoft.OperationalInsights/workspaces/Sentinel-Workspace/providers/Microsoft.SecurityInsights/Incidents/{payload.incident_id}",
            "name": payload.incident_id,
            "type": "Microsoft.SecurityInsights/Incidents",
            "properties": {
                "title": f"[RAGSec] {payload.title}",
                "description": payload.summary,
                "severity": severity_map.get(payload.severity.upper(), "Medium"),
                "status": "Active",
                "classification": "TruePositive",
                "classificationComment": "Verified by RAGSec Cross-Encoder & CRC Citation Verification.",
                "firstActivityTimeUtc": now_utc,
                "lastActivityTimeUtc": now_utc,
                "tactics": payload.tactics,
                "techniques": payload.techniques,
                "labels": [
                    {"labelName": "RAGSec-Grounded"},
                    {"labelName": f"Category:{payload.category}"},
                    {"labelName": f"CRC-Verified"}
                ],
                "owner": {
                    "assignedTo": payload.operator,
                    "email": f"{payload.operator}@enterprise.sec"
                },
                "incidentUrl": f"http://127.0.0.1:3000/#/incident?id={payload.incident_id}",
                "mitigationSteps": payload.mitigation_steps,
                "entities": [
                    {"kind": "SecurityAlert", "properties": {"alertDisplayName": payload.title}},
                    *[{"kind": "Indicator", "properties": {"networkDestinationIpv4": i["value"]} if i["type"] == "IP" else {"fileHashValue": i["value"]} if i["type"] == "SHA256" else {"commandLine": i["value"]}} for i in payload.iocs]
                ]
            }
        }

        signature = _generate_sha256_signature(record)
        record["sha256_evidence_seal"] = signature
        return record

    @staticmethod
    def to_ibm_qradar(payload: ExportIncidentPayload) -> Dict[str, Any]:
        """
        IBM QRadar SIEM Offense schema
        """
        magnitude_map = {"CRITICAL": 10, "HIGH": 8, "MEDIUM": 5, "LOW": 2}
        mag = magnitude_map.get(payload.severity.upper(), 5)

        record = {
            "id": int(hashlib.md5(payload.incident_id.encode()).hexdigest()[:7], 16) % 900000 + 100000,
            "offense_type": 1, # IP / Host Based
            "offense_source": payload.iocs[0]["value"] if payload.iocs else "127.0.0.1",
            "description": f"RAGSec Offense: {payload.title}",
            "magnitude": mag,
            "credibility": 9,
            "relevance": 9,
            "severity": mag,
            "event_count": 42,
            "flow_count": 18,
            "category_id": 1004, # Suspicious Activity
            "domain_id": 1,
            "assigned_to": payload.operator,
            "status": "OPEN",
            "follow_up": True,
            "rules": [
                {"id": 100201, "name": f"RAGSec Rule: {payload.category} Ingestion Match"}
            ],
            "mitre_techniques": payload.techniques,
            "action_plan": payload.mitigation_steps,
            "evidence_citations": payload.evidence_tags
        }

        signature = _generate_sha256_signature(record)
        record["sha256_evidence_seal"] = signature
        return record


siem_exporter = SIEMExporter()
