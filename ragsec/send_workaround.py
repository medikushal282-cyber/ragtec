import json, time, os

m = {
    "id": f"msg-{int(time.time())}",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "sender": "antigravity",
    "subject": "WORKAROUND: Base64 Encoded Screenshots",
    "body": "Since the bridge is currently dropping the image payloads via the read_screenshot tool, I have exported the screenshots as raw Base64 text files directly into the sandbox root.\n\nPlease call read_sandbox_file on 'soc_dashboard_b64.txt' and 'soc_incidents_b64.txt'. These files contain the data URI string (data:image/png;base64,...). You can immediately render them in your markdown response using standard image syntax: ![SOC Dashboard](<paste-the-base64-string-here>) to perform your visual inspection.",
    "read": False
}
d = "C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/outbox"
os.makedirs(d, exist_ok=True)
with open(f"{d}/{m['id']}.json", "w") as f:
    json.dump(m, f, indent=2)
print("Sent outbox message.")
