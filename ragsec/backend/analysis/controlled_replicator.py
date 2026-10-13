"""
ragsec.backend.analysis.controlled_replicator
Safe, strictly-bounded Harmless Replicator Simulation Engine for Active Threat Testing.
Spawns controlled worker threads that create inert, harmless marker files in a dedicated sandbox,
strictly capped by limit and timeout, allowing RAGSec's active detection sentinel to intercept,
halt, ban, and quarantine the attack without causing any system harm.
"""
import os
import time
import uuid
import hashlib
import threading
import datetime
from typing import Dict, List, Any, Optional

def get_workspace_dir() -> str:
    return os.environ.get(
        "RAGSEC_MONITORED_DIR",
        os.path.abspath(os.path.join(os.getcwd(), "..", "..", "monitored_workspace"))
    )

def get_sandbox_dir() -> str:
    ws = get_workspace_dir()
    sandbox = os.path.join(ws, "replication_sandbox")
    os.makedirs(sandbox, exist_ok=True)
    return sandbox

def get_quarantine_dir() -> str:
    ws = get_workspace_dir()
    q = os.path.join(ws, ".quarantine")
    os.makedirs(q, exist_ok=True)
    return q

REPLICATOR_SIGNATURE = "RAGSEC-REPLICATING-PROBE-SIG-B74A"

class ControlledReplicatorThread(threading.Thread):
    def __init__(self, max_replicas: int = 4, interval_seconds: float = 1.5):
        super().__init__(daemon=True)
        self.thread_id = f"REP-THR-{uuid.uuid4().hex[:6].upper()}"
        self.max_replicas = max(1, min(max_replicas, 8))  # Strict safety bounds: 1 to 8 max
        self.interval_seconds = max(0.8, min(interval_seconds, 5.0))
        self.stop_event = threading.Event()
        self.status = "RUNNING"  # RUNNING, LIMIT_REACHED, STOPPED_BY_DEFENSE, STOPPED_BY_USER, TIMEOUT
        self.start_time = datetime.datetime.now(datetime.UTC).isoformat()
        self.end_time = None
        self.created_files: List[Dict[str, Any]] = []
        self.current_generation = 0
        self.sandbox_dir = get_sandbox_dir()
        self.process_name = f"python_worker_{self.thread_id}"

    def run(self):
        timeout_start = time.time()
        max_duration_seconds = 20.0  # Absolute safety timeout

        try:
            while not self.stop_event.is_set():
                if self.current_generation >= self.max_replicas:
                    self.status = "LIMIT_REACHED"
                    break

                if time.time() - timeout_start > max_duration_seconds:
                    self.status = "TIMEOUT"
                    break

                self.current_generation += 1
                gen_idx = self.current_generation

                replica_filename = f"replica_gen_{gen_idx}_{self.thread_id}.marker"
                replica_path = os.path.join(self.sandbox_dir, replica_filename)

                content_marker = (
                    f"=====================================================\n"
                    f"[RAGSEC CONTROLLED HARMLESS REPLICATOR SIMULATION]\n"
                    f"Generation: {gen_idx} of {self.max_replicas}\n"
                    f"Thread-ID: {self.thread_id}\n"
                    f"Process: {self.process_name}\n"
                    f"Signature: {REPLICATOR_SIGNATURE}\n"
                    f"Timestamp: {datetime.datetime.now(datetime.UTC).isoformat()}\n"
                    f"MITRE ATT&CK: T1080 (Taint/Replication Simulation)\n"
                    f"Safety Status: BENIGN INERT SYNTHETIC MARKER\n"
                    f"=====================================================\n"
                )

                content_hash = hashlib.sha256(content_marker.encode("utf-8")).hexdigest()

                try:
                    with open(replica_path, "w", encoding="utf-8") as f:
                        f.write(content_marker)

                    file_meta = {
                        "filename": replica_filename,
                        "filepath": replica_path,
                        "generation": gen_idx,
                        "hash": content_hash,
                        "created_at": datetime.datetime.now(datetime.UTC).isoformat(),
                        "size_bytes": len(content_marker.encode("utf-8"))
                    }
                    self.created_files.append(file_meta)
                except Exception as e:
                    print(f"[REPLICATOR ERROR] Failed to write replica: {e}")

                # Sleep with interruptible check
                for _ in range(int(self.interval_seconds * 10)):
                    if self.stop_event.is_set():
                        break
                    time.sleep(0.1)

        finally:
            if self.status == "RUNNING":
                self.status = "LIMIT_REACHED" if self.current_generation >= self.max_replicas else "STOPPED"
            self.end_time = datetime.datetime.now(datetime.UTC).isoformat()

    def terminate_by_defense(self) -> Dict[str, Any]:
        """Called by RAGSec Active Defense Sentinel to halt the replicator immediately."""
        self.stop_event.set()
        self.status = "STOPPED_BY_DEFENSE"
        self.end_time = datetime.datetime.now(datetime.UTC).isoformat()
        return {
            "thread_id": self.thread_id,
            "status": self.status,
            "generation_stopped_at": self.current_generation,
            "total_created": len(self.created_files),
            "terminated_at": self.end_time
        }

    def terminate_by_user(self):
        self.stop_event.set()
        self.status = "STOPPED_BY_USER"
        self.end_time = datetime.datetime.now(datetime.UTC).isoformat()


class ReplicatorManager:
    def __init__(self):
        self.active_thread: Optional[ControlledReplicatorThread] = None
        self.execution_history: List[Dict[str, Any]] = []
        self.banned_threads: Dict[str, Dict[str, Any]] = {}
        self.banned_signatures: List[str] = [REPLICATOR_SIGNATURE]
        self._lock = threading.Lock()

    def launch_replicator(self, max_replicas: int = 4, interval_seconds: float = 1.5) -> Dict[str, Any]:
        with self._lock:
            # If an existing thread is still running, abort it safely first
            if self.active_thread and self.active_thread.is_alive():
                self.active_thread.terminate_by_user()
                self.active_thread.join(timeout=1.0)

            thread = ControlledReplicatorThread(max_replicas=max_replicas, interval_seconds=interval_seconds)
            self.active_thread = thread
            thread.start()

            info = {
                "thread_id": thread.thread_id,
                "process_name": thread.process_name,
                "status": "RUNNING",
                "max_replicas": thread.max_replicas,
                "interval_seconds": thread.interval_seconds,
                "sandbox_dir": thread.sandbox_dir,
                "started_at": thread.start_time
            }
            return info

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            sandbox = get_sandbox_dir()
            current_sandbox_files = []
            if os.path.exists(sandbox):
                for f in os.listdir(sandbox):
                    p = os.path.join(sandbox, f)
                    if os.path.isfile(p):
                        current_sandbox_files.append({
                            "filename": f,
                            "filepath": p,
                            "size_bytes": os.path.getsize(p),
                            "modified_at": datetime.datetime.fromtimestamp(os.path.getmtime(p), datetime.UTC).isoformat()
                        })

            is_running = self.active_thread.is_alive() if self.active_thread else False
            thread_status = self.active_thread.status if self.active_thread else "IDLE"
            thread_id = self.active_thread.thread_id if self.active_thread else None
            gen = self.active_thread.current_generation if self.active_thread else 0
            max_rep = self.active_thread.max_replicas if self.active_thread else 0
            created = self.active_thread.created_files if self.active_thread else []

            return {
                "is_running": is_running,
                "thread_status": thread_status,
                "thread_id": thread_id,
                "process_name": self.active_thread.process_name if self.active_thread else None,
                "current_generation": gen,
                "max_replicas": max_rep,
                "created_files": created,
                "sandbox_files": current_sandbox_files,
                "sandbox_file_count": len(current_sandbox_files),
                "sandbox_dir": sandbox,
                "banned_threat_count": len(self.banned_threads),
                "banned_threads": list(self.banned_threads.values()),
                "banned_signatures": self.banned_signatures
            }

    def stop_replicator(self) -> Dict[str, Any]:
        with self._lock:
            if self.active_thread and self.active_thread.is_alive():
                self.active_thread.terminate_by_user()
                self.active_thread.join(timeout=1.0)
                return {"status": "STOPPED", "thread_id": self.active_thread.thread_id}
            return {"status": "NOT_RUNNING"}

    def ban_and_halt_threat(self, reason: str = "Active Replication Attack Detected") -> Dict[str, Any]:
        """Forcibly halts the running replicator thread and registers it as banned."""
        with self._lock:
            if not self.active_thread:
                return {"status": "NO_ACTIVE_THREAD"}

            thread = self.active_thread
            term_info = thread.terminate_by_defense()

            ban_record = {
                "thread_id": thread.thread_id,
                "process_name": thread.process_name,
                "banned_at": datetime.datetime.now(datetime.UTC).isoformat(),
                "reason": reason,
                "signature": REPLICATOR_SIGNATURE,
                "generation_stopped": thread.current_generation,
                "created_files_count": len(thread.created_files)
            }
            self.banned_threads[thread.thread_id] = ban_record
            self.execution_history.append(ban_record)

            return {
                "status": "THREAT_BANNED",
                "thread_id": thread.thread_id,
                "process_name": thread.process_name,
                "banned_record": ban_record
            }

replicator_manager = ReplicatorManager()
