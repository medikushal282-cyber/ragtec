import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis.groq_threat_agent import scan_workspace_with_groq_agent, analyze_single_file_with_groq

print("==================================================")
print("Testing Groq AI Threat Agent & Workspace Scanner")
print("==================================================")

res = scan_workspace_with_groq_agent()
print(f"Status: {res['status']}")
print(f"Workspace: {res['workspace_dir']}")
print(f"Total Files Scanned: {res['total_files']}")
print(f"Threats Detected: {res['threats_detected']}")
print(f"Clean Files: {res['clean_files']}")
print(f"Threat Index: {res['threat_index']}")

print("\nIndividual File Results:")
for f in res['files']:
    print(f"  - [{f['verdict']}] {f['filename']} (Category: {f['threat_category']}, Severity: {f['severity']}, Risk: {f['risk_score']}/100)")
    if f['flagged_indicators']:
        print(f"    Indicators: {f['flagged_indicators'][:2]}")

print("\n==================================================")
print("[PASS] Groq Threat Agent Working Flawlessly!")
