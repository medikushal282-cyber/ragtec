"""
Batch 1 Verification Test
Run from: c:\Projects\RAGTEC\ragsec\backend
  py test_batch1.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

print("=== 1. DB schema migration ===")
# Remove old DB to force fresh init
if os.path.exists("ragsec.db"):
    os.remove("ragsec.db")
    print("  Removed old ragsec.db")

from db.database import init_db, get_connection
init_db()
conn = get_connection()
c = conn.cursor()
c.execute("PRAGMA table_info(events)")
cols = {row[1] for row in c.fetchall()}
assert "device_id" in cols, "FAIL: device_id column missing from events"
assert "data_source" in cols, "FAIL: data_source column missing from events"
print("  events table has device_id, data_source columns: OK")

c.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
indexes = {row[0] for row in c.fetchall()}
assert "idx_events_device" in indexes, "FAIL: idx_events_device missing"
assert "idx_events_network" in indexes, "FAIL: idx_events_network missing"
print(f"  Indexes: {indexes}: OK")
conn.close()

print("\n=== 2. Model enrichment ===")
from domain.soc_models import Device, SecurityEvent

d = Device(id="DEV-T1", network_id="NET-CORP", hostname="test-host",
           ip_address="10.0.0.1", device_type="Workstation", criticality="low",
           status="active", os="Windows 11", segment="LAN", risk_score=42)
assert d.os == "Windows 11"
assert d.segment == "LAN"
assert d.risk_score == 42
assert d.last_seen is None  # optional
print("  Device model enriched: OK")

e = SecurityEvent(id="EVT-T1", network_id="NET-CORP", device_id="DEV-T1",
                  source_type="Test", event_type="test", raw_message="test event",
                  data_source="seeded")
assert e.data_source == "seeded"
print("  SecurityEvent data_source='seeded': OK")

e2 = SecurityEvent(id="EVT-T2", network_id="NET-CORP", device_id="DEV-T1",
                   source_type="IDS", event_type="alert", raw_message="live alert")
assert e2.data_source == "live"
print("  SecurityEvent default data_source='live': OK")

print("\n=== 3. Provenance survives normalization ===")
from domain.ingestion import ingestion_normalizer
raw = {"network_id": "NET-CORP", "device_id": "DEV-T1", "file_path": "/etc/passwd",
       "sha256": "abc123", "user": "root", "action": "modified", "sensor_id": "FIM-01"}
norm = ingestion_normalizer.normalize_fim_event(raw)
assert norm.provenance is not None
assert norm.provenance.immutable_hash != ""
assert norm.provenance.sensor_type == "FIM"
assert norm.canonical.file_path == "/etc/passwd"
assert norm.data_source == "live"  # live by default from normalizer
print("  Provenance immutable_hash preserved: OK")
print(f"  Hash: {norm.provenance.immutable_hash[:16]}...")

print("\n=== 4. Network->Device->Event chain ===")
from db.database import save_record, get_events_by_device, get_events_by_network

save_record("networks", "NET-CORP", {"id": "NET-CORP", "name": "Corporate"})
save_record("devices", "DEV-T1", {"id": "DEV-T1", "network_id": "NET-CORP", "hostname": "test-host"}, "network_id", "NET-CORP")

# Save event with data_source=seeded
event_data = norm.model_dump()
event_data["data_source"] = "seeded"
save_record("events", norm.id, event_data)

# Query by device
devt_events = get_events_by_device("DEV-T1")
assert len(devt_events) >= 1, "FAIL: no events returned for DEV-T1"
assert devt_events[0]["device_id"] == "DEV-T1"
print(f"  get_events_by_device('DEV-T1'): {len(devt_events)} event(s): OK")

# Confirm data_source preserved in DB
assert devt_events[0]["data_source"] == "seeded"
print("  data_source='seeded' survives DB round-trip: OK")

print("\n=== ALL BATCH 1 CHECKS PASSED ===")
