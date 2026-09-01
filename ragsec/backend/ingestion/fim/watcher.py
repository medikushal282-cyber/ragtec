import time
import os
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from ingestion.fim.scanner import generate_fim_event, get_file_hash

class FIMEventHandler(FileSystemEventHandler):
    def __init__(self, ignore_patterns=None):
        self.ignore_patterns = ignore_patterns or [".git", "node_modules", "__pycache__", ".gemini", "ragsec.db"]
        super().__init__()

    def _should_ignore(self, path):
        for pattern in self.ignore_patterns:
            if pattern in path:
                return True
        return False

    def on_created(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
        file_hash = get_file_hash(event.src_path)
        generate_fim_event(event.src_path, "created", file_hash)

    def on_modified(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
        file_hash = get_file_hash(event.src_path)
        generate_fim_event(event.src_path, "modified", file_hash)

    def on_deleted(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
        generate_fim_event(event.src_path, "deleted", "")

    def on_moved(self, event):
        if event.is_directory or self._should_ignore(event.dest_path):
            return
        file_hash = get_file_hash(event.dest_path)
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
