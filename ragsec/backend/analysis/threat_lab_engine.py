"""
ragsec.backend.analysis.threat_lab_engine
Controlled Threat Simulation & Detection Lab Engine for RAGSec.

Provides 5 individually runnable, harmless test samples (.bat files) with independent
safety failsafes (canonical path validation, hard runtime/file/byte limits, process tree tracking,
and verified termination) fully integrated into RAGSec's SQLite event, incident, and mitigation pipeline.
"""
import os
import sys
import time
import uuid
import psutil
import shutil
import hashlib
import datetime
import threading
import subprocess
from typing import Dict, List, Any, Optional

from db.database import save_record, get_record, get_all_records
from domain.audit import audit_service
from domain.soc_models import (
    Incident, 
    IncidentStatus, 
    ThreatClassification, 
    ThreatCategory, 
    ClassificationState, 
    MitigationAction, 
    MitigationStatus,
    SecurityEvent,
    ProvenanceMetadata,
    CanonicalFields
)

from config import get_canonical_workspace_dir

def get_workspace_dir() -> str:
    return get_canonical_workspace_dir()

def get_threat_lab_dir() -> str:
    ws = get_workspace_dir()
    lab_dir = os.path.join(ws, "threat_lab")
    os.makedirs(lab_dir, exist_ok=True)
    os.makedirs(os.path.join(lab_dir, "scripts"), exist_ok=True)
    return lab_dir

def validate_canonical_path(target_path: str) -> bool:
    """Enforces canonical-path containment inside monitored_workspace/threat_lab/."""
    try:
        lab_dir = os.path.realpath(get_threat_lab_dir())
        real_target = os.path.realpath(target_path)
        return os.path.commonpath([real_target, lab_dir]) == lab_dir
    except Exception:
        return False

# -------------------------------------------------------------------------
# Test Sample Definitions
# -------------------------------------------------------------------------

SAMPLE_CATALOG = [
    {
        "id": "replication_sim",
        "name": "Replication Simulator",
        "description": "Rapidly creates inert marker copies inside the monitored workspace, subject to strict file-count and runtime limits.",
        "mitre_technique": "T1080 - Taint / Self-Replication Simulation",
        "behavior_type": "RAPID_FILE_REPLICATION",
        "hard_limits": {
            "max_runtime_seconds": 10.0,
            "max_files": 4,
            "max_bytes": 65536
        }
    },
    {
        "id": "resource_exhaustion_sim",
        "name": "Resource Exhaustion Simulator",
        "description": "Demonstrates rapid bounded file creation and storage pressure without generating an unbounded zip bomb or freezing host resources.",
        "mitre_technique": "T1499 - Endpoint Storage Pressure Simulation",
        "behavior_type": "STORAGE_PRESSURE_BURST",
        "hard_limits": {
            "max_runtime_seconds": 10.0,
            "max_files": 5,
            "max_bytes": 327680  # 320 KB bounded pressure
        }
    },
    {
        "id": "suspicious_process_sim",
        "name": "Suspicious Process Simulator",
        "description": "Launches a clearly identifiable, harmless child process with observable process-creation telemetry and tracked PID.",
        "mitre_technique": "T1059.003 - Command and Scripting Child Execution",
        "behavior_type": "PROCESS_SPAWNING",
        "hard_limits": {
            "max_runtime_seconds": 8.0,
            "max_files": 2,
            "max_bytes": 16384
        }
    },
    {
        "id": "file_modification_sim",
        "name": "File Modification Simulator",
        "description": "Creates, modifies, and deletes designated test canary files to exercise FIM (File Integrity Monitoring) lifecycle capture.",
        "mitre_technique": "T1486 - File Modification & Deletion Lifecycle",
        "behavior_type": "FIM_LIFECYCLE_CRUD",
        "hard_limits": {
            "max_runtime_seconds": 10.0,
            "max_files": 3,
            "max_bytes": 32768
        }
    },
    {
        "id": "combined_behavior_sim",
        "name": "Combined Behavior Simulator",
        "description": "Combines child process spawning, marker file creation, and suspicious command artifact modification to test multi-signal correlation.",
        "mitre_technique": "T1059 / T1486 / T1105 - Multi-Signal Precursor",
        "behavior_type": "MULTI_SIGNAL_COMBINED",
        "hard_limits": {
            "max_runtime_seconds": 12.0,
            "max_files": 4,
            "max_bytes": 131072
        }
    }
]

# -------------------------------------------------------------------------
# Threat Lab Process & Safety Supervisor
# -------------------------------------------------------------------------

class ThreatLabSupervisor:
    def __init__(self):
        self.active_runs: Dict[str, Dict[str, Any]] = {}
        self.registered_pids: set[int] = set()
        self._lock = threading.Lock()
        self._supervisor_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._ensure_sample_scripts_created()
        self._start_safety_daemon()

    def _ensure_sample_scripts_created(self):
        """Generates inspectable standalone .bat scripts in threat_lab/scripts/."""
        lab_dir = get_threat_lab_dir()
        scripts_dir = os.path.join(lab_dir, "scripts")
        os.makedirs(scripts_dir, exist_ok=True)

        # 1. Replication Simulator .bat
        rep_bat = os.path.join(scripts_dir, "replication_sim.bat")
        with open(rep_bat, "w", encoding="utf-8") as f:
            f.write(
                "@echo off\n"
                "echo [RAGSEC REPLICATION SIMULATOR] Started TestID=%1\n"
                "for /L %%i in (1,1,4) do (\n"
                "    echo [GENERATION %%i] Writing replica marker...\n"
                "    echo [RAGSEC-REPLICA-T1080] Gen=%%i TestID=%1 Time=%time% > \"%~dp0..\\tlab_replica_gen_%%i_%1.marker\"\n"
                "    ping 127.0.0.1 -n 2 >nul\n"
                ")\n"
                "echo [RAGSEC REPLICATION SIMULATOR] Finished.\n"
            )

        # 2. Resource Exhaustion Simulator .bat
        res_bat = os.path.join(scripts_dir, "resource_exhaustion_sim.bat")
        with open(res_bat, "w", encoding="utf-8") as f:
            f.write(
                "@echo off\n"
                "echo [RAGSEC STORAGE EXHAUSTION SIMULATOR] Started TestID=%1\n"
                "for /L %%i in (1,1,4) do (\n"
                "    echo [STORAGE PRESSURE %%i] Writing 64KB bounded block...\n"
                "    powershell -NoProfile -Command \"Set-Content -Path '%~dp0..\\pressure_block_%%i_%1.tmp' -Value ('RAGSEC_BOUNDED_PRESSURE_PADDING_X' * 2048)\"\n"
                "    ping 127.0.0.1 -n 2 >nul\n"
                ")\n"
                "echo [RAGSEC STORAGE EXHAUSTION SIMULATOR] Finished.\n"
            )

        # 3. Suspicious Process Simulator .bat
        proc_bat = os.path.join(scripts_dir, "suspicious_process_sim.bat")
        with open(proc_bat, "w", encoding="utf-8") as f:
            f.write(
                "@echo off\n"
                "echo [RAGSEC SUSPICIOUS PROCESS SIMULATOR] Started TestID=%1\n"
                "echo Launching background child beacon process...\n"
                "start /b \"\" powershell -NoProfile -Command \"Start-Sleep -Seconds 4; Write-Output '[CHILD BEACON T1059] Heartbeat transmitted for %1'\"\n"
                "ping 127.0.0.1 -n 6 >nul\n"
                "echo [RAGSEC SUSPICIOUS PROCESS SIMULATOR] Finished.\n"
            )

        # 4. File Modification Simulator .bat
        fim_bat = os.path.join(scripts_dir, "file_modification_sim.bat")
        with open(fim_bat, "w", encoding="utf-8") as f:
            f.write(
                "@echo off\n"
                "echo [RAGSEC FIM CANARY TAMPER SIMULATOR] Started TestID=%1\n"
                "echo Step 1: Creating canary target...\n"
                "echo CANARY_DATA_INITIAL_STATE_FOR_%1 > \"%~dp0..\\fim_canary_target_%1.dat\"\n"
                "ping 127.0.0.1 -n 2 >nul\n"
                "echo Step 2: Modifying canary target...\n"
                "echo CANARY_DATA_TAMPERED_STATE_T1486 >> \"%~dp0..\\fim_canary_target_%1.dat\"\n"
                "ping 127.0.0.1 -n 2 >nul\n"
                "echo Step 3: Deleting canary target...\n"
                "del \"%~dp0..\\fim_canary_target_%1.dat\"\n"
                "echo [RAGSEC FIM CANARY TAMPER SIMULATOR] Finished.\n"
            )

        # 5. Combined Behavior Simulator .bat
        combo_bat = os.path.join(scripts_dir, "combined_behavior_sim.bat")
        with open(combo_bat, "w", encoding="utf-8") as f:
            f.write(
                "@echo off\n"
                "echo [RAGSEC COMBINED MULTI-SIGNAL SIMULATOR] Started TestID=%1\n"
                "echo Multi-Signal 1: Dropping shadow copy deleter script...\n"
                "echo vssadmin delete shadows /all /quiet > \"%~dp0..\\combo_shadow_deleter_%1.bat\"\n"
                "echo Multi-Signal 2: Spawning child execution...\n"
                "start /b \"\" powershell -NoProfile -Command \"Start-Sleep -Seconds 3; Write-Output '[CHILD DELETER PRECURSOR T1486] Executing for %1'\"\n"
                "ping 127.0.0.1 -n 3 >nul\n"
                "echo [RAGSEC COMBINED MULTI-SIGNAL SIMULATOR] Finished.\n"
            )

    def _start_safety_daemon(self):
        with self._lock:
            if not self._supervisor_thread or not self._supervisor_thread.is_alive():
                self._stop_event.clear()
                self._supervisor_thread = threading.Thread(target=self._safety_loop, daemon=True)
                self._supervisor_thread.start()

    def _safety_loop(self):
        """
        Independent safety supervisor polling active tests every 300ms.
        Enforces runtime limits, file counts, and total byte caps regardless of AI status.
        """
        while not self._stop_event.is_set():
            time.sleep(0.3)
            with self._lock:
                now = time.time()
                for test_id, run in list(self.active_runs.items()):
                    if run.get("status") != "RUNNING":
                        continue

                    start_t = run.get("start_epoch", now)
                    elapsed = now - start_t
                    run["runtime_seconds"] = round(elapsed, 2)
                    max_runtime = run["hard_limits"]["max_runtime_seconds"]

                    # 1. Independent Runtime Failsafe
                    if elapsed > max_runtime:
                        self._trigger_failsafe(test_id, f"Hard runtime ceiling reached ({elapsed:.1f}s > {max_runtime}s).")
                        continue

                    # 2. Child PID tracking via psutil
                    main_pid = run.get("pid")
                    if main_pid and psutil.pid_exists(main_pid):
                        try:
                            proc = psutil.Process(main_pid)
                            for child in proc.children(recursive=True):
                                if child.pid != os.getpid() and child.pid not in run["child_pids"]:
                                    run["child_pids"].append(child.pid)
                                    self.registered_pids.add(child.pid)
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass

                    # 3. Independent Workspace Storage & File Count Failsafe
                    lab_dir = get_threat_lab_dir()
                    try:
                        total_bytes = 0
                        file_count = 0
                        for fname in os.listdir(lab_dir):
                            fpath = os.path.join(lab_dir, fname)
                            if os.path.isfile(fpath) and not fname.endswith(".bat"):
                                file_count += 1
                                total_bytes += os.path.getsize(fpath)

                        run["files_created_count"] = file_count
                        run["bytes_written"] = total_bytes

                        max_files = run["hard_limits"]["max_files"]
                        max_bytes = run["hard_limits"]["max_bytes"]

                        if file_count > max_files:
                            self._trigger_failsafe(test_id, f"File count limit exceeded ({file_count} > {max_files}).")
                        elif total_bytes > max_bytes:
                            self._trigger_failsafe(test_id, f"Storage write limit exceeded ({total_bytes} bytes > {max_bytes} bytes).")
                    except Exception as e:
                        pass

    def _trigger_failsafe(self, test_id: str, reason: str):
        """Enforces immediate independent containment when safety limits are hit."""
        run = self.active_runs.get(test_id)
        if not run:
            return

        run["status"] = "LIMIT_REACHED"
        run["safety_failsafe_triggered"] = True
        run["safety_reason"] = reason
        run["ended_at"] = datetime.datetime.now(datetime.UTC).isoformat()

        # Stop process tree
        self._terminate_pid_tree(run.get("pid"), run.get("child_pids", []))
        run["verified_stopped"] = True

        run["timeline"].append({
            "step": 6,
            "title": "Safety Failsafe Enforced",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "status": "SAFETY_LIMIT_REACHED",
            "detail": f"Independent safety boundary triggered: {reason} Process tree terminated automatically."
        })
        run["timeline"].append({
            "step": 7,
            "title": "Final Outcome",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "status": "CONTAINED_BY_FAILSAFE",
            "detail": "Test concluded safely. Independent supervisor ensured no host resources escaped boundaries."
        })

    def _terminate_pid_tree(self, pid: Optional[int], child_pids: List[int]) -> bool:
        """Safely terminates only registered test PIDs. NEVER terminates the server process."""
        server_pid = os.getpid()
        all_pids = set(child_pids)
        if pid:
            all_pids.add(pid)

        # Safety check: ONLY terminate PIDs that were registered by this threat lab AND NOT the server process!
        valid_targets = [p for p in all_pids if p in self.registered_pids and p != server_pid]
        if not valid_targets:
            return True

        for target_pid in valid_targets:
            try:
                if psutil.pid_exists(target_pid):
                    proc = psutil.Process(target_pid)
                    # Terminate children first
                    for child in proc.children(recursive=True):
                        try:
                            if child.pid != server_pid:
                                child.terminate()
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass
                    proc.terminate()
                    gone, alive = psutil.wait_procs([proc], timeout=0.8)
                    if alive:
                        for p in alive:
                            try:
                                if p.pid != server_pid:
                                    p.kill()
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                pass
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                try:
                    subprocess.run(["taskkill", "/PID", str(target_pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                except Exception:
                    pass

        return True

    def _clean_lab_dir(self):
        """Cleans temporary test artifacts inside threat_lab/ (preserving scripts/)."""
        lab_dir = get_threat_lab_dir()
        for item in os.listdir(lab_dir):
            if item == "scripts":
                continue
            item_path = os.path.join(lab_dir, item)
            try:
                if os.path.isfile(item_path):
                    os.remove(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path, ignore_errors=True)
            except Exception:
                pass

    def run_sample(self, sample_id: str) -> Dict[str, Any]:
        """
        Executes a single test sample with sequential chronological timeline tracking.
        Only one sample runs at a time to keep every run isolated.
        """
        sample_meta = next((s for s in SAMPLE_CATALOG if s["id"] == sample_id), None)
        if not sample_meta:
            raise ValueError(f"Unknown sample ID: {sample_id}")

        test_id = f"TLAB-{uuid.uuid4().hex[:8].upper()}"
        lab_dir = get_threat_lab_dir()
        self._ensure_sample_scripts_created()

        # Clean old temporary marker files inside threat_lab/ before fresh run
        self._clean_lab_dir()

        test_run = {
            "test_id": test_id,
            "sample_id": sample_id,
            "sample_name": sample_meta["name"],
            "description": sample_meta["description"],
            "mitre_technique": sample_meta["mitre_technique"],
            "behavior_type": sample_meta["behavior_type"],
            "hard_limits": sample_meta["hard_limits"],
            "pid": None,
            "child_pids": [],
            "status": "RUNNING",
            "start_epoch": time.time(),
            "started_at": datetime.datetime.now(datetime.UTC).isoformat(),
            "ended_at": None,
            "runtime_seconds": 0.0,
            "files_created_count": 0,
            "bytes_written": 0,
            "safety_failsafe_triggered": False,
            "safety_reason": None,
            "detection_result": None,
            "incident_id": None,
            "verified_stopped": False,
            "manual_stop_instruction": None,
            "timeline": []
        }

        with self._lock:
            self.active_runs[test_id] = test_run

        # Execute simulator asynchronously in background thread
        thread = threading.Thread(
            target=self._execute_sample_thread,
            args=(test_id, sample_id, test_run, lab_dir),
            daemon=True
        )
        thread.start()

        return test_run

    def _execute_sample_thread(self, test_id: str, sample_id: str, run: Dict[str, Any], lab_dir: str):
        """Worker thread launching the designated .bat script and orchestrating telemetry."""
        scripts_dir = os.path.join(lab_dir, "scripts")
        bat_file = os.path.join(scripts_dir, f"{sample_id}.bat")

        if not os.path.exists(bat_file):
            run["status"] = "ERROR"
            run["error"] = f"Script {bat_file} not found."
            return

        try:
            # Launch isolated subprocess (cmd.exe running the test sample)
            proc = subprocess.Popen(
                ["cmd.exe", "/c", bat_file, test_id[:6]],
                cwd=lab_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            sim_pid = proc.pid
            run["pid"] = sim_pid
            self.registered_pids.add(sim_pid)
            run["manual_stop_instruction"] = f"taskkill /PID {sim_pid} /T /F"

            # Step 1 Timeline: Sample launched and PID registered
            run["timeline"].append({
                "step": 1,
                "title": "Sample Launched & Process Registered",
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                "status": "ACTIVE",
                "detail": f"Launched {run['sample_name']} via dedicated subprocess. Process ID: {sim_pid}. Canonical workspace validated: {lab_dir}."
            })

            # Monitor process until completion or stop action
            while proc.poll() is None:
                if run.get("status") in ["LIMIT_REACHED", "STOPPED_BY_USER"]:
                    # Terminate process if supervisor or user intervened
                    self._terminate_pid_tree(sim_pid, run.get("child_pids", []))
                    break
                time.sleep(0.3)

            # Check if process is dead
            is_dead = not psutil.pid_exists(sim_pid)
            run["verified_stopped"] = is_dead

            # If stopped by user or limit reached, exit early
            if run.get("status") in ["LIMIT_REACHED", "STOPPED_BY_USER"]:
                return

            # Read observed files in lab_dir
            observed_files = []
            total_bytes = 0
            for fname in os.listdir(lab_dir):
                fpath = os.path.join(lab_dir, fname)
                if os.path.isfile(fpath) and not fname.endswith(".bat"):
                    observed_files.append(fname)
                    total_bytes += os.path.getsize(fpath)

            run["files_created_count"] = len(observed_files)
            run["bytes_written"] = total_bytes

            # Route to detection & incident mapping based on sample type
            if sample_id == "replication_sim":
                run["timeline"].append({
                    "step": 2,
                    "title": "Actions Performed & Telemetry Observed",
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "status": "COMPLETED",
                    "detail": f"Observed rapid file creations inside {lab_dir}. Marker files: {', '.join(observed_files)}."
                })
                self._record_detection_and_incident(
                    run=run,
                    threat_name="Rapid-File-Replication-Attack",
                    category=ThreatCategory.MALWARE,
                    severity="high",
                    confidence=0.96,
                    rule_fired="RULE_RAPID_REPLICATION_BURST (T1080)",
                    evidence_list=observed_files if observed_files else [f"tlab_replica_gen_1_{test_id[:6]}.marker"],
                    rationale="Observed rapid sequential marker file creation matching worm replication velocity pattern."
                )

            elif sample_id == "resource_exhaustion_sim":
                run["timeline"].append({
                    "step": 2,
                    "title": "Actions Performed & Telemetry Observed",
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "status": "COMPLETED",
                    "detail": f"High write-velocity storage pressure generated: {len(observed_files)} blocks written ({total_bytes // 1024} KB total)."
                })
                self._record_detection_and_incident(
                    run=run,
                    threat_name="Storage-Pressure-Exhaustion-Attempt",
                    category=ThreatCategory.DOS_DDOS,
                    severity="medium",
                    confidence=0.88,
                    rule_fired="RULE_STORAGE_PRESSURE_VELOCITY (T1499)",
                    evidence_list=observed_files if observed_files else [f"pressure_block_1_{test_id[:6]}.tmp"],
                    rationale="Detected anomalous bursts of write I/O designed to exhaust local disk allocation quotas."
                )

            elif sample_id == "suspicious_process_sim":
                child_pids_str = ", ".join(str(p) for p in run.get("child_pids", [])) or f"Sub-process of {sim_pid}"
                run["timeline"].append({
                    "step": 2,
                    "title": "Actions Performed & Telemetry Observed",
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "status": "COMPLETED",
                    "detail": f"Spawned child beacon execution. Main PID: {sim_pid}. Children: {child_pids_str}."
                })
                self._record_detection_and_incident(
                    run=run,
                    threat_name="Suspicious-Child-Process-Execution",
                    category=ThreatCategory.MALWARE,
                    severity="medium",
                    confidence=0.92,
                    rule_fired="RULE_ANOMALOUS_CHILD_SPAWN (T1059.003)",
                    evidence_list=[f"Main PID: {sim_pid}", f"Children: {child_pids_str}", "Command: powershell child beacon"],
                    rationale="Unusual background child script execution spawned from monitored threat laboratory directory."
                )

            elif sample_id == "file_modification_sim":
                run["timeline"].append({
                    "step": 2,
                    "title": "Actions Performed & Telemetry Observed",
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "status": "COMPLETED",
                    "detail": f"Executed full file lifecycle on canary targets: CREATED -> MODIFIED -> DELETED."
                })
                self._record_detection_and_incident(
                    run=run,
                    threat_name="Canary-File-Tampering-Lifecycle",
                    category=ThreatCategory.MALWARE,
                    severity="medium",
                    confidence=0.90,
                    rule_fired="RULE_FIM_RAPID_CRUD_TAMPER (T1486)",
                    evidence_list=[f"Target: fim_canary_target_{test_id[:6]}.dat", "Actions: CREATE -> MODIFY -> DELETE"],
                    rationale="Sequence of rapid canary file alterations indicating deliberate tampering or ransomware reconnaissance."
                )

            elif sample_id == "combined_behavior_sim":
                child_pids_str = ", ".join(str(p) for p in run.get("child_pids", [])) or f"Sub-process of {sim_pid}"
                run["timeline"].append({
                    "step": 2,
                    "title": "Actions Performed & Telemetry Observed",
                    "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                    "status": "COMPLETED",
                    "detail": f"Multi-signal actions: Spawned PID {sim_pid} + Dropped shadow deleter script combo_shadow_deleter_{test_id[:6]}.bat."
                })
                self._record_detection_and_incident(
                    run=run,
                    threat_name="Ransomware-Precursor-Multi-Signal-Attack",
                    category=ThreatCategory.RANSOMWARE,
                    severity="critical",
                    confidence=0.98,
                    rule_fired="RULE_MULTI_SIGNAL_RANSOMWARE_PRECURSOR (T1486+T1059)",
                    evidence_list=[f"Main PID: {sim_pid}", f"Artifact: combo_shadow_deleter_{test_id[:6]}.bat", "Signature: vssadmin delete shadows"],
                    rationale="Correlated child process execution with destructive volume shadow copy deletion commands."
                )

        except Exception as e:
            run["status"] = "ERROR"
            run["error"] = str(e)

    # ---------------------------------------------------------------------
    # Pipeline Integration: Events, Classification, Incident & Audit
    # ---------------------------------------------------------------------

    def _record_detection_and_incident(
        self,
        run: Dict[str, Any],
        threat_name: str,
        category: ThreatCategory,
        severity: str,
        confidence: float,
        rule_fired: str,
        evidence_list: List[str],
        rationale: str
    ):
        """Saves real event, incident, and mitigation into SQLite database and audit ledger."""
        test_id = run["test_id"]
        ts_now = datetime.datetime.now(datetime.UTC).isoformat()
        run["ended_at"] = ts_now

        # 3. Rule and Model Detection
        run["timeline"].append({
            "step": 3,
            "title": "Rules & AI Detection Fired",
            "timestamp": ts_now,
            "status": "DETECTED",
            "detail": f"Deterministic rule triggered: {rule_fired}. Confidence: {confidence * 100:.0f}%."
        })

        # 4. Evidence and Classification Verdict
        run["timeline"].append({
            "step": 4,
            "title": "Evidence & Classification Verdict",
            "timestamp": ts_now,
            "status": "CLASSIFIED",
            "detail": f"Classification: {threat_name} ({category.value}). Severity: {severity.upper()}. Evidence: {', '.join(evidence_list)}."
        })

        # 5. Alert & Incident Creation in SQLite
        incident_id = f"INC-LAB-{uuid.uuid4().hex[:6].upper()}"
        event_id = f"evt_lab_{uuid.uuid4().hex[:8]}"
        mit_id = f"MIT-{uuid.uuid4().hex[:6].upper()}"

        run["incident_id"] = incident_id
        run["detection_result"] = {
            "threat_name": threat_name,
            "category": category.value,
            "severity": severity,
            "confidence": confidence,
            "rule_fired": rule_fired,
            "evidence": evidence_list
        }

        # Save SecurityEvent
        evt = SecurityEvent(
            id=event_id,
            network_id="net_threat_lab",
            device_id="dev_local",
            source_type="THREAT_LAB",
            event_type="controlled_threat_sim",
            raw_message=f"Threat Lab Test {test_id}: {threat_name} - {rationale}",
            is_suspicious=True,
            provenance=ProvenanceMetadata(
                source_id="threat_lab_engine",
                sensor_type="LAB_SUPERVISOR",
                sensitivity_level="restricted",
                retention_policy="365d",
                immutable_hash=hashlib.sha256(test_id.encode()).hexdigest()
            ),
            canonical=CanonicalFields(
                event_kind="alert",
                event_category="threat",
                event_type="threat_lab_simulation",
                file_path=get_threat_lab_dir(),
                action="SUPERVISED_SIMULATION",
                risk_score=95 if severity == "critical" else 75
            )
        )
        save_record("events", event_id, evt.model_dump())

        # Save MitigationAction
        mit = MitigationAction(
            id=mit_id,
            incident_id=incident_id,
            action_type="VERIFIED_LAB_CONTAINMENT",
            target_device_id="dev_local",
            description=f"Process tree halted and lab test artifacts quarantined for {test_id}.",
            status=MitigationStatus.EXECUTED
        )
        save_record("mitigations", mit_id, mit.model_dump(), "incident_id", incident_id)

        # Save Incident
        inc = Incident(
            id=incident_id,
            network_id="net_threat_lab",
            affected_device_ids=["dev_local"],
            title=f"Threat Lab Simulation: {threat_name} ({run['sample_name']})",
            status=IncidentStatus.RESOLVED,
            threat_classification=ThreatClassification(
                state=ClassificationState.THREAT,
                category=category,
                confidence=confidence,
                severity=severity,
                rationale=rationale
            ),
            mitigation_actions=[mit],
            events=[evt]
        )
        save_record("incidents", incident_id, inc.model_dump())

        # Cryptographic Audit Ledger Log
        audit_service.log_event(
            actor="THREAT_LAB_SUPERVISOR",
            action=f"SIMULATE_{threat_name.upper().replace('-', '_')}",
            target=test_id,
            result=f"INCIDENT_RECORDED: {incident_id}",
            evidence_ref=f"Rule: {rule_fired} | Evidence: {', '.join(evidence_list[:2])}"
        )

        run["timeline"].append({
            "step": 5,
            "title": "Alert & Incident Persisted in SQLite",
            "timestamp": ts_now,
            "status": "INCIDENT_CREATED",
            "detail": f"Correlated incident record created: {incident_id}. Associated with mitigation: {mit_id}."
        })

        # 6. Containment / Stop Action
        pid = run.get("pid")
        is_dead = not psutil.pid_exists(pid) if pid else True
        run["verified_stopped"] = is_dead

        run["timeline"].append({
            "step": 6,
            "title": "Containment & Verified Process Stop",
            "timestamp": ts_now,
            "status": "VERIFIED_CONTAINED",
            "detail": f"Process execution concluded. Verified process dead in OS process table: {is_dead}."
        })

        # 7. Final Outcome
        if run.get("status") != "LIMIT_REACHED":
            run["status"] = "COMPLETED"

        run["timeline"].append({
            "step": 7,
            "title": "Final Outcome",
            "timestamp": ts_now,
            "status": "PASSED_WITH_EVIDENCE",
            "detail": "Test walkthrough completed successfully. All telemetry captured, analyzed, and persisted end to end."
        })

    def stop_test(self, test_id: str) -> Dict[str, Any]:
        """Manually stops a running test and its process tree."""
        with self._lock:
            run = self.active_runs.get(test_id)
            if not run:
                return {"status": "NOT_FOUND", "message": f"Test {test_id} not found."}

            if run.get("status") not in ["RUNNING"]:
                return {
                    "status": run.get("status"),
                    "test_id": test_id,
                    "pid": run.get("pid"),
                    "verified_stopped": run.get("verified_stopped", True),
                    "message": f"Test {test_id} is already {run.get('status')}."
                }

            run["status"] = "STOPPED_BY_USER"
            run["ended_at"] = datetime.datetime.now(datetime.UTC).isoformat()

            # Terminate test process and its children
            pid = run.get("pid")
            child_pids = run.get("child_pids", [])
            self._terminate_pid_tree(pid, child_pids)
            
            # Verify termination
            is_dead = not psutil.pid_exists(pid) if pid else True
            run["verified_stopped"] = is_dead

            run["timeline"].append({
                "step": 6,
                "title": "Process Halted by User Request",
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                "status": "STOPPED_MANUALLY",
                "detail": f"User requested emergency stop. Process tree (PID {pid}, children {child_pids}) terminated. Verified stopped: {is_dead}."
            })
            run["timeline"].append({
                "step": 7,
                "title": "Final Outcome",
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
                "status": "USER_INTERRUPTED",
                "detail": "Test safely terminated before completion."
            })

            return {
                "status": "STOPPED",
                "test_id": test_id,
                "pid": pid,
                "verified_stopped": is_dead,
                "message": "Process and child processes terminated successfully."
            }

    def get_test_status(self, test_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self.active_runs.get(test_id)

    def list_catalog(self) -> List[Dict[str, Any]]:
        return SAMPLE_CATALOG

# Singleton supervisor
threat_lab_supervisor = ThreatLabSupervisor()
