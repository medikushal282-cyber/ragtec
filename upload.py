import requests
import json

base_url = 'http://localhost:8000/api/ingest'

files = [
    ('test_cti_narrative.txt', 'test_data/test_cti_narrative.txt'),
    ('test_rule.yml', 'test_data/test_rule.yml'),
    ('test_iocs.csv', 'test_data/test_iocs.csv'),
    ('test_threats.json', 'test_data/test_threats.json')
]

for name, path in files:
    with open(path, 'r') as f:
        content = f.read()
    payload = {
        "title": name,
        "content": content,
        "source_name": name,
        "source_type": "csv" if name.endswith('.csv') else ("json" if name.endswith(".json") else "rule" if name.endswith(".yml") else "cti_report")
    }
    r = requests.post(base_url, json=payload)
    print(f"{name}: {r.status_code} {r.text}")
