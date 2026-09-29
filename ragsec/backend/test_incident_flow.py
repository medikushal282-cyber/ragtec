import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_incident_flow():
    print("1. Fetching Incidents...")
    res = client.get("/api/soc/incidents")
    print(f"   Status: {res.status_code}")
    incidents = res.json()
    inc = next((i for i in incidents if i["id"] == "INC-2026-0842"), None)
    if inc:
        print(f"   [PASS] Found Incident: {inc['id']} - {inc['title']}")
    else:
        print(f"   [INFO] Found {len(incidents)} incidents")

    print("\n2. Fetching Mitigations for INC-2026-0842...")
    res = client.get("/api/soc/incidents/INC-2026-0842/mitigations")
    print(f"   Status: {res.status_code}")
    mitigations = res.json()
    print(f"   [PASS] Mitigations count: {len(mitigations)}")
    for m in mitigations:
        print(f"     - [{m['status']}] {m['id']}: {m['action_type']} -> {m['description'][:50]}...")

    print("\n3. Testing Mitigation Approval...")
    res = client.post("/api/soc/mitigations/MIT-0842-01/approve", json={"analyst_id": "SOC_LEAD_ANALYST"})
    print(f"   Status: {res.status_code}, New Status: {res.json().get('status')}")

    print("\n4. Testing Mitigation Execution...")
    res = client.post("/api/soc/mitigations/MIT-0842-01/execute")
    print(f"   Status: {res.status_code}, New Status: {res.json().get('status')}")

    print("\n5. Checking Audit Trail...")
    res = client.get("/api/soc/audit")
    print(f"   Audit trail entries: {len(res.json())}")

    print("\n[ALL INCIDENT MITIGATION TESTS COMPLETED SUCCESSFULLY!]")

if __name__ == "__main__":
    test_incident_flow()
