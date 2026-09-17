import time
import os
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from ingestion.fim.scanner import generate_fim_event, get_file_hash

class FIMEventHandler(FileSystemEventHandler):
    def __init__(self, ignore_patterns=None):
        self.ignore_patterns = ignore_patterns or [
            ".git", "node_modules", "__pycache__", ".gemini", "ragsec.db", 
            ".quarantine", "quarantine", ".tmp", ".swp", ".lock", "desktop.ini", "Thumbs.db"
        ]
        self._recent_events = {}  # {filepath: (action, hash, timestamp)}
        self._lock = threading.Lock()
        super().__init__()

    def _should_ignore(self, path: str) -> bool:
        if not path:
            return True
        norm_path = path.replace("\\", "/").lower()
        basename = os.path.basename(path).lower()

        # Temporary files and editor locks
        if basename.startswith("~") or basename.startswith(".~") or basename.endswith(".tmp") or basename.endswith(".crdownload"):
            return True

        for pattern in self.ignore_patterns:
            if pattern.lower() in norm_path:
                return True
        return False

    def _is_duplicate(self, filepath: str, action: str, file_hash: str) -> bool:
        now = time.time()
        norm = filepath.replace("\\", "/").lower()
        with self._lock:
            # Clean old entries
            self._recent_events = {k: v for k, v in self._recent_events.items() if now - v[2] < 5.0}
            
            last = self._recent_events.get(norm)
            if last:
                last_action, last_hash, last_ts = last
                # If within 2.5 seconds and either same hash or created->modified with same hash
                if now - last_ts < 2.5:
                    if last_hash and file_hash and last_hash == file_hash:
                        return True
                    if last_action == "created" and action == "modified":
                        return True
            
            self._recent_events[norm] = (action, file_hash, now)
            return False

    def on_created(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
        if not os.path.exists(event.src_path):
            return
        file_hash = get_file_hash(event.src_path)
        if self._is_duplicate(event.src_path, "created", file_hash):
            return
        generate_fim_event(event.src_path, "created", file_hash)

    def on_modified(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
        if not os.path.exists(event.src_path):
            return
        file_hash = get_file_hash(event.src_path)
        if self._is_duplicate(event.src_path, "modified", file_hash):
            return
        generate_fim_event(event.src_path, "modified", file_hash)

    def on_deleted(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
        if self._is_duplicate(event.src_path, "deleted", ""):
            return
        generate_fim_event(event.src_path, "deleted", "")

    def on_moved(self, event):
        if event.is_directory:
            return
        if self._should_ignore(event.dest_path) or self._should_ignore(event.src_path):
            return
        file_hash = get_file_hash(event.dest_path) if os.path.exists(event.dest_path) else ""
        if self._is_duplicate(event.dest_path, "renamed", file_hash):
            return
        generate_fim_event(event.dest_path, "renamed", file_hash)

class FIMWatcher:
    def __init__(self, directory: str):
        self.directory = directory
        self.observer = Observer()
        self.thread = None
        self.running = False

    def start(self):
        if self.running:
            return
        event_handler = FIMEventHandler()
        self.observer.schedule(event_handler, self.directory, recursive=True)
        self.observer.start()
        self.running = True
        print(f"FIM Watcher started on {self.directory}")

    def stop(self):
        if not self.running:
            return
        self.observer.stop()
        self.observer.join()
        self.running = False
        print("FIM Watcher stopped.")

# Global instance for FastAPI lifecycle
watcher_instance = None

def start_watcher(directory: str):
    global watcher_instance
    if watcher_instance is None:
        watcher_instance = FIMWatcher(directory)
        watcher_instance.start()

def stop_watcher():
    global watcher_instance
    if watcher_instance:
        watcher_instance.stop()
