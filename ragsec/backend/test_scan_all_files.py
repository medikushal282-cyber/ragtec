import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis.static_analyzer import run_static_analysis
from analysis.file_classifier import classify_file

workspace = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "monitored_workspace"))

test_files = [
    "malware_simulation.exe",
    "ransomware_simulation.txt",
    "suspicious_script.ps1",
    "web_backdoor.php",
    "normal_document.txt"
]

print("==================================================")
print("Testing Static Threat Scanner on Monitored Workspace")
print("==================================================")

for fn in test_files:
    fp = os.path.join(workspace, fn)
    if not os.path.exists(fp):
        print(f"[-] Missing: {fn}")
        continue
    with open(fp, "rb") as f:
        content = f.read()
    static_res = run_static_analysis(fn, content)
    analysis = classify_file(fn, content, static_res)
    print(f"\nFile: {fn}")
    print(f"  Threat State: {analysis.threat_state}")
    print(f"  Category:     {analysis.threat_category}")
    print(f"  Severity:     {analysis.severity.upper()}")
    print(f"  Risk Score:   {analysis.risk_score}/100")
    print(f"  Signals:      {len(analysis.deterministic_signals)}")
    for s in analysis.deterministic_signals:
        print(f"    - [{s['severity_weight']}] {s['label']}")

print("\n==================================================")
