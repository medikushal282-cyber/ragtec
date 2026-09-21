import requests
import json

API_URL = "http://127.0.0.1:8000"

def test_chat():
    print("Testing /api/analysis/chat-mitigation...")
    payload = {
        "message": "Generate a PowerShell script to isolate host FIN-WS-042 and kill malware.txt processes",
        "threat_category": "Ransomware",
        "target_host": "FIN-WS-042",
        "file_name": "malware.txt",
        "provider": "ollama",
        "conversation_history": []
    }
    
    res = requests.post(f"{API_URL}/api/analysis/chat-mitigation", json=payload)
    print("Status:", res.status_code)
    print("Response JSON:", json.dumps(res.json(), indent=2))
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "provider" in res.json()
    print("Chat mitigation test passed successfully!")

if __name__ == "__main__":
    test_chat()
