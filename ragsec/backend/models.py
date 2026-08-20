"""
ragsec.backend.models
Canonical data models and schemas used throughout the RAGSec pipeline.
Preserves full document and chunk provenance.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Set, Optional, Any
from enum import Enum
import datetime

class SensitivityTier(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    RESTRICTED = "restricted"

class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ResponseStatus(str, Enum):
    ANSWERED = "ANSWERED"
    UNKNOWN = "UNKNOWN"
    ABSTAINED = "ABSTAINED"
    ESCALATED = "ESCALATED"

class ExtractedEntities(BaseModel):
    ips: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    hostnames: List[str] = Field(default_factory=list)
    hashes: List[str] = Field(default_factory=list)
    cves: List[str] = Field(default_factory=list)
    ttps: List[str] = Field(default_factory=list)

class CanonicalDocument(BaseModel):
    document_id: str
    source_name: str
    source_type: str # "cve", "mitre", "cti_report", "internal_sop", "incident"
    title: str
    content: str
    sensitivity_tier: SensitivityTier = SensitivityTier.INTERNAL
    ingestion_timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())
    publication_timestamp: Optional[str] = None
    url: Optional[str] = None
    content_hash: str = ""
    extracted_entities: ExtractedEntities = Field(default_factory=ExtractedEntities)

class CanonicalChunk(BaseModel):
    chunk_id: str
    document_id: str
    source_name: str
    source_type: str
    chunk_index: int
    text: str
    sensitivity_tier: SensitivityTier
    publication_timestamp: Optional[str] = None
    extracted_entities: ExtractedEntities = Field(default_factory=ExtractedEntities)

class Evidence(BaseModel):
    chunk_id: str
    document_id: str
    source_name: str
    source_type: str
    text: str
    masked_text: Optional[str] = None
    similarity_score: float
    adjusted_similarity: float
    sensitivity_tier: SensitivityTier
    publication_timestamp: Optional[str] = None
    citation_tag: str = "C1"

class CitationInfo(BaseModel):
    tag: str # e.g. "[C1]"
    chunk_id: str
    document_id: str
    source_name: str
    similarity_score: float
    snippet: str

class VerificationResult(BaseModel):
    passed: bool
    status: str # "VERIFIED", "PARTIAL", "UNSUPPORTED"
    verified_citations: List[str] = Field(default_factory=list)
    unsupported_citations: List[str] = Field(default_factory=list)
    verified_entities: List[Dict[str, Any]] = Field(default_factory=list)
    unsupported_entities: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class RetrievalSummary(BaseModel):
    results_count: int
    qualifying_sources_count: int
    avg_confidence: float
    threshold_met: bool
    theta_sim_applied: float
    theta_conf_applied: float

class QueryRequest(BaseModel):
    query: str
    severity: IncidentSeverity = IncidentSeverity.LOW
    allowed_tiers: List[SensitivityTier] = Field(default=[SensitivityTier.PUBLIC, SensitivityTier.INTERNAL])

class QueryResponse(BaseModel):
    status: ResponseStatus
    severity: IncidentSeverity
    answer: Optional[str] = None
    confidence: float
    retrieval: RetrievalSummary
    evidence: List[Evidence] = Field(default_factory=list)
    citations: List[CitationInfo] = Field(default_factory=list)
    verification: VerificationResult
    reason: Optional[str] = None
