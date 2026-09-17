"""
Batch 3 Verification Test
Run from: c:\Projects\RAGTEC\ragsec\backend
  C:\Python313\python.exe test_batch3.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Fresh DB for clean tests
if os.path.exists("ragsec.db"):
    os.remove("ragsec.db")

from db.database import init_db, list_file_analyses
init_db()

from analysis.static_analyzer import run_static_analysis
from analysis.file_classifier import classify_file
import json
import base64
import dataclasses

print("=== 1. Safe Static Extraction (BENIGN) ===")
benign_content = b"echo Hello World\nexit 0"
sr1 = run_static_analysis("test_script.bat", benign_content)
assert sr1.is_text
assert len(sr1.sha256) == 64
assert len(sr1.signals) == 0
print("  Benign script correctly produced no signals: OK")
c1 = classify_file("test_script.bat", benign_content, sr1, data_source="seeded")
assert c1.classification == "BENIGN"
print(f"  Classification: {c1.classification} ({c1.rationale}): OK")


print("\n=== 2. Static Behavioral Detection (THREAT) ===")
mal_content = b"""@echo off
:loop
start calc.exe
goto loop
"""
sr2 = run_static_analysis("mal.bat", mal_content)
assert sr2.is_text
assert len(sr2.signals) >= 1, f"Expected at least one signal, got {len(sr2.signals)}"
sig_labels = [s.label for s in sr2.signals]
print(f"  Signals found: {sig_labels}")
c2 = classify_file("mal.bat", mal_content, sr2, data_source="seeded")
assert c2.classification == "THREAT"
assert c2.threat_category != "N/A" and c2.threat_category != "Unknown"
print(f"  Classification: {c2.classification}, Cat: {c2.threat_category}, Sev: {c2.severity}: OK")


print("\n=== 3. Static Behavioral Detection (Ransomware-like) ===")
ran_content = b"""
import os
for root, dirs, files in os.walk('/'):
    for f in files:
        with open(os.path.join(root, f), 'wb') as out:
            out.write(b'encrypted')
        os.rename(os.path.join(root, f), os.path.join(root, f) + '.crypted')
"""
sr3 = run_static_analysis("encrypt.py", ran_content)
print(f"  Signals found: {[s.label for s in sr3.signals]}")
c3 = classify_file("encrypt.py", ran_content, sr3, data_source="seeded")
assert c3.classification == "THREAT"
assert c3.threat_category == "Ransomware", f"Expected Ransomware category, got {c3.threat_category}"
print(f"  Classification: {c3.classification}, Cat: {c3.threat_category}, Sev: {c3.severity}: OK")


print("\n=== 4. Line-level Evidence ===")
lines = {s['line_no']: s['line_content'] for s in c3.deterministic_signals}
print(f"  Extracted Evidence:")
for ln, lcontent in lines.items():
    print(f"    Line {ln}: {lcontent}")
assert len(lines) > 0, "No line-level evidence extracted"
print("  Line-level evidence mapped correctly: OK")


print("\n=== 5. AI Static Analysis ===")
# Even if the generator is mocked or offline, the system handles it safely
print(f"  AI Output for Ransomware script: {c3.ai_analysis[:150]}...")
assert c3.ai_analysis is not None, "AI analysis field should be populated (or have a fallback error)"


print("\n=== 6. UNKNOWN fallback ===")
unk_content = b"\x00\x01\x02\x03\x04\x05\x06\x07\x08" * 10
sr4 = run_static_analysis("binary.exe", unk_content)
c4 = classify_file("binary.exe", unk_content, sr4, data_source="seeded")
assert c4.classification == "UNKNOWN"
print(f"  Binary file classification: {c4.classification}, Cat: {c4.threat_category}")


print("\n=== 7. Persistence & API Retrieval (Simulated) ===")
from db.database import save_file_analysis, get_file_analysis
save_file_analysis(dataclasses.asdict(c2))
saved = get_file_analysis(c2.analysis_id)
assert saved is not None
assert saved["sha256"] == c2.sha256
assert saved["classification"] == "THREAT"
all_saved = list_file_analyses()
assert len(all_saved) == 1
print("  Persistence successful: OK")

print("\n=== ALL BATCH 3 CHECKS PASSED ===")
