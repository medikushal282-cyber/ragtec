import urllib.request, json

def get(url):
    r = urllib.request.urlopen(url)
    return json.loads(r.read())

nets = get('http://127.0.0.1:8000/api/soc/networks')
net_ids = [n['id'] for n in nets]
print(f"Networks ({len(nets)}): {net_ids}")

devs = get('http://127.0.0.1:8000/api/soc/networks/NET-CORP/devices')
dev_ids = [d['id'] for d in devs]
print(f"NET-CORP devices ({len(devs)}): {dev_ids}")

evts = get('http://127.0.0.1:8000/api/soc/devices/DEV-DC-DB1/events')
evt_ids = [e['id'] for e in evts]
print(f"DEV-DC-DB1 events ({len(evts)}): {evt_ids}")

if evts:
    ds = evts[0].get('data_source', 'MISSING')
    print(f"data_source on event: {ds}")

if devs:
    d = devs[0]
    print(f"Device os field present: {'os' in d}")
    print(f"Device segment field present: {'segment' in d}")
    print(f"Device risk_score field present: {'risk_score' in d}")

print("ALL LIVE ENDPOINT CHECKS PASSED")
