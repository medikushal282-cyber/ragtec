import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000"

endpoints = [
    ("GET", "/", None),
    ("GET", "/openapi.json", None),
    ("GET", "/api/threats", None),
    ("GET", "/api/system/telemetry", None),
    ("GET", "/api/analytics/historical", None),
    ("GET", "/api/analytics/trending", None),
    ("GET", "/api/analytics/vendors", None),
    ("GET", "/api/actions/playbooks", None),
    ("GET", "/api/v1/patch/queue", None),
    ("GET", "/api/v1/kb/documents", None),
    ("GET", "/api/v1/kb/status", None),
    ("GET", "/api/v1/pipeline/topology", None),
    ("GET", "/api/system/status", None),
    ("GET", "/api/notifications", None),
    ("GET", "/api/v1/settings/profile", None),
    ("GET", "/api/scanner/scan-directory", None),
    ("POST", "/api/retrieve/", {"query": "ransomware", "useRagsec": True}),
    ("POST", "/api/chat", {"message": "Assess zero day threats", "model": "llama3.2"}),
]

print("==================================================")
print("RUNNING COMPLETE RAGSEC+ API FUNCTIONALITY AUDIT")
print("==================================================")

passed = 0
failed = 0

for method, path, body in endpoints:
    url = f"{BASE_URL}{path}"
    try:
        data = json.dumps(body).encode('utf-8') if body else None
        headers = {'Content-Type': 'application/json'} if body else {}
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body) if res_body.startswith('{') or res_body.startswith('[') else "Raw Output"
            
            print(f"[PASS] {method} {path} -> HTTP {status}")
            passed += 1
    except Exception as e:
        print(f"[FAIL] {method} {path} -> Error: {e}")
        failed += 1

print("==================================================")
print(f"AUDIT SUMMARY: {passed} PASSED | {failed} FAILED")
print("==================================================")
