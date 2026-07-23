import time
import requests
import random
from datetime import datetime

API_URL = "http://localhost:8000/api/ingest/alert"

THREAT_TYPES = [
    "RAG Injection", 
    "Prompt Leakage", 
    "Vector Poisoning", 
    "Embedding Theft", 
    "Context Overflow",
    "Model Inversion",
    "Data Exfiltration"
]

ORIGINS = [
    "api.endpoint/v2", 
    "chat.service/ws", 
    "embed.pipeline", 
    "llm.proxy/gpt4", 
    "internal.db/auth", 
    "search.index",
    "user.portal/query"
]

SEVERITIES = ["critical", "high", "medium", "low"]

def generate_payload():
    threat_type = random.choice(THREAT_TYPES)
    
    # Weight severity based on threat type
    if threat_type in ["RAG Injection", "Vector Poisoning", "Model Inversion"]:
        severity = random.choices(["critical", "high"], weights=[0.7, 0.3], k=1)[0]
    else:
        severity = random.choices(SEVERITIES, weights=[0.1, 0.3, 0.4, 0.2], k=1)[0]

    return {
        "type": threat_type,
        "origin": random.choice(ORIGINS),
        "severity": severity,
        "ts": datetime.now().strftime("%H:%M:%S")
    }

def run_simulation():
    print("Starting simulated AI attacks...")
    print(f"Targeting: {API_URL}")
    print("Press Ctrl+C to stop.\n")
    
    try:
        while True:
            # Wait a random interval between 1.5 and 5 seconds
            sleep_time = random.uniform(1.5, 5.0)
            time.sleep(sleep_time)
            
            payload = generate_payload()
            try:
                response = requests.post(API_URL, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    print(f"[{data['ts']}] [INGESTED] {data['id']} | {data['severity'].upper()} | {data['type']}")
                else:
                    print(f"Failed to ingest: {response.status_code} - {response.text}")
            except requests.exceptions.ConnectionError:
                print("Backend server is offline. Waiting to retry...")
                time.sleep(2)
                
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    run_simulation()
