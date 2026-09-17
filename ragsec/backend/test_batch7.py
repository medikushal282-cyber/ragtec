import os
import sys
import time
import subprocess
import urllib.request
import json

sys.path.insert(0, os.path.dirname(__file__))

# Clean slate
chroma_dir = os.path.join(os.getcwd(), "chroma_data")
if os.path.exists(chroma_dir):
    import shutil
    try:
        shutil.rmtree(chroma_dir)
    except Exception:
        pass

db_path = os.path.join(os.getcwd(), "ragsec.db")
if os.path.exists(db_path):
    try:
        os.remove(db_path)
    except Exception:
        pass

def start_backend(env_vars=None):
    env = os.environ.copy()
    if env_vars:
        env.update(env_vars)
    proc = subprocess.Popen(["C:\\Python313\\python.exe", "app.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    time.sleep(20)  # Wait for ML models
    return proc

def stop_backend(proc):
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()

def api_post(endpoint, payload):
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/api{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    return json.loads(urllib.request.urlopen(req).read())

print("=== BATCH 7 TESTS ===")
print("Starting backend with MOCK_LLM...")
# Start backend with mock LLM that cites [C1]
proc = start_backend({"MOCK_LLM": "1", "MOCK_LLM_RESPONSE": "The malware XYZ targets Windows endpoints via port 4444 [C1]."})
try:
    print("Ingesting Evidence...")
    doc = {
        "source_name": "intel.txt",
        "mime_type": "text/plain",
        "content": "The malware XYZ targets Windows endpoints via port 4444.",
        "sensitivity_tier": "internal"
    }
    api_post("/ingest", doc)
    time.sleep(2)

    print("\n1. Strong evidence -> grounded answer")
    res1 = api_post("/query", {"query": "How does malware XYZ communicate?", "severity": "low"})
    assert res1["status"] == "ANSWERED"
    assert "The malware XYZ" in res1["answer"]
    assert "[C1]" in res1["answer"]
    
    print("\n2. Answer contains valid citations")
    assert res1["governance"]["citation_check"] == "VERIFIED"
    assert "[C1]" in res1["governance"]["verified_citations"]

    print("\n3. Every citation maps to actual evidence")
    print("DEBUG Citations:", res1.get("citations", []))
    assert len(res1["citations"]) >= 1
    assert res1["citations"][0]["tag"] == "[C1]"
    assert res1["citations"][0]["source_name"] in ["intel.txt", "strong.txt"]

    print("\n4. Fake citation -> validation failure")
    # Restart with a mock LLM that cites a fake chunk [C99]
    stop_backend(proc)
    proc = start_backend({"MOCK_LLM": "1", "MOCK_LLM_RESPONSE": "The malware uses port 4444 [C99]."})
    res4 = api_post("/query", {"query": "How does malware XYZ communicate?", "severity": "low"})
    assert "[C99]" in res4["governance"]["unsupported_citations"]
    assert res4["governance"]["citation_check"] == "PARTIAL" or res4["governance"]["citation_check"] == "UNSUPPORTED"
    print("  -> Detected unsupported citation [C99]")

    print("\n5. Unsupported claim -> detected")
    # Entity validation detects claims not in corpus (e.g., if LLM invents IP 8.8.8.8)
    stop_backend(proc)
    proc = start_backend({"MOCK_LLM": "1", "MOCK_LLM_RESPONSE": "The malware communicates with 8.8.8.8 [C1]."})
    res5 = api_post("/query", {"query": "How does malware XYZ communicate?", "severity": "low"})
    unsupported_ips = [e["value"] for e in res5["governance"]["unsupported_entities"] if e["type"] == "IP"]
    assert "8.8.8.8" in unsupported_ips
    print("  -> Detected unsupported entity 8.8.8.8")

    print("\n6. Insufficient evidence -> LLM remains blocked by Batch 6")
    res6 = api_post("/query", {"query": "What is APT29?", "severity": "low"})
    assert res6["status"] == "ABSTAINED"
    assert res6["governance"]["gating"] == "BLOCKED"
    print("  -> Gate blocked LLM execution")

    print("\n7. LLM unavailable -> no fabricated answer")
    stop_backend(proc)
    # Start without mock, Ollama not available => ERROR
    proc = start_backend({"MOCK_LLM": ""})
    res7 = api_post("/query", {"query": "How does malware XYZ communicate?", "severity": "low"})
    assert res7["status"] == "ERROR"
    assert "LLM unavailable" in res7["answer"]
    assert res7["governance"]["citation_check"] == "ERROR"
    print("  -> Encountered explicit ERROR state")

    print("\n=== ALL BATCH 7 CHECKS PASSED ===")
finally:
    stop_backend(proc)
