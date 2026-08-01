import models
from database import SessionLocal
import uuid
import datetime

def seed_database():
    db = SessionLocal()
    try:
        # Seed Settings
        if db.query(models.Setting).count() == 0:
            db.add_all([
                models.Setting(key="admin_username", value="System Administrator", description="Super Admin User"),
                models.Setting(key="theme", value="dark", description="UI Theme")
            ])

        # Seed Playbooks
        if db.query(models.Playbook).count() == 0:
            db.add_all([
                models.Playbook(
                    id="pb-ransomware",
                    title="Ransomware Containment",
                    category="Malware",
                    severity="CRITICAL",
                    description="Standard procedure for containing self-propagating encryption malware.",
                    steps={
                        "Containment": ["Isolate affected subnets", "Disable Active Directory sync", "Block C2 IOCs at firewall"],
                        "Eradication": ["Run offline AV scans", "Reimage affected hosts", "Reset compromised credentials"],
                        "Recovery": ["Restore from immutable backups", "Verify data integrity", "Monitor for reinfection"]
                    }
                ),
                models.Playbook(
                    id="pb-zeroday",
                    title="Zero-Day Mitigation",
                    category="Exploit",
                    severity="HIGH",
                    description="General containment strategy for unpatched vulnerabilities.",
                    steps={
                        "Detection": ["Analyze unusual network patterns", "Check for memory anomalies"],
                        "Containment": ["Implement network segmentation", "Apply WAF virtual patching"],
                        "Review": ["Report to CISA", "Monitor vendor channels for patches"]
                    }
                )
            ])

        # Seed Patches
        if db.query(models.Patch).count() == 0:
            db.add_all([
                models.Patch(
                    id="patch-win-rce",
                    vendor="Microsoft",
                    description="Windows Print Spooler RCE (CVE-2021-34527)",
                    severity="Critical",
                    status="Rolling Out",
                    progress=45.5
                ),
                models.Patch(
                    id="patch-nginx",
                    vendor="NGINX",
                    description="NGINX Buffer Overflow (CVE-2022-41741)",
                    severity="High",
                    status="Pending",
                    progress=0.0
                )
            ])

        # Seed KB Documents
        if db.query(models.KBDocument).count() == 0:
            db.add_all([
                models.KBDocument(
                    id=str(uuid.uuid4()),
                    title="CISA KEV Catalog Export - 2024",
                    category="Threat Intel",
                    content="Extracted STIX vectors for known exploited vulnerabilities.",
                    status="indexed"
                ),
                models.KBDocument(
                    id=str(uuid.uuid4()),
                    title="Internal Firewall Architecture v2",
                    category="Architecture",
                    content="Topology and segmentation rules for the hybrid cloud.",
                    status="indexed"
                )
            ])
            
        # Seed Pipeline Nodes
        if db.query(models.PipelineNode).count() == 0:
            db.add_all([
                models.PipelineNode(id="cisa", title="CISA KEV Feed", icon="database", desc="Real-world vulnerability catalog ingestion stream"),
                models.PipelineNode(id="ingest", title="Ingestion Pipeline", icon="layers", desc="FastAPI /api/ingest/alert with SQL deduplication"),
                models.PipelineNode(id="db", title="SQLite Database", icon="dns", desc="Structured persistence store (ragsec.db)"),
                models.PipelineNode(id="ws", title="WebSocket Manager", icon="podcasts", desc="Real-time alert broadcast manager (/ws/threats)"),
                models.PipelineNode(id="rerank", title="Time-Aware Engine", icon="manage_search", desc="Multi-variable scoring: Sim + Time + Risk + Trust"),
                models.PipelineNode(id="copilot", title="Security Copilot", icon="smart_toy", desc="Grounded response & zero-day containment engine"),
                models.PipelineNode(id="soc", title="SOC Dashboard", icon="dashboard", desc="Interactive React Command Center UI"),
            ])

        db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
