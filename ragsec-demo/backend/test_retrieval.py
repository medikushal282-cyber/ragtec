import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_test(name: str, query: str):
    print(f"\n--- Test: {name} ---")
    print(f"Query: '{query}'")
    
    response = client.post("/api/retrieve/", json={
        "query": query,
        "allowed_tiers": ["public", "internal"],
        "theta_sim": 0.72,
        "theta_conf": 0.75
    })
    
    data = response.json()
    status = data.get("status")
    
    if status == "sufficient":
        metrics = data.get('metrics', {})
        print(f"STATUS: SUFFICIENT")
        print(f"  Avg Top-3 Sim: {metrics.get('avg_top3_similarity'):.3f}")
        print(f"  Distinct Sources: {metrics.get('distinct_sources')}")
        print(f"  Surviving Chunks: {metrics.get('surviving_count')}")
        for c in data.get("chunks", [])[:3]:
            print(f"    - [{c['metadata'].get('source_type')}] Sim: {c['similarity']:.3f} | {c['text'][:60].replace(chr(10), ' ')}")
    else:
        print(f"STATUS: INSUFFICIENT")
        print(f"  Reason: {data.get('reason')}")
        for c in data.get("nearest_chunks", [])[:3]:
            print(f"    - [Nearest] [{c['metadata'].get('source_type')}] Sim: {c['similarity']:.3f} | {c['text'][:60].replace(chr(10), ' ')}")

if __name__ == "__main__":
    # 1. Clear Success (In corpus, diverse)
    run_test("Clear Success", "how do I contain a ransomware outbreak")
    
    # 2. Clear Fail (Out of corpus, low confidence)
    run_test("Out of Corpus (Low Sim)", "how to configure AWS IAM policies for S3 buckets")
    
    # 3. Fail (Single Source Bias)
    # Target a highly specific string that only appears in one single CVE, 
    # to force it to fail the >= 2 distinct sources check.
    run_test("Single Source Bias", "CVE-2024-21626 runc process.cwd container breakout")
