import urllib.request, json
r = urllib.request.urlopen('http://127.0.0.1:8000/api/soc/incidents')
incidents = json.loads(r.read())
print(f"Total incidents: {len(incidents)}")
for i in incidents:
    inc_id = i["id"]
    net = i["network_id"]
    devs = i["affected_device_ids"]
    evts = len(i["events"])
    cat = i["threat_classification"]["category"]
    sev = i["threat_classification"]["severity"]
    print(f"  {inc_id} | net={net} | devices={devs} | events={evts} | cat={cat} | sev={sev}")
