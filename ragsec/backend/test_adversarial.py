import os
import json
import uuid
import datetime
from fastapi.testclient import TestClient
from app import app
from db.database import init_db, get_connection, save_record, get_all_records
from domain.soc_models import IncidentStatus, MitigationStatus, ClassificationState

client = TestClient(app)
failures = []

import traceback

def run_test(name, func):
    try:
        print(f"Running {name}...")
        func()
        print(f"{name} PASSED")
    except AssertionError as e:
        print(f"{name} FAILED: {e}")
        traceback.print_exc()
        failures.append(name)
    except Exception as e:
        print(f"{name} CRASHED: {e}")
        traceback.print_exc()
        failures.append(name)

# 1. FAIL-CLOSED
def test_fail_closed_gating():
    from governance import policy
    original_eval = policy.evaluate_evidence_policy
    def mocked_fail(*args, **kwargs): raise ValueError("Simulated DB timeout")
    policy.evaluate_evidence_policy = mocked_fail
    try:
        from api import routes
        result = routes._run_evidence_gating([], "low")
        assert result["passed"] is False, "Must not generate LLM response on crash"
        assert result["status"] == "ERROR", "Must return explicit ERROR"
    finally:
        policy.evaluate_evidence_policy = original_eval

def test_fail_closed_crc():
    from api import routes
    original_verify = None
    try:
        from verification.verifier import verify_response
        original_verify = verify_response
        def mocked_fail(*args, **kwargs): raise ValueError("Simulated verify crash")
        import verification.verifier
        verification.verifier.verify_response = mocked_fail
        
        result = routes._run_crc_verification("test answer", [], "low")
        assert result["crc_passed"] is False, "Must not return PASSED on crash"
        assert result["citation_check"] == "ERROR", "Must return ERROR"
    finally:
        if original_verify:
            import verification.verifier
            verification.verifier.verify_response = original_verify

def test_fail_closed_db():
    from db import database
    original_save = database.save_record
    def mocked_save(*args, **kwargs): raise ValueError("Simulated DB failure")
    database.save_record = mocked_save
    try:
        payload = {
            "event_type": "FIM",
            "file_path": "/etc/shadow",
            "action": "modified",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "hash": "deadbeef1234",
            "device_id": "TEST-DEV-DB-FAIL",
            "network_id": "TEST-NET-01",
            "is_suspicious": True
        }
        try:
            res = client.post("/api/soc/telemetry/fim", json=payload)
            assert res.status_code == 500, f"Expected 500 DB error, got {res.status_code}"
        except ValueError as e:
            if "Simulated DB failure" in str(e):
                pass # Expected
            else:
                raise
    finally:
        database.save_record = original_save

def test_fail_closed_llm():
    from api import soc_routes
    original_exec = soc_routes.execute_query
    def mocked_exec(*args, **kwargs): raise ValueError("LLM Unavailable")
    soc_routes.execute_query = mocked_exec
    try:
        # Create a real incident
        res_inc = client.post("/api/soc/telemetry/fim", json={"event_type": "FIM", "file_path": "/etc/shadow", "device_id": "D1", "network_id": "N1", "is_suspicious": True})
        inc_id = res_inc.json()["id"]
        
        res = client.post(f"/api/soc/incidents/{inc_id}/investigate")
        assert res.status_code == 500, f"Expected 500, got {res.status_code}. Response: {res.text}"
        assert "LLM Unavailable" in res.json()["detail"], "Must not fabricate answer"
    finally:
        soc_routes.execute_query = original_exec

# 2. CLASSIFICATION
def test_classification():
    from pipeline.classifier import classify_security_event
    
    # Known malicious
    res_threat = classify_security_event("Detected ET TROJAN Possible malware detected", True)
    assert res_threat.state.value == "THREAT", f"Expected THREAT, got {res_threat.state.value}"
    assert res_threat.confidence == 1.0, "Deterministic match must not use pseudo-ML confidence"
    
    # Suspicious unmatched
    res_unknown = classify_security_event("An unusual spike in weird packets", True)
    assert res_unknown.state.value == "UNKNOWN", f"Expected UNKNOWN, got {res_unknown.state.value}"
    assert res_unknown.confidence == 0.0, "Unknown must not use pseudo-ML confidence"
    
    # Benign
    res_benign = classify_security_event("Standard ping response", False)
    assert res_benign.state.value == "BENIGN", f"Expected BENIGN, got {res_benign.state.value}"

# 3. CORRELATION
def test_correlation():
    # Submit event 1
    p1 = {"event_type": "IDS", "signature": "ET TROJAN Possible malware payload", "device_id": "TEST-DEV-CORR", "network_id": "TEST-NET-CORR", "is_suspicious": True}
    res1 = client.post("/api/soc/telemetry/ids", json=p1)
    inc1_id = res1.json()["id"]
    
    # Same network/device/category -> merge
    res2 = client.post("/api/soc/telemetry/ids", json=p1)
    assert res2.json()["id"] == inc1_id, "Should merge into same incident"
    
    # Different device -> separate
    p2 = p1.copy()
    p2["device_id"] = "TEST-DEV-OTHER"
    res3 = client.post("/api/soc/telemetry/ids", json=p2)
    assert res3.json()["id"] != inc1_id, "Different device must separate"
    
    # Unknown absorption
    p3 = {"event_type": "FIM", "file_path": "/weird/path", "action": "modified", "device_id": "TEST-DEV-CORR", "network_id": "TEST-NET-CORR", "is_suspicious": True}
    res4 = client.post("/api/soc/telemetry/fim", json=p3)
    assert res4.json()["id"] == inc1_id, "Unknown event should absorb into open incident on same device"

# 4. MITIGATION
def test_mitigation_illegal_transitions():
    p1 = {"event_type": "IDS", "signature": "ET TROJAN", "device_id": "TEST-DEV-MIT", "network_id": "TEST-NET-MIT", "is_suspicious": True}
    res = client.post("/api/soc/telemetry/ids", json=p1)
    inc_id = res.json()["id"]
    
    rec = client.post(f"/api/soc/incidents/{inc_id}/mitigations", json={"action_type": "ISOLATE", "description": "test", "target_device_id": "TEST-DEV-MIT"})
    act_id = rec.json()["id"]
    
    # Try execution without approval
    exec_res = client.post(f"/api/soc/mitigations/{act_id}/execute")
    assert exec_res.status_code == 400, "Execution without approval must be rejected"
    
    # Reject
    client.post(f"/api/soc/mitigations/{act_id}/reject", json={"analyst_id": "admin"})
    
    # Try execution after rejection
    exec_res2 = client.post(f"/api/soc/mitigations/{act_id}/execute")
    assert exec_res2.status_code == 400, "Execution after rejection must fail"

# 5. CROSS-NETWORK
def test_cross_network():
    # Event on Network A with IP 1.2.3.4
    client.post("/api/soc/telemetry/ids", json={"event_type": "IDS", "signature": "ET TROJAN", "device_id": "DEV-A", "network_id": "NET-A", "src_ip": "1.2.3.4", "is_suspicious": True})
    # Event on Network B with IP 1.2.3.4
    client.post("/api/soc/telemetry/ids", json={"event_type": "IDS", "signature": "ET TROJAN", "device_id": "DEV-B", "network_id": "NET-B", "src_ip": "1.2.3.4", "is_suspicious": True})
    
    res = client.get("/api/soc/correlations/cross-network")
    corrs = res.json()
    assert len([c for c in corrs if c["indicator_value"] == "1.2.3.4"]) > 0, "Cross-network correlation must find shared IOC"

# 6. AUDIT
def test_audit_chain():
    from domain.audit import audit_service
    # Need to trigger something to generate an audit log if DB was clean
    audit_service.log_event("tester", "TEST_ACTION", "TEST_TARGET", "SUCCESS")
    
    res = client.get("/api/soc/audit/verify")
    # if it's already invalid, we need to know why
    assert res.json()["status"] == "VALID", f"Expected initial audit to be VALID, got {res.json()['status']}"
    
    # Mutate DB directly to break chain
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, data FROM audit_logs LIMIT 1")
    row = c.fetchone()
    if row:
        data = json.loads(row["data"])
        data["action"] = "MUTATED"
        c.execute("UPDATE audit_logs SET data=? WHERE id=?", (json.dumps(data), row["id"]))
        conn.commit()
    conn.close()
    
    # Verify chain detects mutation
    res = client.get("/api/soc/audit/verify")
    assert res.json()["status"].startswith("INVALID"), f"Audit verification must fail when payload is mutated. Got: {res.json()['status']}"


if __name__ == "__main__":
    if os.path.exists("ragsec.db"):
        os.remove("ragsec.db")
    init_db()
    run_test("test_fail_closed_gating", test_fail_closed_gating)
    run_test("test_fail_closed_crc", test_fail_closed_crc)
    run_test("test_fail_closed_db", test_fail_closed_db)
    run_test("test_fail_closed_llm", test_fail_closed_llm)
    run_test("test_classification", test_classification)
    run_test("test_correlation", test_correlation)
    run_test("test_mitigation_illegal_transitions", test_mitigation_illegal_transitions)
    run_test("test_cross_network", test_cross_network)
    run_test("test_audit_chain", test_audit_chain)
    
    print("\n--- Summary ---")
    if failures:
        print(f"FAILED TESTS: {len(failures)}")
        for f in failures:
            print(f" - {f}")
        exit(1)
    else:
        print("ALL TESTS PASSED")
