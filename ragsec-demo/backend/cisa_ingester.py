import json
import urllib.request
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from llm_engine import generate_mitigation

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

def fetch_and_ingest_cisa_kev():
    db: Session = SessionLocal()
    try:
        req = urllib.request.Request(CISA_KEV_URL, headers={'User-Agent': 'RAGSec-Threat-Ingester/2.4'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            vulnerabilities = data.get('vulnerabilities', [])
            
            count = 0
            for vuln in vulnerabilities[:10]: # Process latest 10
                cve_id = vuln.get('cveID')
                if not cve_id:
                    continue
                
                # Check if exists
                existing = db.query(models.Threat).filter(models.Threat.id == cve_id).first()
                if not existing:
                    # Auto-generate AI summary
                    summary = f"CISA KEV Vulnerability: {vuln.get('vulnerabilityName')}. {vuln.get('shortDescription')}"
                    
                    new_threat = models.Threat(
                        id=cve_id,
                        name=vuln.get('vulnerabilityName'),
                        type=vuln.get('requiredAction', 'Known Exploited Vulnerability'),
                        origin=f"CISA KEV ({vuln.get('vendorProject', 'Vendor')})",
                        severity="Critical" if "Remote Code Execution" in summary or "RCE" in summary else "High",
                        solution=vuln.get('requiredAction', 'Apply vendor updates immediately.'),
                        exceptions=f"Due Date: {vuln.get('dueDate', 'Immediate')}",
                        ts=vuln.get('dateAdded', datetime.datetime.utcnow().strftime('%Y-%m-%d'))
                    )
                    db.add(new_threat)
                    count += 1
            
            db.commit()
            print(f"[CISA KEV Ingester] Ingested {count} new real-world vulnerabilities.")
    except Exception as e:
        print(f"[CISA KEV Ingester Error] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fetch_and_ingest_cisa_kev()
