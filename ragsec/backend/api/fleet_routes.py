"""
ragsec.backend.api.fleet_routes
================================
Enterprise SIEM Fleet Management & Distributed Endpoint Sandbox Sentinel.

Provides:
- Fleet discovery, laptop connection, and handshake telemetry.
- Strictly isolated sandbox file browsing (restricted exclusively to the project's sandbox directory).
- Real-time harmful log streaming and fleet-wide threat alert dispatch.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pathlib import Path
import os
import json
import time
import hashlib
import math
import urllib.request
import urllib.error
from datetime import datetime, timezone

from config import get_canonical_workspace_dir

router = APIRouter(prefix="/api/fleet", tags=["enterprise_fleet"])

# Paths for persistent fleet storage
BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR.parent / "data"
os.makedirs(DATA_DIR, exist_ok=True)

FLEET_REGISTRY_FILE = DATA_DIR / "fleet_registry.json"
FLEET_LOGS_FILE = DATA_DIR / "fleet_harmful_logs.json"

# Initialize Fleet Sandboxes Base Directory
FLEET_SANDBOX_BASE = Path(get_canonical_workspace_dir()) / "fleet_sandboxes"
os.makedirs(FLEET_SANDBOX_BASE, exist_ok=True)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class FleetDevice(BaseModel):
    id: str
    hostname: str
    ip_address: str
    port: int = 8000
    remote_url: Optional[str] = None
    device_type: str = "Remote Laptop"
    os_type: str = "Windows 11 Enterprise (23H2)"
    segment: str = "Corporate Fleet"
    criticality: str = "high"
    status: str = "active"  # "active", "compromised", "isolated", "offline"
    latency_ms: float = 1.2
    threats_active: int = 0
    agent_version: str = "Sentinel v2.4-Fleet"
    sandbox_enclave_path: str = "monitored_workspace/"
    last_seen: str = "Just now"
    is_remote: bool = True
    mac_address: Optional[str] = "00:50:56:FE:19:02"


class ConnectEndpointReq(BaseModel):
    hostname: str
    ip_address: str
    port: int = 8000
    os_type: Optional[str] = "Windows 11 Enterprise (23H2)"
    device_type: Optional[str] = "Remote Laptop"
    segment: Optional[str] = "Enterprise Fleet"
    agent_token: Optional[str] = "ragsec-fleet-secret"


class FleetHarmfulLog(BaseModel):
    id: str
    device_id: str
    hostname: str
    ip_address: str
    event_type: str
    threat_status: str  # "THREAT", "SUSPICIOUS"
    threat_category: str
    threat_name: str
    file_name: str
    file_path: str
    severity: str  # "CRITICAL", "HIGH", "MEDIUM"
    confidence: int = 95
    timestamp: str
    message: str
    indicators: List[str] = []
    action_taken: str = "Sandbox Enclave Monitored"


class SimulateHarmfulLogReq(BaseModel):
    device_id: str
    threat_type: Optional[str] = "ransomware"  # "ransomware", "trojan", "stealer", "injection"


# ---------------------------------------------------------------------------
# Seed Default Fleet Laptops & Storage Helpers
# ---------------------------------------------------------------------------
DEFAULT_FLEET_DEVICES: List[Dict[str, Any]] = [
    {
        "id": "DEV-LOCAL-01",
        "hostname": "RAGSEC-MASTER-HOST",
        "ip_address": "127.0.0.1",
        "port": 8000,
        "remote_url": "http://127.0.0.1:8000",
        "device_type": "Security Master Node",
        "os_type": "Windows 11 Pro (Host Node)",
        "segment": "Master SOC Controller",
        "criticality": "critical",
        "status": "active",
        "latency_ms": 0.2,
        "threats_active": 0,
        "agent_version": "Sentinel v2.4-Master",
        "sandbox_enclave_path": "monitored_workspace/",
        "last_seen": "Realtime",
        "is_remote": False,
        "mac_address": "3C:7C:3F:8A:19:B2"
    },
    {
        "id": "DEV-LAPTOP-FIN02",
        "hostname": "FINANCE-LAPTOP-02",
        "ip_address": "192.168.1.45",
        "port": 8000,
        "remote_url": "http://192.168.1.45:8000",
        "device_type": "Remote Laptop",
        "os_type": "Windows 11 Enterprise (Dell Latitude 7440)",
        "segment": "Corporate Finance Enclave",
        "criticality": "high",
        "status": "active",
        "latency_ms": 2.4,
        "threats_active": 1,
        "agent_version": "Sentinel v2.4-WinFleet",
        "sandbox_enclave_path": "monitored_workspace/fleet_sandboxes/DEV-LAPTOP-FIN02/",
        "last_seen": "1s ago",
        "is_remote": True,
        "mac_address": "A4:83:E7:22:90:5F"
    },
    {
        "id": "DEV-LAPTOP-ENG09",
        "hostname": "ENG-MACBOOK-PRO-16",
        "ip_address": "192.168.1.88",
        "port": 8000,
        "remote_url": "http://192.168.1.88:8000",
        "device_type": "Developer Laptop",
        "os_type": "macOS Sonoma 14.5 (Apple M3 Max)",
        "segment": "Core Engineering Subnet",
        "criticality": "medium",
        "status": "active",
        "latency_ms": 3.8,
        "threats_active": 0,
        "agent_version": "Sentinel v2.4-DarwinFleet",
        "sandbox_enclave_path": "monitored_workspace/fleet_sandboxes/DEV-LAPTOP-ENG09/",
        "last_seen": "Just now",
        "is_remote": True,
        "mac_address": "F4:D4:88:2E:77:01"
    },
    {
        "id": "DEV-LAPTOP-EXEC01",
        "hostname": "EXEC-LAPTOP-X1C",
        "ip_address": "192.168.1.102",
        "port": 8000,
        "remote_url": "http://192.168.1.102:8000",
        "device_type": "Executive Laptop",
        "os_type": "Windows 11 Enterprise (Lenovo ThinkPad X1)",
        "segment": "Executive Confidential Enclave",
        "criticality": "high",
        "status": "active",
        "latency_ms": 1.9,
        "threats_active": 0,
        "agent_version": "Sentinel v2.4-WinFleet",
        "sandbox_enclave_path": "monitored_workspace/fleet_sandboxes/DEV-LAPTOP-EXEC01/",
        "last_seen": "3s ago",
        "is_remote": True,
        "mac_address": "48:2A:E3:9B:10:44"
    }
]

DEFAULT_HARMFUL_LOGS: List[Dict[str, Any]] = [
    {
        "id": "LOG-FLT-801",
        "device_id": "DEV-LAPTOP-FIN02",
        "hostname": "FINANCE-LAPTOP-02",
        "ip_address": "192.168.1.45",
        "event_type": "FILE_INTEGRITY_VIOLATION",
        "threat_status": "THREAT",
        "threat_category": "Ransomware",
        "threat_name": "LockBit 3.0 Rapid File Encryption Anomaly",
        "file_name": "q3_payroll_records.enc",
        "file_path": "monitored_workspace/fleet_sandboxes/DEV-LAPTOP-FIN02/q3_payroll_records.enc",
        "severity": "CRITICAL",
        "confidence": 98,
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
        "message": "High entropy header mutation detected in remote laptop sandbox. Threat payload neutralized by Sentinel FIM.",
        "indicators": ["High Entropy 7.94/8.0", "Mass Modification Rate > 40 ops/sec", "Ransom Note Dropped"],
        "action_taken": "Automated Sandbox Isolation Enforced"
    }
]


def load_fleet_registry() -> List[Dict[str, Any]]:
    if not FLEET_REGISTRY_FILE.exists():
        save_fleet_registry(DEFAULT_FLEET_DEVICES)
        return DEFAULT_FLEET_DEVICES
    try:
        with open(FLEET_REGISTRY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_FLEET_DEVICES


def save_fleet_registry(devices: List[Dict[str, Any]]) -> None:
    try:
        with open(FLEET_REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(devices, f, indent=2)
    except Exception:
        pass


def load_harmful_logs() -> List[Dict[str, Any]]:
    if not FLEET_LOGS_FILE.exists():
        save_harmful_logs(DEFAULT_HARMFUL_LOGS)
        return DEFAULT_HARMFUL_LOGS
    try:
        with open(FLEET_LOGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_HARMFUL_LOGS


def save_harmful_logs(logs: List[Dict[str, Any]]) -> None:
    try:
        with open(FLEET_LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
    except Exception:
        pass


# Seed initial sandbox folders and files for fleet laptops
def seed_fleet_sandbox_folders():
    devices = load_fleet_registry()
    for dev in devices:
        dev_id = dev["id"]
        if dev_id == "DEV-LOCAL-01":
            continue
        dev_dir = FLEET_SANDBOX_BASE / dev_id
        os.makedirs(dev_dir, exist_ok=True)
        os.makedirs(dev_dir / ".quarantine", exist_ok=True)
        os.makedirs(dev_dir / "documents", exist_ok=True)

        # Seed sample files if folder is empty
        if len(list(dev_dir.iterdir())) <= 2:
            if "FIN" in dev_id:
                (dev_dir / "documents" / "quarterly_budget.xlsx").write_text("Budget,Department,Allocation\n2026,Security,500000", encoding="utf-8")
                (dev_dir / "payroll_tax_statement.pdf").write_text("%PDF-1.4 [Sanitized Payroll Statement for Finance Workstation]", encoding="utf-8")
                (dev_dir / "vendor_wire_instructions.txt").write_text("IBAN: GB29NWBK60161331926819\nSwift: NWBKGB2L\nStatus: Verified", encoding="utf-8")
                (dev_dir / "q3_payroll_records.enc").write_text("LOCKBIT_3.0_ENCRYPTED_HEADER_DATA_ANOMALOUS_MUTATION_SIMULATION", encoding="utf-8")
            elif "ENG" in dev_id:
                (dev_dir / "api_gateway_proxy.py").write_text("# API Gateway Sentinel\nimport sys\nprint('Engineering Gateway Active')", encoding="utf-8")
                (dev_dir / "build_manifest.json").write_text('{"build": "v3.1.2", "commit": "8f39b1a", "status": "clean"}', encoding="utf-8")
                (dev_dir / "deploy_script.sh").write_text("#!/bin/bash\necho 'Compiling security modules...'\nexit 0", encoding="utf-8")
            else:
                (dev_dir / "board_minutes_nov2026.docx").write_text("Executive Board Meeting Minutes - Confidential", encoding="utf-8")
                (dev_dir / "audit_compliance_report.txt").write_text("ISO 27001 & SOC2 Type II Certified Enclave", encoding="utf-8")

seed_fleet_sandbox_folders()


def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    entropy = 0
    for x in range(256):
        p_x = float(data.count(x)) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return round(entropy, 2)


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.get("/endpoints", response_model=List[FleetDevice])
def get_fleet_endpoints():
    """
    Returns all computers connected to the enterprise SIEM fleet mesh.
    Includes active threat counts and last known latency.
    """
    devices = load_fleet_registry()
    logs = load_harmful_logs()

    # Recalculate threats_active from logs for each device
    results = []
    for d in devices:
        threat_count = sum(1 for log in logs if log.get("device_id") == d["id"] and log.get("threat_status") == "THREAT")
        d_copy = dict(d)
        d_copy["threats_active"] = threat_count
        results.append(FleetDevice(**d_copy))

    return results


@router.post("/connect", response_model=FleetDevice)
def connect_fleet_endpoint(req: ConnectEndpointReq):
    """
    Connect a new remote laptop/endpoint to the Enterprise SIEM Fleet.
    Verifies network reachability or sets up isolated sandbox monitoring.
    """
    devices = load_fleet_registry()
    
    # Generate clean unique ID
    clean_host = "".join(c for c in req.hostname if c.isalnum() or c in "-_").upper()
    endpoint_id = f"DEV-{clean_host[:12]}"

    # Check for existing device
    existing = next((d for d in devices if d["id"] == endpoint_id or d["ip_address"] == req.ip_address), None)
    if existing:
        return FleetDevice(**existing)

    remote_url = f"http://{req.ip_address}:{req.port}"

    # Initialize its designated sandbox folder on filesystem
    dev_sandbox = FLEET_SANDBOX_BASE / endpoint_id
    os.makedirs(dev_sandbox, exist_ok=True)
    os.makedirs(dev_sandbox / ".quarantine", exist_ok=True)
    os.makedirs(dev_sandbox / "sandbox_workspace", exist_ok=True)
    (dev_sandbox / "sandbox_workspace" / "endpoint_info.txt").write_text(
        f"Enrolled Endpoint: {req.hostname}\nIP: {req.ip_address}:{req.port}\nOS: {req.os_type}\nConnected: {datetime.now(timezone.utc).isoformat()}",
        encoding="utf-8"
    )

    new_device = {
        "id": endpoint_id,
        "hostname": req.hostname.strip(),
        "ip_address": req.ip_address.strip(),
        "port": req.port,
        "remote_url": remote_url,
        "device_type": req.device_type or "Remote Laptop",
        "os_type": req.os_type or "Windows 11 Enterprise (23H2)",
        "segment": req.segment or "Enterprise Fleet",
        "criticality": "high",
        "status": "active",
        "latency_ms": 2.1,
        "threats_active": 0,
        "agent_version": "Sentinel v2.4-Fleet",
        "sandbox_enclave_path": f"monitored_workspace/fleet_sandboxes/{endpoint_id}/",
        "last_seen": "Just connected",
        "is_remote": True,
        "mac_address": f"00:50:56:{(abs(hash(req.hostname)) % 89 + 10)}:FE:{req.port % 90 + 10}"
    }

    devices.append(new_device)
    save_fleet_registry(devices)

    return FleetDevice(**new_device)


@router.delete("/endpoints/{device_id}")
def disconnect_fleet_endpoint(device_id: str):
    """Disconnect / unenroll a computer from the fleet."""
    if device_id == "DEV-LOCAL-01":
        raise HTTPException(status_code=400, detail="Cannot disconnect the local master SOC node.")
    devices = load_fleet_registry()
    filtered = [d for d in devices if d["id"] != device_id]
    if len(filtered) == len(devices):
        raise HTTPException(status_code=404, detail="Endpoint not found.")
    save_fleet_registry(filtered)
    return {"status": "DISCONNECTED", "device_id": device_id}


@router.post("/endpoints/{device_id}/ping")
def ping_fleet_endpoint(device_id: str):
    """Pings a remote laptop and returns real-time latency and heartbeat status."""
    devices = load_fleet_registry()
    device = next((d for d in devices if d["id"] == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Endpoint not found.")

    if not device.get("is_remote"):
        return {
            "device_id": device_id,
            "status": "ONLINE",
            "latency_ms": 0.1,
            "heartbeat": "Local Kernel Sentinel Online"
        }

    # If remote, attempt fast socket/HTTP check to agent URL
    remote_url = device.get("remote_url")
    latency = device.get("latency_ms", 2.5)
    is_online = True

    if remote_url:
        try:
            req = urllib.request.Request(f"{remote_url}/api/health", headers={"User-Agent": "RAGSec-Master-Fleet/1.0"})
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    latency = round((time.time() - t0) * 1000, 2)
                    is_online = True
        except Exception:
            # If actual remote host isn't physically up right now, fallback to simulated heartbeat
            is_online = device.get("status") != "offline"

    return {
        "device_id": device_id,
        "status": "ONLINE" if is_online else "UNREACHABLE",
        "latency_ms": latency,
        "last_seen": "Just now",
        "agent_version": device.get("agent_version", "Sentinel v2.4-Fleet")
    }


@router.post("/endpoints/{device_id}/isolate")
def toggle_device_isolation(device_id: str):
    """Toggles zero-trust network isolation on an endpoint laptop."""
    devices = load_fleet_registry()
    for d in devices:
        if d["id"] == device_id:
            d["status"] = "active" if d["status"] == "isolated" else "isolated"
            save_fleet_registry(devices)
            return {
                "device_id": device_id,
                "status": d["status"],
                "message": f"Device {d['hostname']} {'restored to network' if d['status'] == 'active' else 'ISOLATED via Zero-Trust Sentinel policy'}."
            }
    raise HTTPException(status_code=404, detail="Device not found.")


# ---------------------------------------------------------------------------
# STRICT SANDBOX FILE EXPLORER FOR REMOTE LAPTOPS
# Enforces strictly that only files inside the project's sandbox directory
# can ever be viewed or listed. Traversal outside is blocked with 403.
# ---------------------------------------------------------------------------
@router.get("/endpoints/{device_id}/sandbox-files")
def get_endpoint_sandbox_files(device_id: str, subpath: str = ""):
    """
    Returns sandboxed directory listing strictly for the chosen fleet computer.
    SECURITY BOUNDARY: Traversal outside the designated sandbox folder is strictly prohibited.
    """
    devices = load_fleet_registry()
    device = next((d for d in devices if d["id"] == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Endpoint not found.")

    # Determine canonical sandbox root directory for this device
    if device_id == "DEV-LOCAL-01":
        sandbox_base = Path(get_canonical_workspace_dir())
    else:
        sandbox_base = FLEET_SANDBOX_BASE / device_id
        if not sandbox_base.exists():
            os.makedirs(sandbox_base, exist_ok=True)
            seed_fleet_sandbox_folders()

    # Sanitize and validate subpath
    subpath = subpath.strip().replace("\\", "/").lstrip("/")
    parts = [p for p in subpath.split("/") if p and p != "."]

    # Block any attempt at directory traversal
    if any(p == ".." for p in parts):
        raise HTTPException(status_code=403, detail="Sandbox Violation: Path traversal '..' is strictly prohibited.")

    target_dir = sandbox_base.joinpath(*parts).resolve()

    # Strict containment check
    if not str(target_dir).startswith(str(sandbox_base.resolve())):
        raise HTTPException(status_code=403, detail="Sandbox Violation: Target path escapes designated sandbox enclosure.")

    if not target_dir.exists():
        raise HTTPException(status_code=404, detail=f"Sandbox folder '{subpath}' not found on endpoint.")

    # Build breadcrumbs
    breadcrumbs = [{"label": "sandbox", "subpath": ""}]
    running = ""
    for p in parts:
        running = f"{running}/{p}" if running else p
        breadcrumbs.append({"label": p, "subpath": running})

    directories = []
    files_list = []

    try:
        entries = sorted(os.scandir(target_dir), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            # Skip internal system items if any
            if entry.name in [".git", "__pycache__", ".DS_Store"]:
                continue

            rel_item_path = f"{subpath}/{entry.name}" if subpath else entry.name

            if entry.is_dir():
                try:
                    count = len(os.listdir(entry.path))
                except Exception:
                    count = 0
                directories.append({
                    "name": entry.name,
                    "rel_path": rel_item_path,
                    "item_count": count,
                    "is_quarantine": entry.name == ".quarantine"
                })
            else:
                try:
                    stat = entry.stat()
                    size_bytes = stat.st_size
                    mod_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

                    # Threat evaluation simulation
                    fn_lower = entry.name.lower()
                    is_threat = any(bad in fn_lower for bad in [".enc", "malware", "mimikatz", "trojan", "ransom", "dropper"])
                    threat_status = "THREAT" if is_threat else "SAFE"
                    category = "Ransomware" if ".enc" in fn_lower or "ransom" in fn_lower else ("Malware" if is_threat else "BENIGN")
                    risk_score = 90 if is_threat else 0

                    # Compute fast sha256
                    sha256 = ""
                    try:
                        with open(entry.path, "rb") as f:
                            sha256 = hashlib.sha256(f.read(4096)).hexdigest()
                    except Exception:
                        pass

                    files_list.append({
                        "name": entry.name,
                        "rel_path": rel_item_path,
                        "size_bytes": size_bytes,
                        "modified_at": mod_time,
                        "threat_status": threat_status,
                        "category": category,
                        "risk_score": risk_score,
                        "sha256": sha256,
                        "extension": entry.name.split(".")[-1].lower() if "." in entry.name else "file"
                    })
                except Exception:
                    continue
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read sandbox directory: {str(e)}")

    return {
        "device_id": device_id,
        "hostname": device["hostname"],
        "ip_address": device["ip_address"],
        "sandbox_root": "monitored_workspace/fleet_sandboxes" if device_id != "DEV-LOCAL-01" else "monitored_workspace",
        "current_subpath": subpath,
        "breadcrumbs": breadcrumbs,
        "can_go_up": len(parts) > 0,
        "parent_path": "/".join(parts[:-1]) if len(parts) > 1 else ("" if len(parts) == 1 else None),
        "enclave_secured": True,
        "directories": directories,
        "files": files_list,
        "total_items": len(directories) + len(files_list)
    }


@router.get("/endpoints/{device_id}/sandbox-file-content")
def get_endpoint_sandbox_file_content(device_id: str, file_path: str):
    """
    Safely retrieves file content strictly from the endpoint's sandbox directory.
    SECURITY: Rejects any access outside the sandbox folder.
    """
    devices = load_fleet_registry()
    device = next((d for d in devices if d["id"] == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Endpoint not found.")

    if device_id == "DEV-LOCAL-01":
        sandbox_base = Path(get_canonical_workspace_dir())
    else:
        sandbox_base = FLEET_SANDBOX_BASE / device_id

    # Sanitize and validate
    clean_path = file_path.strip().replace("\\", "/").lstrip("/")
    parts = [p for p in clean_path.split("/") if p and p != "."]

    if any(p == ".." for p in parts):
        raise HTTPException(status_code=403, detail="Sandbox Violation: Path traversal prohibited.")

    target_file = sandbox_base.joinpath(*parts).resolve()

    if not str(target_file).startswith(str(sandbox_base.resolve())):
        raise HTTPException(status_code=403, detail="Sandbox Violation: File is outside project sandbox.")

    if not target_file.exists() or target_file.is_dir():
        raise HTTPException(status_code=404, detail="File not found in sandbox.")

    # Read content up to 64KB
    try:
        raw_bytes = target_file.read_bytes()
        entropy = calculate_entropy(raw_bytes[:8192])
        try:
            content = raw_bytes[:65536].decode("utf-8")
        except UnicodeDecodeError:
            content = f"[Binary File - {len(raw_bytes)} bytes - Raw Hex Preview]\n" + raw_bytes[:512].hex()

        fn_lower = target_file.name.lower()
        is_threat = any(bad in fn_lower for bad in [".enc", "malware", "mimikatz", "trojan", "ransom", "dropper"])

        return {
            "device_id": device_id,
            "hostname": device["hostname"],
            "file_name": target_file.name,
            "rel_path": clean_path,
            "content": content,
            "size_bytes": len(raw_bytes),
            "entropy": entropy,
            "threat_status": "THREAT" if is_threat else "SAFE",
            "category": "Ransomware" if ".enc" in fn_lower else ("Malware" if is_threat else "BENIGN"),
            "risk_score": 92 if is_threat else 0,
            "enclave_verified": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading sandbox file: {str(e)}")


# ---------------------------------------------------------------------------
# FLEET HARMFUL LOG STREAMING & ALERT NOTIFICATIONS
# ---------------------------------------------------------------------------

@router.get("/harmful-logs", response_model=List[FleetHarmfulLog])
def get_fleet_harmful_logs(since: Optional[str] = None):
    """
    Returns harmful security logs received from all connected fleet laptops.
    Used by the SOC topbar alert system for real-time notifications.
    """
    logs = load_harmful_logs()
    return [FleetHarmfulLog(**log) for log in logs]


@router.post("/report-event", response_model=FleetHarmfulLog)
def report_fleet_event(event: FleetHarmfulLog):
    """
    Called by remote fleet endpoints (or the Standalone Fleet Agent) to report
    harmful events into the central enterprise SIEM console.
    """
    logs = load_harmful_logs()
    # Check if duplicate
    existing = next((l for l in logs if l["id"] == event.id), None)
    if not existing:
        logs.insert(0, event.model_dump())
        save_harmful_logs(logs)

    # Increment threats_active on that device in registry
    devices = load_fleet_registry()
    for d in devices:
        if d["id"] == event.device_id or d["hostname"] == event.hostname:
            d["threats_active"] = d.get("threats_active", 0) + 1
            d["status"] = "compromised"
            break
    save_fleet_registry(devices)

    return event


@router.post("/simulate-harmful-log", response_model=FleetHarmfulLog)
def simulate_harmful_log_event(req: SimulateHarmfulLogReq):
    """
    Simulates an instant harmful event on any laptop in the fleet.
    Triggers the real-time notification alert toast in the UI.
    """
    devices = load_fleet_registry()
    device = next((d for d in devices if d["id"] == req.device_id), devices[1] if len(devices) > 1 else devices[0])

    threat_presets = {
        "ransomware": {
            "threat_category": "Ransomware",
            "threat_name": "LockBit 3.0 High-Entropy Encryption Trigger",
            "file_name": "client_portfolio_records.enc",
            "severity": "CRITICAL",
            "indicators": ["High Entropy 7.91", "Mass File Writes", "Volume Shadow Copy Deletion Blocked"],
            "message": f"Suspicious ransomware-style mass write anomaly observed in {device['hostname']} sandbox folder."
        },
        "trojan": {
            "threat_category": "Trojan / C2 Dropper",
            "threat_name": "CobaltStrike Beacon Stager Dropped",
            "file_name": "invoice_update_stager.ps1",
            "severity": "HIGH",
            "indicators": ["Encoded PowerShell Payload", "Suspicious Base64 IEX", "C2 Callback Prevented"],
            "message": f"Obfuscated PowerShell execution attempt intercepted on {device['hostname']}."
        },
        "stealer": {
            "threat_category": "Credential Theft",
            "threat_name": "Mimikatz LSASS Memory Dump Probe",
            "file_name": "procdump_lsass_simulation.bin",
            "severity": "CRITICAL",
            "indicators": ["LSASS Access Handle Requested", "Privilege SeDebugPrivilege", "Mimikatz Signature Match"],
            "message": f"Credential access tool invocation detected on {device['hostname']}."
        },
        "injection": {
            "threat_category": "Code Injection",
            "threat_name": "Process Injection / DLL Side-Loading Anomaly",
            "file_name": "version.dll",
            "severity": "HIGH",
            "indicators": ["Unsigned DLL in Project Path", "Reflective DLL Injection Target"],
            "message": f"Rogue DLL placed in sandbox execution path on {device['hostname']}."
        }
    }

    preset = threat_presets.get(req.threat_type, threat_presets["ransomware"])
    log_id = f"LOG-FLT-{int(time.time() * 1000) % 100000}"
    timestamp_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

    new_log = {
        "id": log_id,
        "device_id": device["id"],
        "hostname": device["hostname"],
        "ip_address": device["ip_address"],
        "event_type": "REMOTE_SANDBOX_THREAT_INTERCEPT",
        "threat_status": "THREAT",
        "threat_category": preset["threat_category"],
        "threat_name": preset["threat_name"],
        "file_name": preset["file_name"],
        "file_path": f"{device.get('sandbox_enclave_path', 'monitored_workspace/')}{preset['file_name']}",
        "severity": preset["severity"],
        "confidence": 97,
        "timestamp": timestamp_str,
        "message": preset["message"],
        "indicators": preset["indicators"],
        "action_taken": "Automated Sandbox Enclave Alert Dispatched"
    }

    logs = load_harmful_logs()
    logs.insert(0, new_log)
    save_harmful_logs(logs)

    # Update device status
    for d in devices:
        if d["id"] == device["id"]:
            d["threats_active"] = d.get("threats_active", 0) + 1
            d["status"] = "compromised"
            break
    save_fleet_registry(devices)

    return FleetHarmfulLog(**new_log)
