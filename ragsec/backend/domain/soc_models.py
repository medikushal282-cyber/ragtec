from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum
import datetime

class NetworkTier(str, Enum):
    CORPORATE = "Corporate"
    DATACENTER = "Data Center"
    BRANCH = "Branch Office"

class ThreatCategory(str, Enum):
    PHISHING = "Phishing"
    MALWARE = "Malware"
    RANSOMWARE = "Ransomware"
    SPYWARE = "Spyware"
    TROJAN = "Trojan"
    BRUTE_FORCE = "Brute-force / Credential Attack"
    DOS_DDOS = "DoS / DDoS"
    DATA_EXFILTRATION = "Data Exfiltration"
    C2 = "Command and Control (C2)"
    INSIDER_THREAT = "Insider Threat"
    BENIGN = "Benign"
    UNKNOWN = "Unknown"

class ClassificationState(str, Enum):
    BENIGN = "BENIGN"
    THREAT = "THREAT"
    UNKNOWN = "UNKNOWN"

class MitigationStatus(str, Enum):
    RECOMMENDED = "RECOMMENDED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    EXECUTED_SIMULATED = "EXECUTED_SIMULATED"
    VERIFIED = "VERIFIED"
    VERIFIED_SIMULATED = "VERIFIED_SIMULATED"
    FAILED = "FAILED"

class IncidentStatus(str, Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    CLASSIFIED = "CLASSIFIED"
    MITIGATION_RECOMMENDED = "MITIGATION_RECOMMENDED"
    AWAITING_ANALYST_APPROVAL = "AWAITING_ANALYST_APPROVAL"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

# Domain Entities
class Network(BaseModel):
    id: str
    name: str
    environment_type: NetworkTier
    description: str
    sensitivity_tier: str

class Device(BaseModel):
    id: str
    network_id: str
    hostname: str
    ip_address: str
    device_type: str
    os: Optional[str] = None          # e.g. "Windows Server 2022", "Linux 6.1"
    segment: Optional[str] = None     # e.g. "DMZ", "LAN", "OT"
    criticality: str
    status: str
    last_seen: Optional[str] = None   # ISO-8601 timestamp
    risk_score: Optional[int] = None  # 0-100

class ProvenanceMetadata(BaseModel):
    source_id: str
    sensor_type: str  # "FIM", "IDS", "Syslog", etc
    sensitivity_level: str # "public", "internal", "confidential", "restricted"
    retention_policy: str # e.g. "90d", "1y"
    immutable_hash: str # SHA-256 of original raw payload

class CanonicalFields(BaseModel):
    event_kind: str = "event"
    event_category: str = "unknown"
    event_type: str = "info"
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    file_path: Optional[str] = None
    file_hash_sha256: Optional[str] = None
    user_name: Optional[str] = None
    process_name: Optional[str] = None
    action: Optional[str] = None

class SecurityEvent(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())
    network_id: str
    device_id: str
    source_type: str
    event_type: str
    raw_message: str

    # Provenance & normalization
    provenance: Optional[ProvenanceMetadata] = None
    canonical: Optional[CanonicalFields] = None

    extracted_entities: Dict[str, List[str]] = Field(default_factory=dict)
    is_suspicious: Optional[bool] = None

    # Data-source discriminator: 'live' | 'seeded' | 'demo'
    # Allows future centralized DemoProvider to filter without touching the real pipeline.
    data_source: str = "live"

class ThreatClassification(BaseModel):
    state: ClassificationState
    category: ThreatCategory
    confidence: float
    severity: str # "low", "medium", "high", "critical"
    rationale: str

class MitigationAction(BaseModel):
    id: str
    incident_id: str
    action_type: str
    target_device_id: str
    description: str
    status: MitigationStatus
    approved_by: Optional[str] = None
    verification_notes: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())

class Incident(BaseModel):
    id: str
    network_id: str
    affected_device_ids: List[str]
    title: str
    status: IncidentStatus
    threat_classification: ThreatClassification
    mitigation_actions: List[MitigationAction] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())
    analyst_assigned: Optional[str] = None
    events: List[SecurityEvent] = Field(default_factory=list)

class AuditEvent(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())
    actor: str
    action: str
    target: str
    result: str
    evidence_ref: Optional[str] = None
    previous_hash: Optional[str] = None
    current_hash: Optional[str] = None

class CrossNetworkCorrelation(BaseModel):
    id: str
    network_a: str
    network_b: str
    indicator_type: str
    indicator_value: str
    reason: str
    event_a_id: str
    event_b_id: str
    device_a_id: str
    device_b_id: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())

