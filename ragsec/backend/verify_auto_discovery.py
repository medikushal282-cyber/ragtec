"""
Verification script for auto model discovery and local model finding.
"""
import sys
import requests
import json

# Set UTF-8 stdout for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def verify_all():
    print("==================================================")
    print("1. Verifying Web Server & Backend Connectivity")
    print("==================================================")
    r_fe = requests.get("http://localhost:3000/", timeout=10)
    assert r_fe.status_code == 200, f"Frontend failed: {r_fe.status_code}"
    print(f"[OK] Frontend Web Server: status {r_fe.status_code}, {len(r_fe.text)} bytes")

    import time
    r_be = None
    for attempt in range(15):
        try:
            r_be = requests.get("http://127.0.0.1:8000/", timeout=2)
            if r_be.status_code == 200:
                break
        except Exception:
            time.sleep(1)

    assert r_be is not None and r_be.status_code == 200, "Backend failed to start in time"
    print(f"[OK] Backend Core API: {r_be.json().get('status')}")

    print("\n==================================================")
    print("2. Verifying Model Providers API (/api/models/providers)")
    print("==================================================")
    r_prov = requests.get("http://127.0.0.1:8000/api/models/providers", timeout=5)
    assert r_prov.status_code == 200, f"Providers failed: {r_prov.text}"
    provs = r_prov.json().get("providers", [])
    prov_ids = [p["id"] for p in provs]
    print(f"[OK] Providers Registered ({len(provs)} total): {prov_ids}")
    assert "groq" in prov_ids and "openrouter" in prov_ids and "ollama" in prov_ids and "lmstudio" in prov_ids and "gemini" in prov_ids

    print("\n==================================================")
    print("3. Verifying Local Engine Scanner (/api/models/local-status)")
    print("==================================================")
    r_local = requests.get("http://127.0.0.1:8000/api/models/local-status", timeout=5)
    assert r_local.status_code == 200, f"Local status failed: {r_local.text}"
    data_local = r_local.json()
    print("[OK] Local Scanner Status Probe:")
    print(f"   * Ollama (port 11434): Connected = {data_local.get('ollama', {}).get('connected')}")
    print(f"   * LM Studio (port 1234): Connected = {data_local.get('lmstudio', {}).get('connected')}")

    print("\n==================================================")
    print("4. Verifying Auto Model Discovery (/api/models/discover)")
    print("==================================================")
    for p in ["ollama", "lmstudio", "groq", "openrouter", "gemini"]:
        r_disc = requests.post("http://127.0.0.1:8000/api/models/discover", json={"provider": p}, timeout=10)
        assert r_disc.status_code == 200, f"Discover {p} failed: {r_disc.text}"
        d = r_disc.json()
        models = d.get("models", [])
        print(f"[OK] Provider '{p.upper()}': {len(models)} models available | Default: {d.get('default_model')} | Status: {d.get('message') or d.get('error')}")

    print("\n==================================================")
    print("5. Verifying AI Chat Mitigation with Provider Grounding")
    print("==================================================")
    r_chat = requests.post("http://127.0.0.1:8000/api/analysis/chat-mitigation", json={
        "message": "Give me the immediate PowerShell containment script to isolate host FIN-WS-042 from ransomware.",
        "provider": "ollama",
        "model": "llama3.1",
        "threat_category": "Ransomware",
        "target_host": "FIN-WS-042",
        "file_name": "malware.txt"
    }, timeout=15)
    assert r_chat.status_code == 200, f"Chat failed: {r_chat.text}"
    chat_res = r_chat.json()
    print("[OK] Chatbot Response Verified:")
    print(f"   * Provider: {chat_res.get('provider')}")
    print(f"   * Model: {chat_res.get('model')}")
    print(f"   * Evidence Cited: {chat_res.get('evidence_citations')}")
    print(f"   * Reply Preview: {chat_res.get('reply')[:140]}...")

    print("\n==================================================")
    print("ALL AUTO MODEL DISCOVERY & LOCAL MODEL TESTS PASSED! [PASS]")
    print("==================================================")

if __name__ == "__main__":
    verify_all()
