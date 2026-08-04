from sqlalchemy import Column, String, DateTime, Float, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Threat(Base):
    __tablename__ = "threats"

    id = Column(String, primary_key=True, index=True) # e.g. CVE-2024-1234
    name = Column(String) # e.g. Microsoft Windows Print Spooler RCE
    type = Column(String, index=True) # e.g. RCE, Buffer Overflow
    origin = Column(String) # e.g. CISA KEV
    severity = Column(String) # Critical, High, etc.
    solution = Column(String) # Mitigation steps
    exceptions = Column(String) # Notes or exceptions
    ts = Column(String) # Date added / Date formatted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String) # 'user' or 'assistant'
    content = Column(String)
    
    # Assistant metrics
    confidence = Column(Float, nullable=True)
    evidence = Column(JSON, nullable=True) # list of strings
    executive_summary = Column(String, nullable=True)
    technical_analysis = Column(String, nullable=True)
    immediate_mitigation = Column(JSON, nullable=True) # list of strings
    is_zero_day = Column(String, nullable=True) # Boolean stored as str or native depending on db
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class Playbook(Base):
    __tablename__ = "playbooks"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    severity = Column(String)
    description = Column(String)
    steps = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Patch(Base):
    __tablename__ = "patches"
    id = Column(String, primary_key=True, index=True)
    vendor = Column(String)
    description = Column(String)
    severity = Column(String)
    status = Column(String) # Pending, Rolling Out, Completed
    progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class KBDocument(Base):
    __tablename__ = "kb_documents"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    content = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)
    description = Column(String)

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(String, primary_key=True, index=True)
    path = Column(String) # Target (IP, URL, File Path)
    scan_type = Column(String, default="File Scan") # e.g. Network, Malware, Phishing, Vulnerability
    status = Column(String)
    findings = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    id = Column(String, primary_key=True, index=True)
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    active_threats = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class PipelineNode(Base):
    __tablename__ = "pipeline_nodes"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    icon = Column(String)
    desc = Column(String)
    status = Column(String, default="active")

# RAGSec+ Enterprise Additions
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, index=True)
    user = Column(String, default="system")
    action_type = Column(String) # e.g. "READ", "WRITE", "SCAN", "RETRIEVE", "INGEST"
    resource = Column(String)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class NetworkFlag(Base):
    __tablename__ = "network_flags"
    id = Column(String, primary_key=True, index=True)
    source_ip = Column(String)
    destination_ip = Column(String)
    flag_type = Column(String) # e.g. "Lateral Movement", "Beaconing", "Exfiltration"
    severity = Column(String)
    description = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class IngestedDocument(Base):
    __tablename__ = "ingested_documents"
    id = Column(String, primary_key=True, index=True)
    source_type = Column(String, index=True) # e.g. cve, mitre, synthetic, sop
    title = Column(String)
    body = Column(String)
    published_date = Column(DateTime, nullable=True)
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow)
    sensitivity_tier = Column(String) # public, internal, restricted
    url = Column(String, nullable=True)
    content_hash = Column(String, unique=True, index=True) # for deduplication
    chunked = Column(Boolean, default=False) # tracking for pipeline
