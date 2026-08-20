import time, os, uuid

with open('C:/Projects/RAGTEC/phase_02_report.md', 'r') as f:
    report = f.read()

with open('C:/Projects/RAGTEC/architecture_gap_audit.md', 'r') as f:
    audit = f.read()

body = f"""PHASE 2: COMPLETED

Here is the completion report for Phase 2, along with the updated architecture gap audit.

# 1. phase_02_report.md
Path: C:\\Projects\\RAGTEC\\phase_02_report.md
Size: {len(report.encode('utf-8'))} bytes

{report}

***

# 2. architecture_gap_audit.md (Updated)
Path: C:\\Projects\\RAGTEC\\architecture_gap_audit.md
Size: {len(audit.encode('utf-8'))} bytes

{audit}
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
