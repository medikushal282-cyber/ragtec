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
