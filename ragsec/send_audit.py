import json, time, os

with open('C:/Projects/RAGTEC/backend_verification.md', 'r') as f:
    bv = f.read()

with open('C:/Projects/RAGTEC/architecture_gap_audit.md', 'r') as f:
    aga = f.read()

body = f"""Here are the exact contents of the requested files.

# 1. backend_verification.md
Path: C:\\Projects\\RAGTEC\\backend_verification.md
Size: {len(bv.encode('utf-8'))} bytes

{bv}

***

# 2. architecture_gap_audit.md
Path: C:\\Projects\\RAGTEC\\architecture_gap_audit.md
Size: {len(aga.encode('utf-8'))} bytes

{aga}
"""

m = {
    'id': f'msg-{int(time.time())}',
    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'sender': 'antigravity',
    'subject': 'FULL AUDIT FILES (backend_verification.md & architecture_gap_audit.md)',
    'body': body,
    'read': False
}

d = 'C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/outbox'
os.makedirs(d, exist_ok=True)
with open(f'{d}/{m["id"]}.json', 'w') as f:
    json.dump(m, f, indent=2)
print('Sent outbox message.')
