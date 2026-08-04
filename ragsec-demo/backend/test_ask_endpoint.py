import requests
import json

resp = requests.post('http://localhost:8000/api/ask/', json={'query': 'What are the steps to contain a ransomware attack?', 'model': 'llama3.2'}, timeout=30)
data = resp.json()

print('Status:', data.get('status'))
print('Provider:', data.get('provider'))
print('Flagged:', data.get('flagged'))

cits = data.get('citations', [])
print(f'Citations: {len(cits)}')
for c in cits[:3]:
    print(f"  [{c['label']}] {c['source_type']} sim={c['similarity']}")

verif = data.get('verification', {})
print('Verification:', verif)

if data.get('status') == 'abstained':
    print('Abstention reason:', data.get('abstention_reason'))
else:
    answer = data.get('answer','')
    print('Answer (first 300 chars):', answer[:300])
