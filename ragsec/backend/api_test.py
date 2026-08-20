import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def print_res(response):
    print(f"Status: {response.status_code}")
    if response.text:
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)

print("\n--- HEALTH ---")
print_res(requests.get(f"{BASE_URL}/health"))

threat_types = [
    ("Phishing", "User clicked suspicious link in email from admin@paypal-update.com", "net-01"),
    ("Malware", "Malware detected: cobalt strike executable drops on disk", "net-01"),
    ("Ransomware", "Multiple shadow copies deleted via vssadmin and encryption of files started", "net-01"),
    ("Spyware", "Unauthorized audio and screen capture software installed", "net-02"),
    ("Trojan", "Process svchost.exe spawned cmd.exe masquerading as legitimate process", "net-02"),
    ("Brute_Force", "High volume of failed login attempts followed by logon bursts", "net-02"),
    ("DoS_DDoS", "Massive SYN flood and HTTP request flood detected", "net-03"),
    ("Data_Exfiltration", "High volume egress: 50 GB of data transferred out via DNS tunneling", "net-03"),
    ("C2", "Beaconing behavior detected: periodic DNS queries to unknown DGA", "net-03"),
    ("Insider_Threat", "User accessed all sensitive finance folders at 3:00 am", "net-01")
]

incidents_created = []

for idx, (t_name, t_msg, net_id) in enumerate(threat_types):
    print(f"\n--- SUBMIT EVENT ({t_name}) ---")
    payload = {
        "id": f"evt-10{idx}",
        "timestamp": "2026-08-19T10:00:00Z",
        "network_id": net_id,
        "device_id": f"dev-{net_id}-1",
        "source_type": "edr",
        "event_type": "anomaly",
        "raw_message": t_msg,
        "is_suspicious": True
    }
    res = requests.post(f"{BASE_URL}/soc/events", json=payload)
    print_res(res)
    if res.status_code == 200 and res.json():
        incidents_created.append(res.json()['id'])

print("\n--- MULTI-NETWORK PROOF ---")
res = requests.get(f"{BASE_URL}/soc/incidents")
if res.status_code == 200:
    incs = res.json()
    for inc in incs:
        print(f"Incident: {inc['id']}, Network: {inc['network_id']}, Threat: {inc['threat_classification']['category']}")

if incidents_created:
    print("\n--- MITIGATION LIFECYCLE ---")
    inc_id = incidents_created[0]
    print(f"Requesting mitigation for {inc_id}...")
    req = {
        "action_type": "Isolate Endpoint",
        "description": "Isolate to prevent lateral movement",
        "target_device_id": "dev-net-01-1"
    }
    res = requests.post(f"{BASE_URL}/soc/incidents/{inc_id}/mitigate", json=req)
    print_res(res)
    if res.status_code == 200:
        action_id = res.json()['id']
        print(f"Approving {action_id}...")
        print_res(requests.post(f"{BASE_URL}/soc/mitigations/{action_id}/approve?analyst_id=SOC-1"))
        print(f"Executing {action_id}...")
        print_res(requests.post(f"{BASE_URL}/soc/mitigations/{action_id}/execute"))
        print(f"Verifying {action_id}...")
        print_res(requests.post(f"{BASE_URL}/soc/mitigations/{action_id}/verify?success=true&notes=Host+isolated"))

print("\n--- AUDIT TRAIL ---")
print_res(requests.get(f"{BASE_URL}/soc/audit"))
