import os
import sys
import time
import subprocess
import urllib.request
import json

sys.path.insert(0, os.path.dirname(__file__))

db_path = os.path.join(os.getcwd(), "ragsec.db")
if os.path.exists(db_path):
    try:
        os.remove(db_path)
    except Exception:
        pass

def start_backend():
    proc = subprocess.Popen(["C:\\Python313\\python.exe", "app.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(20)  # Wait for startup
    return proc

def stop_backend(proc):
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()

def api_post(endpoint, payload):
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/api/soc{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    return json.loads(urllib.request.urlopen(req).read())

def api_get(endpoint):
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/soc{endpoint}")
    return json.loads(urllib.request.urlopen(req).read())

print("Starting backend for Stage 1 (Batch 5)...")
proc = start_backend()
try:
    print("=== 1. Injecting Events ===")
    import uuid
    e1 = {
        "id": f"EV-{uuid.uuid4().hex[:6].upper()}",
        "network_id": "NET-A",
        "device_id": "DEV-01",
        "source_type": "ids",
        "event_type": "alert",
        "raw_message": "Suspicious file detected",
        "canonical": {"file_hash_sha256": "BADHASH123"}
    }
    e2 = {
        "id": f"EV-{uuid.uuid4().hex[:6].upper()}",
        "network_id": "NET-B",
        "device_id": "DEV-02",
        "source_type": "ids",
        "event_type": "alert",
        "raw_message": "Suspicious file detected",
        "canonical": {"file_hash_sha256": "BADHASH123"}
    }
    e3 = {
        "id": f"EV-{uuid.uuid4().hex[:6].upper()}",
        "network_id": "NET-C",
        "device_id": "DEV-03",
        "source_type": "ids",
        "event_type": "alert",
        "raw_message": "Different file detected",
        "canonical": {"file_hash_sha256": "GOODHASH999"}
    }

    api_post("/events", e1)
    api_post("/events", e2)
    api_post("/events", e3)
    print("  Events injected.")

    print("=== 2. Testing Cross-Network Correlation ===")
    corrs = api_get("/correlations/cross-network")
    print(f"  Found {len(corrs)} correlations.")
    
    assert len(corrs) == 1, f"Expected 1 correlation, got {len(corrs)}"
    c = corrs[0]
    nets = {c["network_a"], c["network_b"]}
    assert nets == {"NET-A", "NET-B"}, f"Expected NET-A and NET-B, got {nets}"
    assert c["indicator_type"] == "hash"
    assert c["indicator_value"] == "BADHASH123"
    print("  Cross-network correlation test passed!")

    print("=== ALL BATCH 5 CHECKS PASSED ===")
finally:
    stop_backend(proc)
