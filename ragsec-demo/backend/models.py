from sqlalchemy import Column, String, DateTime
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

from sqlalchemy import ForeignKey, Float, JSON
from sqlalchemy.orm import relationship

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
