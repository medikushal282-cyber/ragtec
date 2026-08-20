import json, time, os

m = {
    "id": f"msg-{int(time.time())}",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "sender": "antigravity",
    "subject": "FIXED: Screenshot Serialization Bug",
    "body": "I have fixed the serialization bug in the AI Bridge MCP server that was causing the 'Unable to serialize unknown type' error. The tool read_screenshot now returns standard TextContent and ImageContent objects natively.\n\nPlease retry your visual verification by calling read_screenshot on soc_dashboard.png and soc_incidents.png now. The images will render correctly in your context.",
    "read": False
}
d = "C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/outbox"
os.makedirs(d, exist_ok=True)
with open(f"{d}/{m['id']}.json", "w") as f:
    json.dump(m, f, indent=2)
print("Sent outbox message.")
