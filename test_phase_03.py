import requests
import json
import os

BASE_URL = "http://localhost:8000/api"

print("--- PHASE 3 VERIFICATION ---")

# 1. Ingest Data (Test idempotency)
def ingest_file(filepath):
    print(f"Ingesting {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    payload = {
        "title": os.path.basename(filepath),
        "content": content,
        "source_name": os.path.basename(filepath),
        "source_type": "cti_report" if "narrative" in filepath else "rule" if "rule" in filepath else "ioc_list" if "csv" in filepath else "threat_feed"
    }
    
    r = requests.post(f"{BASE_URL}/ingest", json=payload)
    if r.status_code == 200:
        res = r.json()
        print(f"  -> Success: {res['chunks_extracted']} chunks extracted.")
    else:
        print(f"  -> Error {r.status_code}: {r.text}")

test_files = [
    "C:/Projects/RAGTEC/test_data/test_cti_narrative.txt",
    "C:/Projects/RAGTEC/test_data/test_rule.yml",
    "C:/Projects/RAGTEC/test_data/test_iocs.csv",
    "C:/Projects/RAGTEC/test_data/test_threats.json"
]

for f in test_files:
    ingest_file(f)

# Wait a second for async processing (though Chroma upsert is sync here)
import time
time.sleep(1)

# 2. Retrieve Data
query = "What vulnerability was exploited on WS-CORP-DESKTOP1?"
print(f"\nQuerying: '{query}'")

payload = {
    "query": query,
    "top_k": 10,
    "top_n": 5
}
r = requests.post(f"{BASE_URL}/retrieve", json=payload)

if r.status_code == 200:
    data = r.json()
    evidence = data.get("evidence", [])
    
    print("\nRETRIEVED EVIDENCE (Cross-Encoder Rank vs Dense Score):")
    for idx, e in enumerate(evidence):
        print(f"{idx+1}. [Ranked: {e['rerank_score']:.2f} | Dense: {e['dense_score']:.2f}] (Source: {e['source']})")
        print(f"   Entities: {', '.join(e.get('entities', []))}")
        # text snippet
        snip = e['chunk_text'].replace('\n', ' ')[:80]
        print(f"   Excerpt: {snip}...")
        print()
else:
    print(f"Query Error {r.status_code}: {r.text}")

# Verify total chunks (Idempotency)
r = requests.get(f"{BASE_URL}/health")
if r.status_code == 200:
    print(f"\nIdempotency Check: Total Indexed Chunks = {r.json()['indexed_chunks_count']}")
