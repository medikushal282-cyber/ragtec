"""
ragsec.backend.analysis.active_threat_detector
Real Active Threat Detection, Interception, Process Termination, and Quarantine Containment Engine.
Actively inspects running worker threads, detects replication bursts and worm signatures,
forcibly halts the offending processes, permanently bans the attack, and quarantines all artifacts.
"""
import os
import shutil
import time
import uuid
import hashlib
import datetime
import threading
from typing import Dict, List, Any, Optional

from analysis.controlled_replicator import (
    replicator_manager, 
    get_sandbox_dir, 
    get_quarantine_dir, 
    get_workspace_dir,
    REPLICATOR_SIGNATURE
)
from db.database import save_record, get_all_records, get_record
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

class ActiveThreatDetector:
    def __init__(self):
        self.sentinel_enabled = True
        self.sentinel_thread: Optional[threading.Thread] = None
        self.sentinel_stop_event = threading.Event()
        self.last_scan_result: Optional[Dict[str, Any]] = None
        self.last_mitigation_result: Optional[Dict[str, Any]] = None
        self.mitigation_history: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def start_sentinel_daemon(self):
        """Starts real-time background interceptor sentinel."""
        with self._lock:
            if self.sentinel_thread and self.sentinel_thread.is_alive():
                return
            self.sentinel_stop_event.clear()
            self.sentinel_thread = threading.Thread(target=self._sentinel_loop, daemon=True)
            self.sentinel_thread.start()
            print("[ACTIVE DEFENSE SENTINEL] Real-time Interceptor Daemon Started.")

    def stop_sentinel_daemon(self):
        with self._lock:
            self.sentinel_stop_event.set()
            if self.sentinel_thread:
                self.sentinel_thread.join(timeout=1.0)
            print("[ACTIVE DEFENSE SENTINEL] Interceptor Daemon Stopped.")

    def _sentinel_loop(self):
        """Continuously inspects runtime for active replicating attacks every 1 second."""
        while not self.sentinel_stop_event.is_set():
            try:
                if self.sentinel_enabled:
                    status = replicator_manager.get_status()
                    # If thread is actively replicating or sandbox has replica files
                    if (status["is_running"] and status["current_generation"] >= 2) or (status["sandbox_file_count"] >= 2):
                        print("[SENTINEL ALERT] Active replication burst identified! Triggering autonomous interception...")
                        self.scan_and_mitigate(trigger_source="REALTIME_AUTONOMOUS_SENTINEL")
            except Exception as e:
                print(f"[SENTINEL EXCEPTION] {e}")

            time.sleep(1.0)

    def scan_and_mitigate(self, trigger_source: str = "MANUAL_SCAN") -> Dict[str, Any]:
        """
        Actively scans for running replicators and replica artifacts.
        If detected:
          1. Forcibly terminates the running thread/process.
          2. Permanently bans the thread and signature in the EDR database.
          3. Moves all replica files from the controlled space into the .quarantine enclave.
          4. Creates a real Incident and Mitigation record in SQLite.
          5. Cryptographically logs the audit entry.
        """
        with self._lock:
            sandbox_dir = get_sandbox_dir()
            quarantine_dir = get_quarantine_dir()
            rep_status = replicator_manager.get_status()

            # Find replica files in the sandbox
            replica_files = []
            if os.path.exists(sandbox_dir):
                for fname in os.listdir(sandbox_dir):
                    fpath = os.path.join(sandbox_dir, fname)
                    if os.path.isfile(fpath) and ("replica" in fname.lower() or fname.endswith(".marker")):
                        replica_files.append((fname, fpath))

            is_active_attack = rep_status["is_running"] or len(replica_files) > 0

            if not is_active_attack:
                # If a threat was just mitigated by the autonomous sentinel within the last 15 seconds, return that active verdict
                if self.last_mitigation_result:
                    mit_time = datetime.datetime.fromisoformat(self.last_mitigation_result["timestamp"])
                    if (datetime.datetime.now(datetime.UTC) - mit_time).total_seconds() < 15.0:
                        return self.last_mitigation_result

                res = {
                    "detected": False,
                    "status": "ALL_CLEAR",
                    "message": "No active replicating threads or unauthorized replications detected in monitored space.",
                    "scanned_at": datetime.datetime.now(datetime.UTC).isoformat()
                }
                self.last_scan_result = res
                return res

            # --- THREAT DETECTED: EXECUTE CONTAINMENT & BAN ---
            timestamp_iso = datetime.datetime.now(datetime.UTC).isoformat()
            ts_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

            # 1. Stop and ban the active thread
            ban_info = replicator_manager.ban_and_halt_threat(
                reason="Autonomous Active Threat Defense: Rapid Replication Attack Intercepted"
            )
            stopped_thread_id = rep_status.get("thread_id") or "THR-INDEPENDENT"
            process_name = rep_status.get("process_name") or "replicator_worker"

            # 2. Quarantine all replica files to the specific space (.quarantine)
            quarantined_artifacts = []
            for fname, fpath in replica_files:
                dest_name = f"{fname}.{ts_str}.quarantined"
                dest_path = os.path.join(quarantine_dir, dest_name)
                try:
                    # Move out of the controlled sandbox into the quarantine enclave
                    shutil.move(fpath, dest_path)
                    file_hash = hashlib.sha256(open(dest_path, "rb").read()).hexdigest()
                    quarantined_artifacts.append({
                        "original_filename": fname,
                        "original_path": fpath,
                        "quarantined_filename": dest_name,
                        "quarantine_path": dest_path,
                        "sha256": file_hash,
                        "size_bytes": os.path.getsize(dest_path),
                        "quarantined_at": timestamp_iso
                    })
                except Exception as e:
                    print(f"[QUARANTINE ERROR] Failed to move {fpath}: {e}")

            # 3. Create SecurityEvent in SQLite
            event_id = f"evt_rep_{uuid.uuid4().hex[:8]}"
            raw_msg = (
                f"ACTIVE THREAT INTERCEPTED: Self-replicating process '{process_name}' (Thread: {stopped_thread_id}) "
                f"halted and banned. {len(quarantined_artifacts)} replica files relocated to secure quarantine enclave."
            )
            event_record = SecurityEvent(
                id=event_id,
                network_id="net_workspace",
                device_id="dev_local",
                source_type="ACTIVE_DEFENSE",
                event_type="replicating_attack_halted",
                raw_message=raw_msg,
                is_suspicious=True,
                provenance=ProvenanceMetadata(
                    source_id="active_defense_sentinel",
                    sensor_type="THREAD_PROCESS_INSPECTOR",
                    sensitivity_level="restricted",
                    retention_policy="365d",
                    immutable_hash=hashlib.sha256(raw_msg.encode()).hexdigest()
                ),
                canonical=CanonicalFields(
                    event_kind="alert",
                    event_category="threat",
                    event_type="replication_contained",
                    file_path=sandbox_dir,
                    action="PROCESS_TERMINATE_AND_QUARANTINE",
                    risk_score=99
                )
            )
            save_record("events", event_id, event_record.model_dump())

            # 4. Create Incident & Mitigations in SQLite
            incident_id = f"INC-REP-{uuid.uuid4().hex[:6].upper()}"
            mit_1_id = f"MIT-{uuid.uuid4().hex[:6].upper()}"
            mit_2_id = f"MIT-{uuid.uuid4().hex[:6].upper()}"
            mit_3_id = f"MIT-{uuid.uuid4().hex[:6].upper()}"

            mit_actions = [
                MitigationAction(
                    id=mit_1_id,
                    incident_id=incident_id,
                    action_type="PROCESS_TERMINATION",
                    target_device_id="dev_local",
                    description=f"Forcibly terminate running thread {stopped_thread_id} ({process_name}).",
                    status=MitigationStatus.EXECUTED
                ),
                MitigationAction(
                    id=mit_2_id,
                    incident_id=incident_id,
                    action_type="BAN_SIGNATURE",
                    target_device_id="dev_local",
                    description=f"Blacklist signature {REPLICATOR_SIGNATURE} across EDR detection rulebase.",
                    status=MitigationStatus.EXECUTED
                ),
                MitigationAction(
                    id=mit_3_id,
                    incident_id=incident_id,
                    action_type="ENCLAVE_QUARANTINE",
                    target_device_id="dev_local",
                    description=f"Isolate {len(quarantined_artifacts)} replica artifacts in {quarantine_dir}.",
                    status=MitigationStatus.EXECUTED
                )
            ]

            for ma in mit_actions:
                save_record("mitigations", ma.id, ma.model_dump(), "incident_id", incident_id)

            incident_record = Incident(
                id=incident_id,
                network_id="net_workspace",
                affected_device_ids=["dev_local"],
                title=f"Replicating Attack Detected: Worm/T1080 Replication Intercepted & Banned",
                status=IncidentStatus.RESOLVED,
                threat_classification=ThreatClassification(
                    state=ClassificationState.THREAT,
                    category=ThreatCategory.MALWARE,
                    confidence=0.99,
                    severity="critical",
                    rationale="Rapid self-replication burst matching MITRE T1080 / T1105. Thread forcibly halted, signature blacklisted, artifacts isolated."
                ),
                mitigation_actions=mit_actions,
                events=[event_record]
            )
            save_record("incidents", incident_id, incident_record.model_dump())

            # 5. Cryptographic Audit Trail Entry
            audit_service.log_event(
                actor="ACTIVE_DEFENSE_SENTINEL",
                action="BAN_REPLICATING_ATTACK",
                target=f"Thread: {stopped_thread_id} | Sandbox: {sandbox_dir}",
                result=f"Thread terminated, banned signature {REPLICATOR_SIGNATURE}, {len(quarantined_artifacts)} files moved to .quarantine"
            )

            verdict_message = "This is a replicating attack and I have banned it and I have put it in this specific space."

            response_data = {
                "detected": True,
                "status": "ATTACK_BANNED_AND_QUARANTINED",
                "verdict": verdict_message,
                "specific_quarantine_space": quarantine_dir,
                "sandbox_source_space": sandbox_dir,
                "terminated_thread": stopped_thread_id,
                "process_name": process_name,
                "banned_signature": REPLICATOR_SIGNATURE,
                "quarantined_count": len(quarantined_artifacts),
                "quarantined_files": quarantined_artifacts,
                "incident_id": incident_id,
                "event_id": event_id,
                "mitigation_actions": [m.action_type for m in mit_actions],
                "trigger_source": trigger_source,
                "timestamp": timestamp_iso
            }

            self.last_scan_result = response_data
            self.last_mitigation_result = response_data
            self.mitigation_history.append(response_data)
            return response_data

    def restore_quarantined_replicas(self) -> Dict[str, Any]:
        """Restores quarantined replicas back to the sandbox space so the test can be repeated."""
        with self._lock:
            quarantine_dir = get_quarantine_dir()
            sandbox_dir = get_sandbox_dir()
            restored = []

            if os.path.exists(quarantine_dir):
                for fname in os.listdir(quarantine_dir):
                    if "replica" in fname.lower() and fname.endswith(".quarantined"):
                        src_path = os.path.join(quarantine_dir, fname)
                        # Remove timestamp and .quarantined
                        clean_name = fname.replace(".quarantined", "")
                        dest_path = os.path.join(sandbox_dir, clean_name)
                        try:
                            shutil.move(src_path, dest_path)
                            restored.append({
                                "restored_filename": clean_name,
                                "source_quarantine": src_path,
                                "restored_path": dest_path
                            })
                        except Exception as e:
                            print(f"[RESTORE ERROR] {e}")

            audit_service.log_event(
                actor="SOC_ANALYST",
                action="RESTORE_REPLICA_INCIDENT_FILES",
                target=quarantine_dir,
                result=f"Restored {len(restored)} test replica files back to {sandbox_dir}"
            )

            return {
                "status": "RESTORED",
                "restored_count": len(restored),
                "restored_files": restored,
                "restored_to": sandbox_dir
            }

    def purge_quarantined_replicas(self) -> Dict[str, Any]:
        """Permanently purges quarantined replica test files from the enclave."""
        with self._lock:
            quarantine_dir = get_quarantine_dir()
            purged = []
            if os.path.exists(quarantine_dir):
                for fname in os.listdir(quarantine_dir):
                    if "replica" in fname.lower():
                        p = os.path.join(quarantine_dir, fname)
                        try:
                            os.remove(p)
                            purged.append(fname)
                        except Exception:
                            pass
            return {"status": "PURGED", "count": len(purged), "purged_files": purged}

active_threat_detector = ActiveThreatDetector()
