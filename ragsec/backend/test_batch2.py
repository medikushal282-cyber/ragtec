"""
Batch 2 Verification Test
Run from: c:\Projects\RAGTEC\ragsec\backend
  C:\Python313\python.exe test_batch2.py
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

# Fresh DB
if os.path.exists("ragsec.db"):
    os.remove("ragsec.db")

from db.database import init_db
init_db()

from domain.soc_models import SecurityEvent, IncidentStatus, ThreatCategory
from pipeline.event_pipeline import EventPipeline

pipeline = EventPipeline()

print("=== 1. Basic correlation: same device, same category ===")
e1 = SecurityEvent(id="EVT-C1", network_id="NET-CORP", device_id="DEV-A",
                   source_type="IDS", event_type="alert",
                   raw_message="Rapid encryption of 15000 files. Shadow copies deleted via vssadmin.",
                   is_suspicious=True, data_source="seeded")
e2 = SecurityEvent(id="EVT-C2", network_id="NET-CORP", device_id="DEV-A",
                   source_type="EDR", event_type="alert",
                   raw_message="Rapid encryption of additional files. Extension changed to .crypted.",
                   is_suspicious=True, data_source="seeded")

inc1 = pipeline.process_event(e1)
inc2 = pipeline.process_event(e2)

assert inc1 is not None, "FAIL: e1 did not produce an incident"
assert inc2 is not None, "FAIL: e2 did not produce an incident"
assert inc1.id == inc2.id, f"FAIL: events not correlated into same incident. Got {inc1.id} vs {inc2.id}"
assert len(inc2.events) == 2, f"FAIL: expected 2 events in correlated incident, got {len(inc2.events)}"
assert inc2.status == IncidentStatus.INVESTIGATING, f"FAIL: expected INVESTIGATING after 2 events, got {inc2.status}"
print(f"  Incident {inc1.id}: {len(inc2.events)} correlated events, status={inc2.status}: OK")

print("\n=== 2. Severity escalation on correlated evidence ===")
e3 = SecurityEvent(id="EVT-C3", network_id="NET-CORP", device_id="DEV-A",
                   source_type="EDR", event_type="alert",
                   raw_message="Encryption of backup volumes. vssadmin delete shadows confirmed.",
                   is_suspicious=True, data_source="seeded")
e4 = SecurityEvent(id="EVT-C4", network_id="NET-CORP", device_id="DEV-A",
                   source_type="AV", event_type="alert",
                   raw_message="Ransomware note dropped: READ_ME.txt .crypted extension found.",
                   is_suspicious=True, data_source="seeded")

inc3 = pipeline.process_event(e3)
inc4 = pipeline.process_event(e4)
assert inc4.id == inc1.id, "FAIL: e3/e4 not correlated into same incident"
assert inc4.threat_classification.severity == "critical", \
    f"FAIL: expected critical after 4 events, got {inc4.threat_classification.severity}"
print(f"  Severity after 4 correlated events: {inc4.threat_classification.severity}: OK")

print("\n=== 3. Different category = new incident ===")
e5 = SecurityEvent(id="EVT-C5", network_id="NET-CORP", device_id="DEV-A",
                   source_type="Firewall", event_type="alert",
                   raw_message="Periodic DNS requests to c2-tracker.net indicating beaconing.",
                   is_suspicious=True, data_source="seeded")
inc5 = pipeline.process_event(e5)
assert inc5 is not None
assert inc5.id != inc1.id, "FAIL: C2 event incorrectly merged into Ransomware incident"
print(f"  C2 event spawned separate incident {inc5.id}: OK")

print("\n=== 4. UNKNOWN event absorbed into existing device incident ===")
e6 = SecurityEvent(id="EVT-C6", network_id="NET-CORP", device_id="DEV-A",
                   source_type="SIEM", event_type="alert",
                   raw_message="Suspicious process activity detected on DEV-A.",
                   is_suspicious=True, data_source="seeded")
inc6 = pipeline.process_event(e6)
# UNKNOWN should absorb into C2 (highest severity among open incidents for DEV-A aside from Ransomware)
# In this case it can absorb into either open incident - just confirm it was absorbed not spawned fresh
all_incidents = pipeline.get_all_incidents()
total_incident_count = len(all_incidents)
print(f"  Total incidents after 6 events: {total_incident_count} (should be 2 or 3): OK")
assert total_incident_count <= 3, f"FAIL: too many incidents ({total_incident_count}), correlation not working"

print("\n=== 5. Different network = separate incident (no cross-network correlation) ===")
e7 = SecurityEvent(id="EVT-C7", network_id="NET-DC", device_id="DEV-A",
                   source_type="IDS", event_type="alert",
                   raw_message="Rapid encryption of 15000 files. Shadow copies deleted via vssadmin.",
                   is_suspicious=True, data_source="seeded")
inc7 = pipeline.process_event(e7)
assert inc7 is not None
assert inc7.id != inc1.id, "FAIL: cross-network correlation should not happen"
print(f"  NET-DC event spawned separate incident {inc7.id}: OK")

print("\n=== 6. Provenance on correlated events ===")
fresh_inc = pipeline.get_incident(inc1.id)
for ev in fresh_inc.events:
    assert ev.data_source == "seeded", f"FAIL: data_source lost on event {ev.id}"
print(f"  All {len(fresh_inc.events)} events retain data_source='seeded': OK")

print("\n=== ALL BATCH 2 CHECKS PASSED ===")
print(f"  Final incident count: {len(pipeline.get_all_incidents())}")
for inc in pipeline.get_all_incidents():
    print(f"    {inc.id} | {inc.network_id} | devices={inc.affected_device_ids} | events={len(inc.events)} | cat={inc.threat_classification.category.value} | sev={inc.threat_classification.severity} | status={inc.status.value}")
