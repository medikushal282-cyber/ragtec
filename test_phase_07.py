import requests
import json

BASE_URL = "http://localhost:8000/api"

print("--- PHASE 7 VERIFICATION ---")

query = "What vulnerability was exploited on WS-CORP-DESKTOP1?"
print(f"\nQuerying: '{query}'")

payload = {
    "query": query
}
r = requests.post(f"{BASE_URL}/query", json=payload)

if r.status_code == 200:
    data = r.json()
    print("\n--- GENERATED ANSWER ---")
    print(data.get("answer", ""))
    print("\n--- CITATIONS (EVIDENCE) ---")
    evidence = data.get("evidence", [])
    for idx, e in enumerate(evidence):
        print(f"[{e.get('citation_tag', 'C'+str(idx+1))}] {e.get('source_name', 'Unknown')}: {e.get('masked_text', '')[:100]}...")
else:
    print(f"Query Error {r.status_code}: {r.text}")
