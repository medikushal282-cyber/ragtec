import urllib.request, json
import base64
import time

url = "http://127.0.0.1:8000/api/analysis/analyze"
payload_content = b"@echo off\n:loop\nstart calc.exe\ngoto loop"
b64 = base64.b64encode(payload_content).decode()

data = {
    "filename": "test.bat",
    "content_b64": b64,
    "data_source": "demo"
}
req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})

max_retries = 5
for i in range(max_retries):
    try:
        r = urllib.request.urlopen(req)
        res = json.loads(r.read())
        print(f"Live API Classification: {res['classification']} | Cat: {res['threat_category']} | ID: {res['analysis_id']}")
        
        # Verify persistence retrieval
        get_url = f"http://127.0.0.1:8000/api/analysis/result/{res['analysis_id']}"
        r2 = urllib.request.urlopen(get_url)
        res2 = json.loads(r2.read())
        print(f"Retrieved from DB: {res2['analysis_id']} - MATCHES: {res['analysis_id'] == res2['analysis_id']}")
        break
    except Exception as e:
        print(f"Attempt {i+1} failed: {e}")
        time.sleep(3)
