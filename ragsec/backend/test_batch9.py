import os
import json
import urllib.request
import urllib.error
import subprocess
import time
import shutil

db_path = os.path.join(os.getcwd(), "ragsec.db")
if os.path.exists(db_path):
    try:
        os.remove(db_path)
    except Exception:
        pass

def start_backend():
    env = os.environ.copy()
    proc = subprocess.Popen(["C:\\Python313\\python.exe", "app.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    time.sleep(45)  # Wait for ML models
    return proc

def stop_backend(proc):
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()

def api_get(endpoint):
    req = urllib.request.Request(f"http://127.0.0.1:8000/api{endpoint}")
    return json.loads(urllib.request.urlopen(req).read())

def api_post(endpoint, payload):
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/api{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    return json.loads(urllib.request.urlopen(req).read())

if __name__ == "__main__":
    proc = start_backend()
    try:
        print("=== BATCH 9 TESTS ===")
        print("Triggering some events to create audits...")
        api_post("/query", {"query": "test query", "severity": "high", "allowed_tiers": ["public"]})
        
        # Let's get incidents and mitigations to do some actions
        # Actually just manually add an event to fim
        
        print("\n1. Audit event creation")
        print("\n2. Hash chaining")
        print("\n3. Previous-hash linkage")
        audits = api_get("/soc/audit")
        assert len(audits) > 0
        for i in range(1, len(audits)):
            assert audits[i]["previous_hash"] == audits[i-1]["current_hash"]
            assert audits[i]["current_hash"] is not None

        print("\n4. Chain verification -> VALID")
        res = api_get("/soc/audit/verify")
        assert res["status"] == "VALID"

        print("\n5. Modify one historical payload -> INVALID")
        # Direct DB manipulation
        import sqlite3
        conn = sqlite3.connect("ragsec.db")
        c = conn.cursor()
        c.execute("SELECT id, data FROM audit_logs LIMIT 1")
        row = c.fetchone()
        data = json.loads(row[1])
        data["actor"] = "HACKER"
        c.execute("UPDATE audit_logs SET data = ? WHERE id = ?", (json.dumps(data), row[0]))
        conn.commit()
        
        res = api_get("/soc/audit/verify")
        assert "INVALID" in res["status"]
        
        # Restore
        data["actor"] = "SYSTEM" # or whatever it was, actually I'll just delete the DB anyway
        
        print("\n=== ALL BATCH 9 CHECKS PASSED ===")
    except Exception as e:
        import traceback
        traceback.print_exc()
        exit(1)
    finally:
        stop_backend(proc)
