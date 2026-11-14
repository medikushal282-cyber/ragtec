"""
Database Snapshot Utility (Backup & Archival)
Standard operating script for nightly SQLite maintenance.
Uses standard library sqlite3 and datetime modules.
"""
import sqlite3
import shutil
import datetime
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backup_worker")

def backup_sqlite_db(source_db: str, backup_dir: str):
    if not os.path.exists(source_db):
        logger.warning(f"Source database {source_db} does not exist.")
        return False
        
    os.makedirs(backup_dir, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dest_path = os.path.join(backup_dir, f"backup_{ts}.db")
    
    logger.info(f"Initiating copy: {source_db} -> {dest_path}")
    shutil.copy2(source_db, dest_path)
    logger.info("Backup completed successfully.")
    return True

if __name__ == "__main__":
    backup_sqlite_db("ragsec.db", "backups")
