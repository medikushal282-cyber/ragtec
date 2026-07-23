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
