from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import os
import json
from llm_engine import generate_mitigation

router = APIRouter(
    prefix="/api/scanner",
    tags=["scanner"],
)

SCAN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sandbox_scan"))

# Dummy signatures for malware scanning
MALWARE_SIGNATURES = {
    "evil_script.sh": "Suspicious bash script resembling a reverse shell dropper.",
    "WannaCry.exe": "Known WannaCry ransomware signature detected.",
    "config_leak.json": "Exposed AWS API keys detected in plaintext."
}

def analyze_package_json(filepath):
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            deps = data.get("dependencies", {})
            findings = []
            if "lodash" in deps and deps["lodash"].startswith("^4.17."):
                findings.append("lodash version is vulnerable to Prototype Pollution (CVE-2019-10744).")
            if "axios" in deps and deps["axios"] == "^0.21.0":
                findings.append("axios version is vulnerable to SSRF (CVE-2020-28168).")
            return findings
    except Exception as e:
        return [f"Error parsing package.json: {e}"]

@router.get("/scan-directory")
def scan_local_directory():
    if not os.path.exists(SCAN_DIR):
        os.makedirs(SCAN_DIR, exist_ok=True)
        # Create some dummy files to simulate environment
        with open(os.path.join(SCAN_DIR, "WannaCry.exe"), "w") as f:
            f.write("dummy malware bytes")
        with open(os.path.join(SCAN_DIR, "package.json"), "w") as f:
            json.dump({
                "name": "vulnerable-app",
                "dependencies": {
                    "lodash": "^4.17.15",
                    "axios": "^0.21.0"
                }
            }, f)
            
    results = []
    
    for filename in os.listdir(SCAN_DIR):
        filepath = os.path.join(SCAN_DIR, filename)
        if not os.path.isfile(filepath):
            continue
            
        threat_type = "Unknown"
        severity = "Low"
        context = ""
        found_threat = False
        
        # 1. Signature Scanning
        if filename in MALWARE_SIGNATURES:
            threat_type = "Malware Signature"
            severity = "Critical"
            context = MALWARE_SIGNATURES[filename]
            found_threat = True
            
        # 2. Dependency Scanning
        elif filename == "package.json":
            deps_findings = analyze_package_json(filepath)
            if deps_findings:
                threat_type = "Vulnerable Dependency"
                severity = "High"
                context = " ".join(deps_findings)
                found_threat = True
                
        if found_threat:
            # Send to LLM to generate remedy
            mitigation_data = generate_mitigation(
                threat_name=filename,
                threat_type=threat_type,
                severity=severity,
                context=context
            )
            
            results.append({
                "file": filename,
                "threat_type": threat_type,
                "severity": severity,
                "analysis": context,
                "remedy": mitigation_data
            })
            
    return {"scanned_directory": SCAN_DIR, "findings": results}

@router.get("/folder")
def scan_folder(path: str = Query(..., description="Absolute path to scan")):
    """
    Read-only endpoint to scan a folder's structure.
    Strictly forbids any write, delete, or execute operations.
    """
    try:
        target_path = Path(path).resolve()
        
        if not target_path.exists():
            raise HTTPException(status_code=404, detail="Path does not exist")
            
        if not target_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is not a directory")
            
        # Hard limit to prevent scanning entire massive drives and crashing
        max_items = 100
        items = []
        
        try:
            for i, entry in enumerate(os.scandir(target_path)):
                if i >= max_items:
                    items.append({"name": "... (truncated)", "type": "info", "size": 0})
                    break
                    
                items.append({
                    "name": entry.name,
                    "type": "directory" if entry.is_dir() else "file",
                    "size": entry.stat().st_size if entry.is_file() else 0
                })
        except PermissionError:
            raise HTTPException(status_code=403, detail="Permission denied to read this directory")
            
        return {
            "path": str(target_path),
            "contents": sorted(items, key=lambda x: (x["type"] == "file", x["name"].lower()))
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

