import urllib.request
import json
import sqlite3

def run_tests():
    print("Running Phase 2 Automated Tests...")
    
    # Test 1: API Response
    print("Test 1: Fetching /api/knowledge/sources")
    with urllib.request.urlopen('http://localhost:8000/api/knowledge/sources') as response:
        data = json.loads(response.read().decode())
    
    assert len(data) == 4, "Expected 4 documents"
    
    cti_doc = next((d for d in data if d["name"] == "test_cti_narrative.txt"), None)
    assert cti_doc is not None
    assert cti_doc["chunkCount"] == 4
    assert len(cti_doc["extractedEntities"]) == 8 # Expected exact 8 unique entities mapped
    
    json_doc = next((d for d in data if d["name"] == "test_threats.json"), None)
    assert json_doc["chunkCount"] == 2
    
    # Test 2: SQLite Persistence and Relations
    print("Test 2: Verifying SQLite persistence and foreign keys")
    conn = sqlite3.connect('C:/Projects/RAGTEC/ragsec/backend/ragsec.db')
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM chunk_entities")
    link_count = c.fetchone()[0]
    assert link_count == 14, f"Expected 14 chunk_entity links, got {link_count}"
    
    print("ALL TESTS PASSED SUCCESSFULLY.")

if __name__ == "__main__":
    run_tests()
