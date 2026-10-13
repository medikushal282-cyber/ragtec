"""
ragsec.backend.test_active_threats
Automated test suite verifying the harmless controlled replicator, active detection sentinel,
autonomous thread halting, attack banning, and quarantine containment.
"""
import time
import os
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_active_threat_pipeline():
    print("[TEST] 1. Checking Active Threat Status...")
    res = requests.get(f"{BASE_URL}/api/active-threats/replicator/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    status = res.json()
    print(f"       Replicator Status: is_running={status.get('is_running')}, sentinel_enabled={status.get('sentinel_enabled')}")

    print("[TEST] 2. Purging any leftover test replicas in quarantine...")
    requests.post(f"{BASE_URL}/api/active-threats/purge-replicas")

    print("[TEST] 3. Launching Controlled Harmless Replicator (limit=3, interval=1.0s)...")
    res = requests.post(f"{BASE_URL}/api/active-threats/replicator/launch", json={
        "max_replicas": 3,
        "interval_seconds": 1.0
    })
    assert res.status_code == 200, f"Launch failed: {res.text}"
    launch_info = res.json()
    print(f"       Thread Started: {launch_info.get('thread_id')}, Process: {launch_info.get('process_name')}")

    print("[TEST] 4. Waiting for Active Detection & Interception (Autonomous Sentinel)...")
    time.sleep(2.2)

    print("[TEST] 5. Querying Scan & Mitigate API...")
    res = requests.post(f"{BASE_URL}/api/active-threats/scan-and-mitigate")
    assert res.status_code == 200, f"Scan failed: {res.text}"
    mit_res = res.json()
    print(f"       Verdict: {mit_res.get('verdict')}")
    print(f"       Status: {mit_res.get('status')}")
    print(f"       Terminated Thread: {mit_res.get('terminated_thread')}")
    print(f"       Banned Signature: {mit_res.get('banned_signature')}")
    print(f"       Quarantined Files Count: {mit_res.get('quarantined_count')}")

    assert mit_res.get("detected") is True, "Threat should have been detected!"
    assert "replicating attack" in mit_res.get("verdict", "").lower(), "Verdict message mismatch!"
    assert mit_res.get("quarantined_count", 0) >= 1, "At least 1 replica should be quarantined!"

    print("[TEST] 6. Verifying Threat is permanently Banned and Halted...")
    res_status = requests.get(f"{BASE_URL}/api/active-threats/replicator/status")
    status_after = res_status.json()
    print(f"       Thread Status After Defense: {status_after.get('thread_status')}")
    print(f"       Banned Threat Count: {status_after.get('banned_threat_count')}")
    assert status_after.get("is_running") is False, "Thread must be terminated!"
    assert status_after.get("quarantined_replica_count", 0) >= 1, "Quarantined replica count must be >= 1"

    print("[TEST] 7. Testing Replica Incident Recovery / Restore...")
    res_restore = requests.post(f"{BASE_URL}/api/active-threats/restore-replicas")
    assert res_restore.status_code == 200
    restore_info = res_restore.json()
    print(f"       Restored Count: {restore_info.get('restored_count')}")
    assert restore_info.get("restored_count", 0) >= 1, "Must restore at least 1 replica file"

    print("[SUCCESS] All Active Threat Detection, Process Interception, and Containment tests passed!")

if __name__ == "__main__":
    test_active_threat_pipeline()
