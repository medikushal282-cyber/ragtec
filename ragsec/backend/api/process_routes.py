"""
ragsec.backend.api.process_routes
Real-Time Process Inspection, Telemetry Analysis, Functional Role Identification,
and Host Process Governance Engine.
Empowers the RAGSec AI Copilot and SOC Analysts to inspect live running processes,
evaluate their true functional purpose, prevent accidental self-termination of the platform,
and recommend multi-tiered remediation (monitoring, throttling, firewalling, or termination).
"""
import os
import sys
import psutil
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from domain.audit import audit_service
from domain.soc_models import MitigationAction, MitigationStatus
from db.database import save_record
from config import settings

router = APIRouter(prefix="/api/processes", tags=["processes"])

# System-critical processes that must never be terminated to prevent OS crash
PROTECTED_PROCESS_NAMES = {
    "system", "system idle process", "registry", "smss.exe", "csrss.exe", 
    "wininit.exe", "services.exe", "lsass.exe", "svchost.exe", "explorer.exe",
    "winlogon.exe", "fontdrvhost.exe", "msmpeng.exe"
}
PROTECTED_PIDS = {0, 4}


def is_ragsec_platform_process(name: str, cmdline: str, pid: int = 0) -> bool:
    """Checks if a process belongs to RAGSec's own backend or frontend platform."""
    if pid > 0 and pid == os.getpid():
        return True
    lower_cmd = cmdline.lower()
    lower_name = name.lower()
    if "ragsec" in lower_cmd or "ragtec" in lower_cmd:
        if "uvicorn" in lower_cmd or "app:app" in lower_cmd:
            return True
        if "node" in lower_name and ("dist/index.js" in lower_cmd or "server" in lower_cmd):
            return True
        if "fastapi" in lower_cmd or ":8000" in lower_cmd or ":3000" in lower_cmd:
            return True
    if "uvicorn" in lower_cmd and "app:app" in lower_cmd:
        return True
    return False


def categorize_process(name: str, cmdline: str, pid: int = 0) -> tuple[str, str, str]:
    """
    Categorizes the process and provides a clear description of its functional role.
    Returns (category, functional_role, safety_tag).
    Categories:
      - RAGSEC_PLATFORM
      - SYSTEM_INFRASTRUCTURE
      - DEV_ENVIRONMENT
      - PRODUCTIVITY_APP
      - USER_BACKGROUND
      - SUSPICIOUS
    """
    lower_name = name.lower()
    lower_cmd = cmdline.lower()

    # 1. RAGSec Platform itself (Core Self-Awareness)
    if is_ragsec_platform_process(name, cmdline, pid):
        if "uvicorn" in lower_cmd or "app:app" in lower_cmd or "backend" in lower_cmd:
            return (
                "RAGSEC_PLATFORM",
                "RAGSec SOC Core API Backend (FastAPI / Uvicorn ASGI server on port 8000 powering the SOC neural engine)",
                "CRITICAL_PLATFORM_CORE"
            )
        elif "node" in lower_name:
            return (
                "RAGSEC_PLATFORM",
                "RAGSec SOC Web Console (Node.js/Express server on port 3000 hosting the analyst dashboard)",
                "CRITICAL_PLATFORM_CORE"
            )
        return ("RAGSEC_PLATFORM", "RAGSec SOC Platform Component", "CRITICAL_PLATFORM_CORE")

    # 2. Windows Core Infrastructure
    infra_map = {
        "dwm.exe": "Desktop Window Manager (Core Windows GUI Compositor & Display Engine)",
        "csrss.exe": "Client Server Runtime Subsystem (Critical Windows OS Core)",
        "smss.exe": "Session Manager Subsystem (Core Windows Startup & Session Mgr)",
        "services.exe": "Service Control Manager (Manages all Windows Background Services)",
        "lsass.exe": "Local Security Authority Subsystem (Windows Authentication & Security Policies)",
        "svchost.exe": "Service Host (Hosts critical Windows OS background services)",
        "explorer.exe": "Windows Shell & Desktop GUI (Taskbar, Start Menu, Desktop)",
        "audiodg.exe": "Windows Audio Device Graph Isolation (Digital Signal Processing & Audio Engine)",
        "msmpeng.exe": "Microsoft Defender Antivirus Core Scanning Engine",
        "searchindexer.exe": "Windows Search Indexing & Query Service",
        "fontdrvhost.exe": "Usermode Font Driver Host Service",
        "spoolsv.exe": "Windows Print Spooler Subsystem",
        "wmiprvse.exe": "WMI Provider Host (Windows Management Instrumentation)",
        "taskhostw.exe": "Host Process for Windows Scheduled Tasks & Background Events",
        "conhost.exe": "Console Window Host (Terminal / CLI Display Subsystem)",
        "sihost.exe": "Shell Infrastructure Host (Windows Modern UI Components)",
        "ctfmon.exe": "CTF Loader (Windows Text Input & IME Language Subsystem)"
    }
    if lower_name in infra_map:
        return ("SYSTEM_INFRASTRUCTURE", infra_map[lower_name], "VERIFIED_OS_CORE")

    # 3. Developer / Workspace Tools
    if "antigravity" in lower_name or "antigravity" in lower_cmd:
        return ("DEV_ENVIRONMENT", "Google Antigravity AI IDE / Development Workstation", "LEGITIMATE_DEV_TOOL")
    if "language_server" in lower_name:
        return ("DEV_ENVIRONMENT", "Language Server Protocol (LSP) Engine for IDE Code Intelligence", "LEGITIMATE_DEV_TOOL")
    if "code.exe" in lower_name:
        return ("DEV_ENVIRONMENT", "Visual Studio Code Editor", "LEGITIMATE_DEV_TOOL")
    if "git.exe" in lower_name:
        return ("DEV_ENVIRONMENT", "Git Distributed Version Control CLI", "LEGITIMATE_DEV_TOOL")
    if "mongod.exe" in lower_name:
        return ("DEV_ENVIRONMENT", "MongoDB NoSQL Database Server", "LEGITIMATE_DEV_SERVICE")
    if lower_name in ["powershell.exe", "pwsh.exe", "cmd.exe"] and not ("-enc" in lower_cmd or "frombase64" in lower_cmd):
        return ("DEV_ENVIRONMENT", "Interactive Command Line Shell / Terminal Session", "USER_MANAGED_SHELL")

    # 4. Standard Productivity & Utilities
    if "chrome" in lower_name:
        return ("PRODUCTIVITY_APP", "Google Chrome Web Browser Process", "BENIGN_USER_APP")
    if "msedge" in lower_name:
        return ("PRODUCTIVITY_APP", "Microsoft Edge Web Browser Process", "BENIGN_USER_APP")
    if "wallpaper64.exe" in lower_name:
        return ("PRODUCTIVITY_APP", "Wallpaper Engine Animated Desktop Utility", "BENIGN_USER_APP")
    if "xbox" in lower_name:
        return ("PRODUCTIVITY_APP", "Xbox Gaming Framework Application", "BENIGN_USER_APP")
    if "nitrosense" in lower_name or "acerservice" in lower_cmd or "acer" in lower_name:
        return ("PRODUCTIVITY_APP", "Hardware OEM Telemetry & Thermal Control Utility", "BENIGN_OEM_SERVICE")
    if "nvidia" in lower_name:
        return ("PRODUCTIVITY_APP", "NVIDIA Display Driver / GPU Management Overlay", "BENIGN_GPU_SERVICE")

    # Default fallback
    return ("USER_BACKGROUND", f"Application / Service: {name}", "UNCLASSIFIED")


class TerminateProcessRequest(BaseModel):
    pid: int = Field(..., description="Process ID to terminate")
    force: bool = Field(default=True, description="Whether to force termination")
    reason: Optional[str] = Field(default="SOC Analyst Mitigation via AI Copilot", description="Audit justification")


class AnalyzeProcessRequest(BaseModel):
    pid: int = Field(..., description="Process ID to analyze")
    model: Optional[str] = "openai/gpt-oss-120b"


def _assess_process_suspicion(name: str, cmdline: str, cpu_percent: float, memory_mb: float, pid: int = 0) -> tuple[bool, List[str], str, str]:
    """
    Heuristic assessment of genuine adversary activity in a running process.
    Does NOT flag high CPU as malware — legitimate servers, compilers, and browsers consume CPU.
    """
    reasons = []
    category, functional_role, safety_tag = categorize_process(name, cmdline, pid)

    # Protected or verified platform/OS processes are never categorized as suspicious
    if category in ["RAGSEC_PLATFORM", "SYSTEM_INFRASTRUCTURE"]:
        return (False, [], category, functional_role)

    lower_name = name.lower()
    lower_cmd = cmdline.lower()

    # 1. PowerShell suspicious flags (obfuscation & stealth evasion)
    if "powershell" in lower_name or "pwsh" in lower_name:
        if "-enc" in lower_cmd or "frombase64string" in lower_cmd:
            reasons.append("Base64 encoded command execution in PowerShell (-EncodedCommand)")
        if "-w hidden" in lower_cmd or "-windowstyle hidden" in lower_cmd:
            reasons.append("Stealth execution: Hidden PowerShell window style")
        if "bypass" in lower_cmd and ("downloadstring" in lower_cmd or "invoke-webrequest" in lower_cmd):
            reasons.append("ExecutionPolicy bypass combined with remote payload download")

    # 2. Known adversary attack tools
    known_tools = ["mimikatz", "nc.exe", "ncat.exe", "vssadmin delete", "bitsadmin /transfer"]
    for t in known_tools:
        if t in lower_name or t in lower_cmd:
            reasons.append(f"Adversary tool invocation detected: {t}")

    # 3. Controlled replicator / active sandbox threat scripts
    if "threat_worker" in lower_cmd or "unbounded_replicator" in lower_cmd or "ransom_script.ps1" in lower_cmd:
        reasons.append("Active malware simulation / replication script")

    # 4. Spawning from Temp with non-installer name
    if ("appdata\\local\\temp" in lower_cmd or "\\temp\\" in lower_cmd) and lower_name.endswith(".exe"):
        if lower_name not in ["python.exe", "node.exe", "installer.exe", "setup.exe", "git.exe"]:
            reasons.append("Standalone unverified binary executing from temporary directory")

    is_suspicious = len(reasons) > 0
    final_category = "SUSPICIOUS" if is_suspicious else category
    return (is_suspicious, reasons, final_category, functional_role)


@router.get("")
def list_running_processes(
    limit: int = Query(default=80, ge=1, le=300),
    filter: str = Query(default="all", description="all | suspicious | high_cpu"),
    search: Optional[str] = Query(default=None, description="Search by name, PID, or command line"),
    target_host: Optional[str] = Query(default="Local Endpoint", description="Target host identity")
) -> Dict[str, Any]:
    """
    Returns active running processes with resource usage, command lines,
    functional role classification, and behavioral threat heuristics.
    """
    process_list = []
    suspicious_count = 0

    for proc in psutil.process_iter(['pid', 'name', 'status', 'cpu_percent', 'memory_info', 'create_time']):
        try:
            info = proc.info
            pid = info['pid']
            name = info['name'] or f"proc_{pid}"

            if pid == 0 and not search:
                continue

            # Command line inspection
            cmdline = ""
            try:
                cmd_parts = proc.cmdline()
                cmdline = " ".join(cmd_parts) if cmd_parts else ""
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                cmdline = f"[{name}] (System Process / Elevated Token)"

            mem_info = info.get('memory_info')
            mem_mb = round((mem_info.rss / (1024 * 1024)), 1) if mem_info else 0.0
            cpu_pct = round(info.get('cpu_percent') or 0.0, 1)

            # Functional role & threat classification
            is_suspicious, reasons, category, functional_role = _assess_process_suspicion(name, cmdline, cpu_pct, mem_mb, pid)
            if is_suspicious:
                suspicious_count += 1

            # Search filter
            if search:
                search_q = search.lower().strip()
                if (search_q not in name.lower() and 
                    search_q not in str(pid) and 
                    search_q not in cmdline.lower() and
                    search_q not in functional_role.lower()):
                    continue

            # Type filter
            if filter == "suspicious" and not is_suspicious:
                continue
            if filter == "high_cpu" and cpu_pct < 10.0:
                continue

            created_dt = ""
            try:
                if info.get('create_time'):
                    created_dt = datetime.datetime.fromtimestamp(info['create_time']).strftime("%H:%M:%S")
            except Exception:
                pass

            can_terminate = (
                pid not in PROTECTED_PIDS and 
                name.lower() not in PROTECTED_PROCESS_NAMES and 
                not is_ragsec_platform_process(name, cmdline, pid)
            )

            process_list.append({
                "pid": pid,
                "name": name,
                "status": info.get('status') or "running",
                "cpu_percent": cpu_pct,
                "memory_mb": mem_mb,
                "cmdline": cmdline[:300],
                "create_time": created_dt,
                "category": category,
                "functional_role": functional_role,
                "is_suspicious": is_suspicious,
                "suspicious_reasons": reasons,
                "can_terminate": can_terminate
            })

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    # Sort: platform services first, then suspicious, then CPU, then memory
    process_list.sort(key=lambda p: (
        p['category'] != "RAGSEC_PLATFORM",
        not p['is_suspicious'],
        -p['cpu_percent'],
        -p['memory_mb']
    ))

    return {
        "target_host": target_host,
        "total_active": len(process_list),
        "suspicious_count": suspicious_count,
        "processes": process_list[:limit]
    }


@router.get("/{pid}/deep-analysis")
def get_process_deep_analysis(pid: int):
    """
    Performs comprehensive deep forensic & functional analysis on a specific process PID.
    Differentiates between benign developer workloads, platform infrastructure, and true threats,
    and returns balanced multi-option remediation choices.
    """
    try:
        proc = psutil.Process(pid)
        name = proc.name()
        status = proc.status()
        
        cmdline = ""
        try:
            cmdline = " ".join(proc.cmdline())
        except Exception:
            cmdline = name

        exe_path = ""
        try:
            exe_path = proc.exe()
        except Exception:
            exe_path = "Access Restricted / System Protected"

        parent_info = "None"
        try:
            p = proc.parent()
            if p:
                parent_info = f"PID {p.pid} ({p.name()})"
        except Exception:
            pass

        cpu = round(proc.cpu_percent(interval=0.1), 1)
        mem_info = proc.memory_info()
        mem_mb = round(mem_info.rss / (1024 * 1024), 1)
        num_threads = proc.num_threads()

        listening_ports = []
        try:
            conns = proc.net_connections(kind="inet")
            for c in conns:
                if c.status == "LISTEN" and c.laddr:
                    listening_ports.append(f"{c.laddr.ip}:{c.laddr.port}")
        except Exception:
            pass

        is_suspicious, reasons, category, functional_role = _assess_process_suspicion(name, cmdline, cpu, mem_mb, pid)
        is_platform = is_ragsec_platform_process(name, cmdline, pid)

        # Build balanced technical verdict
        if is_platform:
            verdict = "VERIFIED_PLATFORM_CORE"
            verdict_text = "Verified RAGSec Platform Core Service. This process powers the SOC application and backend API."
            recommendation_type = "PROTECTED_DO_NOT_TERMINATE"
        elif category == "SYSTEM_INFRASTRUCTURE":
            verdict = "VERIFIED_OS_SUBSYSTEM"
            verdict_text = f"Legitimate Windows Operating System service: {functional_role}."
            recommendation_type = "OS_MANAGED"
        elif is_suspicious:
            verdict = "SUSPICIOUS_ANOMALY"
            verdict_text = f"Anomalous behavior identified: {'; '.join(reasons)}."
            recommendation_type = "CONTAINMENT_RECOMMENDED"
        else:
            verdict = "BENIGN_USER_WORKLOAD"
            verdict_text = f"Legitimate application / development workload ({functional_role}). High compute usage indicates active processing, not malicious intent."
            recommendation_type = "MONITOR_AND_OPTIMIZE"

        return {
            "pid": pid,
            "name": name,
            "exe_path": exe_path,
            "parent": parent_info,
            "cmdline": cmdline,
            "status": status,
            "cpu_percent": cpu,
            "memory_mb": mem_mb,
            "num_threads": num_threads,
            "listening_ports": listening_ports,
            "category": category,
            "functional_role": functional_role,
            "verdict": verdict,
            "verdict_text": verdict_text,
            "is_suspicious": is_suspicious,
            "reasons": reasons,
            "is_platform": is_platform,
            "can_terminate": not is_platform and pid not in PROTECTED_PIDS and name.lower() not in PROTECTED_PROCESS_NAMES,
            "remediation_options": [
                {
                    "option": "A",
                    "title": "Allow & Baseline",
                    "action": "MONITOR",
                    "description": "Maintain active execution, record process resource baseline, and observe CPU/network trends."
                },
                {
                    "option": "B",
                    "title": "Resource Throttling",
                    "action": "THROTTLE",
                    "command": f"(Get-Process -Id {pid}).PriorityClass = 'BelowNormal'",
                    "description": "Lower CPU priority to prevent host resource starvation while keeping service functional."
                },
                {
                    "option": "C",
                    "title": "Network Policy Verification",
                    "action": "NETWORK_AUDIT",
                    "command": f"Get-NetTCPConnection -OwningProcess {pid}",
                    "description": "Verify socket bindings and restrict inbound/outbound firewall rules if necessary."
                },
                {
                    "option": "D",
                    "title": "Forensic Snapshot",
                    "action": "MEMORY_DUMP",
                    "command": f"procdump.exe -ma {pid} proc_{pid}_dump.dmp",
                    "description": "Capture full process memory dump for offline reverse engineering or volatility analysis."
                },
                {
                    "option": "E",
                    "title": "Controlled Termination",
                    "action": "TERMINATE",
                    "command": f"Stop-Process -Id {pid} -Force",
                    "description": "Forcibly halt execution (only recommended if confirmed rogue, hung, or unneeded).",
                    "is_destructive": True,
                    "disabled": is_platform or pid in PROTECTED_PIDS
                }
            ]
        }

    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail=f"Process PID {pid} not found (may have exited).")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inspecting PID {pid}: {str(e)}")


@router.post("/terminate")
def terminate_process(req: TerminateProcessRequest):
    """
    Forcibly halts a running process by PID, registers an immutable audit event,
    and updates the SOC mitigation history. Prevents self-termination of RAGSec.
    """
    pid = req.pid

    # 1. Protection check for OS processes
    if pid in PROTECTED_PIDS:
        raise HTTPException(status_code=403, detail=f"Refusing to terminate protected system process PID {pid}.")

    try:
        proc = psutil.Process(pid)
        proc_name = proc.name()
        cmdline = " ".join(proc.cmdline()) if proc.cmdline() else proc_name

        if proc_name.lower() in PROTECTED_PROCESS_NAMES:
            raise HTTPException(
                status_code=403, 
                detail=f"Refusing to terminate critical OS subsystem process '{proc_name}' (PID: {pid})."
            )

        # 2. Protection check for RAGSec platform itself
        if is_ragsec_platform_process(proc_name, cmdline, pid):
            raise HTTPException(
                status_code=403,
                detail=f"Safety Lock: Refusing to terminate RAGSec platform process '{proc_name}' (PID: {pid}). "
                       f"This process powers the active SOC Web Console and FastAPI neural engine."
            )
        
        # 3. Terminate process
        proc.terminate()
        try:
            proc.wait(timeout=2.0)
        except psutil.TimeoutExpired:
            proc.kill()

        # 4. Log audit event
        audit_service.log_event(
            actor="SOC_ANALYST_COPILOT",
            action="PROCESS_TERMINATION",
            target=f"PID {pid} ({proc_name})",
            result=f"SUCCESS: Process forcibly terminated. Justification: {req.reason}",
            evidence_ref=f"cmdline: {cmdline[:120]}"
        )

        # 5. Save mitigation action record
        action_id = f"MIT-PROC-{pid}"
        save_record("mitigations", action_id, {
            "id": action_id,
            "incident_id": f"INC-PROC-{pid}",
            "action_type": "PROCESS_TERMINATION",
            "target_device_id": "Local Endpoint",
            "description": f"Forcibly terminated process {proc_name} (PID: {pid}). {req.reason}",
            "status": MitigationStatus.EXECUTED.value,
            "verification_notes": f"Process terminated successfully via psutil SIGKILL at {datetime.datetime.now().isoformat()}"
        })

        return {
            "status": "TERMINATED",
            "pid": pid,
            "name": proc_name,
            "message": f"Process '{proc_name}' (PID: {pid}) has been terminated successfully.",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    except psutil.NoSuchProcess:
        return {
            "status": "ALREADY_TERMINATED",
            "pid": pid,
            "name": "Unknown",
            "message": f"Process PID {pid} is no longer running (already terminated or exited).",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    except psutil.AccessDenied:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Elevate RAGSec privileges (RunAs Administrator) to terminate PID {pid}."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to terminate process PID {pid}: {str(e)}")


def get_top_processes_summary(limit: int = 10) -> str:
    """Helper used by AI Copilot to inject live process telemetry and platform self-awareness into LLM context."""
    platform_procs = []
    suspicious_procs = []
    active_procs = []

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            info = proc.info
            pid = info['pid']
            name = info['name'] or "unknown"
            if pid == 0:
                continue

            cmdline = ""
            try:
                cmd_parts = proc.cmdline()
                cmdline = " ".join(cmd_parts) if cmd_parts else name
            except Exception:
                cmdline = name

            cpu = round(info.get('cpu_percent') or 0.0, 1)
            mem = round((info['memory_info'].rss / (1024 * 1024)), 1) if info.get('memory_info') else 0.0

            is_susp, reasons, category, functional_role = _assess_process_suspicion(name, cmdline, cpu, mem, pid)
            entry = f"PID {pid} ({name}) | CPU: {cpu}% | RAM: {mem}MB | Role: {functional_role} | Cmd: {cmdline[:90]}"

            if category == "RAGSEC_PLATFORM":
                platform_procs.append(f"PROTECTED PLATFORM: {entry} [CORE SYSTEM COMPONENT - DO NOT TERMINATE]")
            elif is_susp:
                suspicious_procs.append(f"⚠️ SUSPICIOUS: {entry} [Flags: {', '.join(reasons)}]")
            elif cpu > 5.0 or len(active_procs) < limit:
                active_procs.append(entry)
        except Exception:
            continue

    summary_lines = []
    if platform_procs:
        summary_lines.append("RAGSec Host Platform Core (Verified Legitimate Infrastructure):")
        summary_lines.extend(platform_procs[:3])

    if suspicious_procs:
        summary_lines.append("Flagged Suspicious Processes (Verified Threat Indicators):")
        summary_lines.extend(suspicious_procs[:4])

    summary_lines.append("Top Active Processes on Host:")
    summary_lines.extend(active_procs[:limit])

    return "\n".join(summary_lines)
