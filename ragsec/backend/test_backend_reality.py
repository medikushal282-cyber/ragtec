import os
import json
import sqlite3
import datetime
from fastapi.testclient import TestClient
from app import app
from db.database import init_db, get_connection
from domain.soc_models import IncidentStatus, MitigationStatus, ClassificationState

client = TestClient(app)

def setup_database():
    init_db()

def test_fim_telemetry_integration():
    print("Running test_fim_telemetry_integration...")
    payload = {
        "event_type": "FIM",
        "file_path": "/etc/shadow",
        "action": "modified",
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "hash": "deadbeef1234",
        "device_id": "TEST-DEV-01",
        "network_id": "TEST-NET-01",
        "is_suspicious": True
    }
    
    response = client.post("/api/soc/telemetry/fim", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    incident_data = response.json()
    
    assert incident_data is not None
    assert "id" in incident_data
    incident_id = incident_data["id"]
    
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT data FROM incidents WHERE id=?", (incident_id,))
    row = c.fetchone()
    assert row is not None, "Incident not saved to database"
    saved_incident = json.loads(row["data"])
    assert saved_incident["status"] in [IncidentStatus.DETECTED, IncidentStatus.INVESTIGATING, IncidentStatus.CLASSIFIED], f"Got unexpected status {saved_incident['status']}"
    assert saved_incident["threat_classification"]["confidence"] in [0.0, 1.0]
    print("test_fim_telemetry_integration PASSED")

def test_mitigation_lifecycle():
    print("Running test_mitigation_lifecycle...")
    payload = {
        "event_type": "IDS",
        "signature": "ET TROJAN Possible malware payload",
        "device_id": "TEST-DEV-02",
        "network_id": "TEST-NET-01"
    }
    res = client.post("/api/soc/telemetry/ids", json=payload)
    incident_id = res.json()["id"]
    
    rec_res = client.post(f"/api/soc/incidents/{incident_id}/mitigations", json={
        "action_type": "ISOLATE",
        "description": "Isolate from network",
        "target_device_id": "TEST-DEV-02"
    })
    action_id = rec_res.json()["id"]
    assert rec_res.json()["status"] == "RECOMMENDED"
    
    app_res = client.post(f"/api/soc/mitigations/{action_id}/approve", json={"analyst_id": "admin"})
    assert app_res.json()["status"] == "APPROVED"
    
    exec_res = client.post(f"/api/soc/mitigations/{action_id}/execute")
    assert exec_res.json()["status"] == "EXECUTED_SIMULATED"
    
    ver_res = client.post(f"/api/soc/mitigations/{action_id}/verify", json={"success": True, "notes": "Looks isolated"})
    assert ver_res.json()["status"] == "VERIFIED_SIMULATED"
    print("test_mitigation_lifecycle PASSED")

def test_gating_fail_closed():
    print("Running test_gating_fail_closed...")
    from governance import policy
    original_eval = policy.evaluate_evidence_policy
    
    def mocked_fail(*args, **kwargs):
        raise ValueError("Simulated policy crash")
        
    policy.evaluate_evidence_policy = mocked_fail
    try:
        from api import routes
        result = routes._run_evidence_gating([], "low")
        assert result["passed"] is False, "Expected gating to fail closed"
        assert result["status"] == "ERROR", "Expected ERROR status"
        assert result["confidence"] == 0.0
    finally:
        policy.evaluate_evidence_policy = original_eval
    print("test_gating_fail_closed PASSED")

if __name__ == "__main__":
    setup_database()
    test_fim_telemetry_integration()
    test_mitigation_lifecycle()
    test_gating_fail_closed()
    print("All backend reality tests PASSED!")
