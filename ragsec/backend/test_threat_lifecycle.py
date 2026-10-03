import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_full_threat_lifecycle():
    print("==================================================")
    print("Testing Real Threat Incident Creation, Quarantine & Recovery")
    print("==================================================")

    # 1. Simulate Threat
    filename = "trojan_dropper_simulation.ps1"
    print(f"\n[1] Deploying Test Threat Incident: {filename}...")
    res = client.post("/api/fim/simulate_threat", json={"filename": filename})
    assert res.status_code == 200, f"Deploy failed: {res.text}"
    data = res.json()
    print(f"    Status: {data['status']}")
    print(f"    Filepath: {data['filepath']}")
    assert os.path.exists(data['filepath']), "File was not created on disk!"
    print("    [PASS] File exists on disk in monitored_workspace/")

    # 2. Verify FIM Alert & Event
    print("\n[2] Checking FIM Events Stream...")
    res = client.get("/api/fim/events")
    events = res.json()
    evt = next((e for e in events if filename in str(e)), None)
    print(f"    [PASS] Found FIM Event: {evt.get('id')} - Suspicious: {evt.get('is_suspicious')}")

    # 3. Quarantine File (Mitigation)
    print(f"\n[3] Executing Mitigation: Quarantining {filename}...")
    res = client.post("/api/fim/quarantine", json={"file_path": filename})
    assert res.status_code == 200, f"Quarantine failed: {res.text}"
    q_data = res.json()
    print(f"    Quarantine Status: {q_data['status']}")
    print(f"    Quarantine Path: {q_data['quarantine_path']}")
    assert not os.path.exists(data['filepath']), "File should NOT exist in monitored_workspace after quarantine!"
    assert os.path.exists(q_data['quarantine_path']), "File should exist in .quarantine/!"
    print("    [PASS] Threat file successfully removed from monitored workspace and isolated in .quarantine/")

    # 4. Check Quarantined List
    print("\n[4] Querying Quarantined Enclave...")
    res = client.get("/api/fim/quarantined")
    q_list = res.json()
    print(f"    Quarantined files count: {len(q_list)}")
    matched_q = next((q for q in q_list if filename in q['quarantined_filename']), None)
    assert matched_q is not None, "Quarantined file not listed in /api/fim/quarantined!"
    print(f"    [PASS] Found in enclave: {matched_q['quarantined_filename']}")

    # 5. Recover File (Restoration)
    print(f"\n[5] Recovering File back to Monitored Workspace...")
    res = client.post("/api/fim/restore", json={
        "quarantine_path": q_data['quarantine_path'],
        "original_path": data['filepath']
    })
    assert res.status_code == 200, f"Restore failed: {res.text}"
    r_data = res.json()
    print(f"    Restore Status: {r_data['status']}")
    print(f"    Restored Path: {r_data['restored_path']}")
    assert os.path.exists(data['filepath']), "File was not restored to monitored_workspace!"
    assert not os.path.exists(q_data['quarantine_path']), "File should no longer be in .quarantine/!"
    print("    [PASS] Threat file successfully recovered into monitored workspace!")

    print("\n==================================================")
    print("[ALL STEPS VERIFIED: DEPLOY -> QUARANTINE -> RECOVER 100% OPERATIONAL!]")
    print("==================================================")

if __name__ == "__main__":
    test_full_threat_lifecycle()
