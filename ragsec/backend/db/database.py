import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

# Path must be configurable per Master Specification
DB_PATH = os.environ.get("RAGSEC_DB_PATH", "ragsec.db")

# Documenting schema:
# We use a semi-structured approach for the MVP to preserve the complex Pydantic models.
# Tables:
# - networks (id TEXT PRIMARY KEY, data JSON)
# - devices (id TEXT PRIMARY KEY, network_id TEXT, data JSON)
# - events (id TEXT PRIMARY KEY, network_id TEXT, data JSON)
# - incidents (id TEXT PRIMARY KEY, network_id TEXT, data JSON)
# - mitigations (id TEXT PRIMARY KEY, incident_id TEXT, data JSON)
# - audit_logs (id TEXT PRIMARY KEY, data JSON)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS networks (id TEXT PRIMARY KEY, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, network_id TEXT, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, network_id TEXT, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, network_id TEXT, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS mitigations (id TEXT PRIMARY KEY, incident_id TEXT, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, data JSON)''')
    conn.commit()
    conn.close()

def save_record(table: str, id_val: str, data: dict, foreign_key_col: str = None, foreign_key_val: str = None):
    conn = get_connection()
    c = conn.cursor()
    json_data = json.dumps(data)
    
    if foreign_key_col and foreign_key_val:
        c.execute(f'''
            INSERT OR REPLACE INTO {table} (id, {foreign_key_col}, data)
            VALUES (?, ?, ?)
        ''', (id_val, foreign_key_val, json_data))
    else:
        c.execute(f'''
            INSERT OR REPLACE INTO {table} (id, data)
            VALUES (?, ?)
        ''', (id_val, json_data))
    conn.commit()
    conn.close()

def get_record(table: str, id_val: str) -> Optional[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute(f'SELECT data FROM {table} WHERE id = ?', (id_val,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row['data'])
    return None

def get_all_records(table: str) -> List[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute(f'SELECT data FROM {table}')
    rows = c.fetchall()
    conn.close()
    return [json.loads(row['data']) for row in rows]

def get_records_by_fk(table: str, fk_col: str, fk_val: str) -> List[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute(f'SELECT data FROM {table} WHERE {fk_col} = ?', (fk_val,))
    rows = c.fetchall()
    conn.close()
    return [json.loads(row['data']) for row in rows]

# Initialize on import
init_db()
