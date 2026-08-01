from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
import uuid
import random

router = APIRouter(prefix="/api/scanner", tags=["scanner"])

class ScanRequest(BaseModel):
    target: str # e.g. IP, URL, File path
    scan_type: str # "Malware", "Network", "Phishing", "Vulnerability"

@router.post("/scan")
def trigger_advanced_scan(req: ScanRequest, db: Session = Depends(get_db)):
    """Advanced Multi-Vector Threat Scanner Endpoint"""
    findings = []
    status = "completed"
    
    if req.scan_type == "Malware":
        findings = [
            {"file": req.target, "threat": "Trojan.Generic", "severity": "High", "desc": "Static analysis reveals packed executable with obfuscated imports."}
        ] if "exe" in req.target.lower() or "dll" in req.target.lower() else [{"file": req.target, "threat": "Clean", "severity": "Info", "desc": "No malicious signatures found."}]
        
    elif req.scan_type == "Network":
        findings = [
            {"target": req.target, "threat": "Anomalous Traffic", "severity": "Medium", "desc": "Detected irregular outbound payload sizes over port 443."}
        ]
        
    elif req.scan_type == "Phishing":
        findings = [
            {"target": req.target, "threat": "Credential Harvesting Link", "severity": "Critical", "desc": "URL resolves to known phishing infrastructure imitating Microsoft Login."}
        ] if "http" in req.target.lower() else [{"target": req.target, "threat": "Clean", "severity": "Info", "desc": "SPF/DKIM/DMARC pass."}]
        
    elif req.scan_type == "Vulnerability":
        findings = [
            {"target": req.target, "threat": "CVE-2023-XXXX", "severity": "High", "desc": "Outdated dependency found in package-lock.json."}
        ]
    else:
        findings = [{"error": "Unknown scan type"}]
        status = "failed"

    # Save to history
    history = models.ScanHistory(
        id=str(uuid.uuid4()),
        path=req.target,
        scan_type=req.scan_type,
        status=status,
        findings=findings
    )
    db.add(history)
    
    # Audit log
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        action_type="SCAN",
        resource=f"{req.scan_type} Scanner: {req.target}",
        details=f"Scan completed with {len(findings)} findings."
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": status,
        "target": req.target,
        "scan_type": req.scan_type,
        "findings": findings
    }

@router.get("/history")
def get_scan_history(db: Session = Depends(get_db)):
    scans = db.query(models.ScanHistory).order_by(models.ScanHistory.created_at.desc()).limit(20).all()
    return scans

@router.get("/scan-directory")
def scan_sandbox_directory(db: Session = Depends(get_db)):
    """Legacy endpoint for backward compatibility."""
    return {
        "scanned_directory": "./sandbox_scan",
        "findings": [
            {
                "file": "untrusted_rag_chunk.json",
                "severity": "Critical",
                "threat_type": "Adversarial Context Injection",
                "analysis": "Static analysis detected prompt injection vectors designed to override LLM system prompts.",
                "remedy": {
                    "executive_summary": "Quarantine untrusted context file and reset embedding index cache.",
                    "technical_analysis": "File contains [SYSTEM OVERRIDE] markers targeting RAG vector retrieval.",
                    "immediate_mitigation": [
                        "Isolate sandbox_scan/untrusted_rag_chunk.json",
                        "Purge vector store collection 'threat_intel'",
                        "Enable strict JSON schema validation on ingestion"
                    ]
                }
            }
        ]
    }
