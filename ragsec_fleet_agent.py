#!/usr/bin/env python3
"""
RAGSec Enterprise SIEM Fleet Agent
===================================
Standalone endpoint agent script to connect another laptop to the RAGSec SIEM Fleet.

Usage:
    python ragsec_fleet_agent.py --port 8000 --master http://192.168.1.100:8000 --name "FINANCE-LAPTOP-02"

Security Boundary:
    Strictly walls off all host directories. Exposes ONLY the project's sandbox directory
    ('monitored_workspace/' or 'sandbox/'). Any path traversal outside the sandbox is
    prohibited and blocked with HTTP 403 Forbidden.
"""

import os
import sys
import json
import time
import socket
import argparse
import platform
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.error

# Determine local sandbox directory
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
SANDBOX_DIR = os.path.join(AGENT_DIR, "monitored_workspace")
if not os.path.exists(SANDBOX_DIR):
    SANDBOX_DIR = os.path.join(AGENT_DIR, "sandbox")
    os.makedirs(SANDBOX_DIR, exist_ok=True)

MASTER_URL = "http://127.0.0.1:8000"
HOSTNAME = socket.gethostname()
PORT = 8000


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class FleetAgentHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # 1. Health & Heartbeat
        if parsed.path == "/api/health":
            return self.send_json(200, {
                "status": "ONLINE",
                "hostname": HOSTNAME,
                "ip_address": get_local_ip(),
                "os_type": f"{platform.system()} {platform.release()} ({platform.machine()})",
                "agent_version": "Sentinel v2.4-StandaloneFleetAgent",
                "sandbox_root": os.path.basename(SANDBOX_DIR),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            })

        # 2. List Sandbox Files Strictly
        if parsed.path == "/api/fleet/sandbox-files":
            subpath = params.get("subpath", [""])[0].strip().replace("\\", "/").lstrip("/")
            parts = [p for p in subpath.split("/") if p and p != "."]

            # SECURITY CHECK: Block Path Traversal
            if any(p == ".." for p in parts):
                return self.send_json(403, {"error": "Sandbox Violation: Path traversal strictly prohibited."})

            target_dir = os.path.abspath(os.path.join(SANDBOX_DIR, *parts))
            if not target_dir.startswith(os.path.abspath(SANDBOX_DIR)):
                return self.send_json(403, {"error": "Sandbox Violation: Target escapes local sandbox directory."})

            if not os.path.exists(target_dir):
                return self.send_json(404, {"error": "Folder not found in sandbox."})

            directories = []
            files_list = []

            for entry in sorted(os.scandir(target_dir), key=lambda e: (not e.is_dir(), e.name.lower())):
                if entry.name in [".git", "__pycache__", ".DS_Store"]:
                    continue
                rel_path = f"{subpath}/{entry.name}" if subpath else entry.name
                if entry.is_dir():
                    directories.append({
                        "name": entry.name,
                        "rel_path": rel_path,
                        "item_count": len(os.listdir(entry.path))
                    })
                else:
                    stat = entry.stat()
                    sha256 = ""
                    try:
                        with open(entry.path, "rb") as f:
                            sha256 = hashlib.sha256(f.read(4096)).hexdigest()
                    except Exception:
                        pass
                    files_list.append({
                        "name": entry.name,
                        "rel_path": rel_path,
                        "size_bytes": stat.st_size,
                        "modified_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(stat.st_mtime)),
                        "threat_status": "THREAT" if any(b in entry.name.lower() for b in [".enc", "malware", "mimikatz", "ransom"]) else "SAFE",
                        "sha256": sha256
                    })

            return self.send_json(200, {
                "hostname": HOSTNAME,
                "sandbox_root": os.path.basename(SANDBOX_DIR),
                "current_subpath": subpath,
                "directories": directories,
                "files": files_list,
                "total_items": len(directories) + len(files_list),
                "enclave_secured": True
            })

        # 3. Read Sandbox File Content Strictly
        if parsed.path == "/api/fleet/sandbox-file-content":
            file_path = params.get("file_path", [""])[0].strip().replace("\\", "/").lstrip("/")
            parts = [p for p in file_path.split("/") if p and p != "."]

            # SECURITY CHECK: Block Path Traversal
            if any(p == ".." for p in parts):
                return self.send_json(403, {"error": "Sandbox Violation: Path traversal strictly prohibited."})

            target_file = os.path.abspath(os.path.join(SANDBOX_DIR, *parts))
            if not target_file.startswith(os.path.abspath(SANDBOX_DIR)):
                return self.send_json(403, {"error": "Sandbox Violation: Target escapes local sandbox directory."})

            if not os.path.exists(target_file) or os.path.isdir(target_file):
                return self.send_json(404, {"error": "File not found in sandbox."})

            try:
                with open(target_file, "rb") as f:
                    raw = f.read(65536)
                try:
                    content = raw.decode("utf-8")
                except UnicodeDecodeError:
                    content = f"[Binary File - {len(raw)} bytes]\n" + raw[:256].hex()

                return self.send_json(200, {
                    "hostname": HOSTNAME,
                    "file_name": os.path.basename(target_file),
                    "rel_path": file_path,
                    "content": content,
                    "size_bytes": os.path.getsize(target_file),
                    "enclave_secured": True
                })
            except Exception as e:
                return self.send_json(500, {"error": str(e)})

        return self.send_json(404, {"error": "Endpoint not found."})

    def do_POST(self):
        parsed = urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 4. Report Threat To Master Console
        if parsed.path == "/api/fleet/report-threat":
            event_data = {
                "id": f"LOG-REMOTE-{int(time.time() * 1000) % 100000}",
                "device_id": f"DEV-{HOSTNAME}",
                "hostname": HOSTNAME,
                "ip_address": get_local_ip(),
                "event_type": "REMOTE_SANDBOX_THREAT",
                "threat_status": "THREAT",
                "threat_category": payload.get("threat_category", "Ransomware"),
                "threat_name": payload.get("threat_name", "Remote Sandbox Malicious Payload"),
                "file_name": payload.get("file_name", "remote_payload.enc"),
                "file_path": f"monitored_workspace/{payload.get('file_name', 'remote_payload.enc')}",
                "severity": payload.get("severity", "CRITICAL"),
                "confidence": 98,
                "timestamp": time.strftime("%H:%M:%S UTC", time.gmtime()),
                "message": payload.get("message", "Threat detected in remote laptop sandbox."),
                "indicators": payload.get("indicators", ["High Entropy", "Signature Match"]),
                "action_taken": "Automated Sandbox Isolation Enforced"
            }

            # Forward to master SIEM console if configured
            try:
                req = urllib.request.Request(
                    f"{MASTER_URL}/api/fleet/report-event",
                    data=json.dumps(event_data).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=3) as resp:
                    pass
            except Exception as e:
                print(f"[FleetAgent] Failed to forward to master SIEM: {e}")

            return self.send_json(200, {"status": "REPORTED", "event": event_data})

        return self.send_json(404, {"error": "Endpoint not found."})


def register_with_master():
    print(f"[FleetAgent] Registering endpoint '{HOSTNAME}' with Master SIEM at {MASTER_URL}...")
    reg_data = {
        "hostname": HOSTNAME,
        "ip_address": get_local_ip(),
        "port": PORT,
        "os_type": f"{platform.system()} {platform.release()}",
        "device_type": "Remote Laptop",
        "segment": "Enterprise Fleet"
    }
    try:
        req = urllib.request.Request(
            f"{MASTER_URL}/api/fleet/connect",
            data=json.dumps(reg_data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            print("[FleetAgent] Successfully registered with Master SIEM!")
    except Exception as e:
        print(f"[FleetAgent] Master not reachable right now: {e}. Running independently in ready state.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAGSec SIEM Fleet Endpoint Agent")
    parser.add_argument("--port", type=int, default=8000, help="Local agent port")
    parser.add_argument("--master", type=str, default="http://127.0.0.1:8000", help="Master SIEM Console URL")
    parser.add_argument("--name", type=str, default=HOSTNAME, help="Endpoint Display Hostname")
    args = parser.parse_args()

    PORT = args.port
    MASTER_URL = args.master
    HOSTNAME = args.name

    print("=" * 65)
    print(" RAGSec Enterprise SIEM Fleet Endpoint Agent")
    print("=" * 65)
    print(f" Hostname:      {HOSTNAME}")
    print(f" IP Address:    {get_local_ip()}:{PORT}")
    print(f" Sandbox Dir:   {SANDBOX_DIR}")
    print(f" Master SIEM:   {MASTER_URL}")
    print(f" Security:      Strictly Enclosed to Sandbox (Outside Traversal Prohibited)")
    print("=" * 65)

    register_with_master()

    server = HTTPServer(("0.0.0.0", PORT), FleetAgentHandler)
    print(f"[FleetAgent] Listening on 0.0.0.0:{PORT}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[FleetAgent] Shutting down.")
