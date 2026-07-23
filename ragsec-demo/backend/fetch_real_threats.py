import time
import requests
import random
from datetime import datetime

API_URL = "http://localhost:8000/api/ingest/alert"
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

def fetch_cisa_catalog():
    print(f"Fetching CISA KEV Catalog from {CISA_KEV_URL}...")
    try:
        response = requests.get(CISA_KEV_URL)
        response.raise_for_status()
        data = response.json()
        print(f"Successfully loaded {data.get('count', 0)} vulnerabilities from CISA.")
        return data.get('vulnerabilities', [])
    except Exception as e:
        print(f"Failed to fetch CISA data: {e}")
        return []

def run_simulation():
    vulnerabilities = fetch_cisa_catalog()
    if not vulnerabilities:
        return
        
    print("\nStarting Real-World CISA Threat Ingestion...")
    print(f"Targeting: {API_URL}")
    print("Press Ctrl+C to stop.\n")
    
    try:
        while True:
            # Wait a random interval between 2 and 6 seconds
            sleep_time = random.uniform(2.0, 6.0)
            time.sleep(sleep_time)
            
            # Pick a random vulnerability to simulate "discovering" it
            vuln = random.choice(vulnerabilities)
            
            # All CISA KEVs are Critical/High by definition of being actively exploited
            severity = random.choices(["Critical", "High"], weights=[0.8, 0.2], k=1)[0]
            
            payload = {
                "id": vuln.get("cveID"),
                "name": vuln.get("vulnerabilityName", "Unknown Vulnerability"),
                "type": vuln.get("product", "Unknown Type"),
                "origin": vuln.get("vendorProject", "CISA KEV"),
                "severity": severity,
                "solution": vuln.get("requiredAction", "No solution provided."),
                "exceptions": vuln.get("notes", ""),
                "ts": vuln.get("dateAdded", datetime.now().strftime("%Y-%m-%d"))
            }
            
            try:
                response = requests.post(API_URL, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    print(f"[{data['ts']}] [INGESTED] {data['id']} | {data['severity'].upper()} | {data['name']}")
                else:
                    print(f"Failed to ingest: {response.status_code} - {response.text}")
            except requests.exceptions.ConnectionError:
                print("Backend server is offline. Waiting to retry...")
                time.sleep(2)
                
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    run_simulation()
