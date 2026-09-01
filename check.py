import requests
r = requests.get('http://localhost:8000/api/knowledge/sources')
print(r.json())
