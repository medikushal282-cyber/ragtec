from pydantic import BaseModel
from typing import Optional

class ThreatCreate(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    origin: str
    severity: str
    solution: Optional[str] = None
    exceptions: Optional[str] = None
    ts: Optional[str] = None

class ThreatResponse(ThreatCreate):
    id: str
    ts: str

    class Config:
        from_attributes = True

from typing import List, Any

class ChatMessageSchema(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    confidence: Optional[float] = None
    evidence: Optional[List[str]] = None
    executive_summary: Optional[str] = None
    technical_analysis: Optional[str] = None
    immediate_mitigation: Optional[List[str]] = None
    is_zero_day: Optional[bool] = False
    created_at: Any

    class Config:
        from_attributes = True

class ChatSessionSchema(BaseModel):
    id: str
    title: str
    created_at: Any
    messages: List[ChatMessageSchema] = []

    class Config:
        from_attributes = True
