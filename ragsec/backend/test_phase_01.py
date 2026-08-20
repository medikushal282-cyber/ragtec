import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/soc"

def print_res(res):
    print(f"Status: {res.status_code}")
    try:
        print(json.dumps(res.json(), indent=2))
        return res.json()
    except:
        print(res.text)
        return None

print("Waiting for server to start...")
time.sleep(10)

print("\n--- PHASE 1: SUBMITTING FIM EVENT ---")
fim_payload = {
    "sensor_id": "FIM-WIN-01",
    "network_id": "net-01",
    "device_id": "dev-net-01-1",
    "action": "modified",
    "file_path": "C:\\Windows\\System32\\drivers\\etc\\hosts",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "user": "SYSTEM",
    "is_suspicious": True
}
fim_res = print_res(requests.post(f"{BASE_URL}/telemetry/fim", json=fim_payload))

print("\n--- PHASE 1: SUBMITTING IDS EVENT ---")
ids_payload = {
    "sensor_id": "IDS-CORE-01",
    "network_id": "net-02",
    "device_id": "dev-net-02-router",
    "action": "dropped",
    "src_ip": "192.168.1.100",
    "dst_ip": "8.8.8.8",
    "rule_name": "ET MALWARE Suspicious DNS Query",
    "is_suspicious": True
}
ids_res = print_res(requests.post(f"{BASE_URL}/telemetry/ids", json=ids_payload))

print("\n--- PHASE 1: VERIFYING PROVENANCE METADATA ---")
if fim_res and "events" in fim_res:
    evt = fim_res["events"][0]
    print("FIM Event Provenance:")
    print(json.dumps(evt.get("provenance", {}), indent=2))
    print("FIM Event Canonical:")
    print(json.dumps(evt.get("canonical", {}), indent=2))

if ids_res and "events" in ids_res:
    evt = ids_res["events"][0]
    print("\nIDS Event Provenance:")
    print(json.dumps(evt.get("provenance", {}), indent=2))
    print("IDS Event Canonical:")
    print(json.dumps(evt.get("canonical", {}), indent=2))
