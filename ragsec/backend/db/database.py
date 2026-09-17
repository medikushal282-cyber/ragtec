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
    c.execute('''CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        network_id TEXT,
        device_id TEXT,
        data_source TEXT DEFAULT 'live',
        data JSON
    )''')
    # Index for fast Network->Device->Event chain queries
    c.execute('''CREATE INDEX IF NOT EXISTS idx_events_network ON events(network_id)''')
    c.execute('''CREATE INDEX IF NOT EXISTS idx_events_device ON events(device_id)''')
    c.execute('''CREATE INDEX IF NOT EXISTS idx_devices_network ON devices(network_id)''')
    c.execute('''CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, network_id TEXT, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS mitigations (id TEXT PRIMARY KEY, incident_id TEXT, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, data JSON)''')
    c.execute('''CREATE TABLE IF NOT EXISTS whitelist (id TEXT PRIMARY KEY, data JSON)''')

    # Batch 3: File threat analysis results
    c.execute('''CREATE TABLE IF NOT EXISTS file_analyses (
        id TEXT PRIMARY KEY,
        sha256 TEXT,
        classification TEXT,
        data_source TEXT DEFAULT 'live',
        data JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE INDEX IF NOT EXISTS idx_analyses_sha256 ON file_analyses(sha256)''')
    
    # Phase 2: Relational Knowledge Base
    c.execute('''CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, source_name TEXT, mime_type TEXT, chunk_count INTEGER, status TEXT, data JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY, document_id TEXT, chunk_index INTEGER, text TEXT, FOREIGN KEY(document_id) REFERENCES documents(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, entity_type TEXT, entity_value TEXT, UNIQUE(entity_type, entity_value))''')
    c.execute('''CREATE TABLE IF NOT EXISTS chunk_entities (chunk_id TEXT, entity_id TEXT, PRIMARY KEY(chunk_id, entity_id), FOREIGN KEY(chunk_id) REFERENCES chunks(id), FOREIGN KEY(entity_id) REFERENCES entities(id))''')
    
    conn.commit()
    conn.close()

def save_record(table: str, id_val: str, data: dict, foreign_key_col: str = None, foreign_key_val: str = None):
    conn = get_connection()
    c = conn.cursor()
    json_data = json.dumps(data)

    # For events table, also persist device_id and data_source as indexed columns
    if table == 'events':
        device_id = data.get('device_id', '')
        data_source = data.get('data_source', 'live')
        network_id = data.get('network_id', foreign_key_val or '')
        c.execute('''
            INSERT OR REPLACE INTO events (id, network_id, device_id, data_source, data)
            VALUES (?, ?, ?, ?, ?)
        ''', (id_val, network_id, device_id, data_source, json_data))
    elif foreign_key_col and foreign_key_val:
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

def get_events_by_device(device_id: str) -> List[dict]:
    """Fetch all events attributed to a specific device — uses the indexed device_id column."""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT data FROM events WHERE device_id = ? ORDER BY rowid DESC', (device_id,))
    rows = c.fetchall()
    conn.close()
    return [json.loads(row['data']) for row in rows]

def get_events_by_network(network_id: str) -> List[dict]:
    """Fetch all events attributed to a specific network — uses the indexed network_id column."""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT data FROM events WHERE network_id = ? ORDER BY rowid DESC', (network_id,))
    rows = c.fetchall()
    conn.close()
    return [json.loads(row['data']) for row in rows]

# Initialize on import
init_db()
def save_knowledge_document(doc_id: str, name: str, mime: str, chunks: list, doc_data: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute('INSERT OR REPLACE INTO documents (id, source_name, mime_type, chunk_count, status, data) VALUES (?, ?, ?, ?, ?, ?)', 
              (doc_id, name, mime, len(chunks), 'Parsed', json.dumps(doc_data)))
    
    for chunk in chunks:
        c.execute('INSERT OR REPLACE INTO chunks (id, document_id, chunk_index, text) VALUES (?, ?, ?, ?)',
                  (chunk.chunk_id, doc_id, chunk.chunk_index, chunk.text))
        
        entities = chunk.extracted_entities
        all_ents = []
        for e in entities.ips: all_ents.append(('ip', e))
        for e in entities.domains: all_ents.append(('domain', e))
        for e in entities.hostnames: all_ents.append(('hostname', e))
        for e in entities.hashes: all_ents.append(('hash', e))
        for e in entities.cves: all_ents.append(('cve', e))
        for e in entities.ttps: all_ents.append(('ttp', e))
        
        for e_type, e_val in all_ents:
            c.execute('INSERT OR IGNORE INTO entities (id, entity_type, entity_value) VALUES (?, ?, ?)',
                      (f"{e_type}_{e_val}", e_type, e_val))
            c.execute('INSERT OR IGNORE INTO chunk_entities (chunk_id, entity_id) VALUES (?, ?)',
                      (chunk.chunk_id, f"{e_type}_{e_val}"))
    
    conn.commit()
    conn.close()

def get_knowledge_sources():
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM documents ORDER BY created_at DESC')
    docs = [dict(row) for row in c.fetchall()]
    
    # Enrich with entity counts/previews to show in UI
    for d in docs:
        c.execute('''SELECT e.entity_type, e.entity_value FROM entities e 
                     JOIN chunk_entities ce ON e.id = ce.entity_id 
                     JOIN chunks c ON ce.chunk_id = c.id 
                     WHERE c.document_id = ?''', (d['id'],))
        ents = c.fetchall()
        d['extractedEntities'] = [f"{r['entity_type']}:{r['entity_value']}" for r in ents]
        d['chunkCount'] = d['chunk_count']
        d['mimeType'] = d['mime_type']
        
    conn.close()
    return docs

def save_file_analysis(result_dict: dict) -> None:
    """Persist a FileAnalysisResult (as dict) to the file_analyses table."""
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        'INSERT OR REPLACE INTO file_analyses (id, sha256, classification, data_source, data) VALUES (?, ?, ?, ?, ?)',
        (result_dict['analysis_id'], result_dict['sha256'],
         result_dict['classification'], result_dict.get('data_source', 'live'),
         json.dumps(result_dict))
    )
    conn.commit()
    conn.close()

def get_file_analysis(analysis_id: str) -> Optional[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT data FROM file_analyses WHERE id = ?', (analysis_id,))
    row = c.fetchone()
    conn.close()
    return json.loads(row['data']) if row else None

def list_file_analyses(limit: int = 50) -> List[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT data FROM file_analyses ORDER BY created_at DESC LIMIT ?', (limit,))
    rows = c.fetchall()
    conn.close()
    return [json.loads(r['data']) for r in rows]
