import sqlite3

conn = sqlite3.connect('C:/Projects/RAGTEC/ragsec/backend/ragsec.db')
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM documents")
print(f"Documents: {c.fetchone()[0]}")

c.execute("SELECT COUNT(*) FROM chunks")
print(f"Chunks: {c.fetchone()[0]}")

c.execute("SELECT COUNT(*) FROM entities")
print(f"Entities: {c.fetchone()[0]}")

c.execute("SELECT COUNT(*) FROM chunk_entities")
print(f"Chunk-Entity Links: {c.fetchone()[0]}")

print("\n--- SAMPLE RELATIONSHIPS ---")
c.execute('''SELECT d.source_name, c.chunk_index, e.entity_type, e.entity_value 
             FROM documents d 
             JOIN chunks c ON d.id = c.document_id 
             JOIN chunk_entities ce ON c.id = ce.chunk_id 
             JOIN entities e ON ce.entity_id = e.id 
             LIMIT 5''')
for row in c.fetchall():
    print(row)
