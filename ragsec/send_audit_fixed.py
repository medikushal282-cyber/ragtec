import time, os, uuid

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

timestamp = time.strftime('%Y%m%dT%H%M%SZ', time.gmtime())
msg_uuid = str(uuid.uuid4())
msg_id = f"a-{timestamp}-{msg_uuid}"

content = f"""---
message_id: {msg_id}
sender: antigravity
timestamp: {time.strftime('%Y-%m-%dT%H:%M:%S+00:00', time.gmtime())}
type: task
---

{body}
"""

d = 'C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/antigravity/outbox/messages'
os.makedirs(d, exist_ok=True)
with open(f'{d}/{msg_id}.md', 'w') as f:
    f.write(content)

print(f"Sent outbox message: {msg_id}.md")
