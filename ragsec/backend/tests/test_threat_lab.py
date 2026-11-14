import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/threat-lab"

def test_sample(sample_id):
    print(f"\n==========================================")
    print(f"TESTING SAMPLE: {sample_id}")
    print(f"==========================================")
    req = urllib.request.Request(f"{BASE_URL}/run/{sample_id}", method="POST")
    with urllib.request.urlopen(req) as resp:
        run_init = json.loads(resp.read().decode("utf-8"))
        test_id = run_init["test_id"]
        print(f"Launched Test: {test_id} | Sample: {run_init['sample_name']}")

    for _ in range(12):
        time.sleep(0.8)
        with urllib.request.urlopen(f"{BASE_URL}/status/{test_id}") as resp:
            st = json.loads(resp.read().decode("utf-8"))
            status = st.get("status")
            print(f"  [{st.get('runtime_seconds', 0)}s] Status: {status} | Files: {st.get('files_created_count')} | Timeline Steps: {len(st.get('timeline', []))}")
            if status in ["COMPLETED", "LIMIT_REACHED", "STOPPED_BY_USER"]:
                print(f"  [VERDICT] Incident: {st.get('incident_id')} | Verified Stopped: {st.get('verified_stopped')}")
                for t in st.get("timeline", []):
                    print(f"    Step {t['step']}: {t['title']} ({t['status']}) - {t['detail']}")
                return st
    return st

if __name__ == "__main__":
    for sample in [
        "replication_sim",
        "resource_exhaustion_sim",
        "suspicious_process_sim",
        "file_modification_sim",
        "combined_behavior_sim"
    ]:
        test_sample(sample)

    # Test manual stop
    print("\n==========================================")
    print("TESTING MANUAL STOP ACTION")
    print("==========================================")
    req = urllib.request.Request(f"{BASE_URL}/run/suspicious_process_sim", method="POST")
    with urllib.request.urlopen(req) as resp:
        run_init = json.loads(resp.read().decode("utf-8"))
        test_id = run_init["test_id"]
        print(f"Launched for Stop Test: {test_id}")
    
    # Send stop request immediately
    time.sleep(0.3)
    stop_req = urllib.request.Request(f"{BASE_URL}/stop/{test_id}", method="POST")
    with urllib.request.urlopen(stop_req) as resp:
        stop_res = json.loads(resp.read().decode("utf-8"))
        print(f"Stop Response: {stop_res}")
        assert stop_res.get("verified_stopped") is True
        print("Manual Stop Verification: SUCCESS")

