"""Direct Chroma audit using the correct data/chroma_db path"""
import os, sys
sys.path.insert(0, '.')

import chromadb
from embedding.embedder import EmbeddingEngine

# The VectorStore uses: os.path.join(os.path.dirname(os.path.dirname(__file__)), persist_dir)
# where __file__ is vectorstore/store.py, so dirname(dirname(__file__)) = backend/
# and persist_dir = "data/chroma_db"
CHROMA_PATH = "./data/chroma_db"
COLLECTION_NAME = "ragsec_chunks"

print(f"--- Chroma Raw Audit ---")
print(f"DB path: {os.path.abspath(CHROMA_PATH)}")
print(f"Path exists: {os.path.exists(CHROMA_PATH)}")
print()

client = chromadb.PersistentClient(path=CHROMA_PATH)
collections = client.list_collections()
print(f"Collections found: {[c.name for c in collections]}")

collection = client.get_collection(COLLECTION_NAME)
count = collection.count()
print(f"Total chunks in '{COLLECTION_NAME}': {count}")
print()

embedder = EmbeddingEngine("BAAI/bge-small-en-v1.5")

test_queries = [
    # Expected strong match (in corpus — phishing SOP)
    "phishing email triage steps",
    # Expected strong match (in corpus — MITRE lateral movement)
    "lateral movement T1021 remote services",
    # Expected WEAK/no real match (outside corpus entirely)
    "quantum cryptography post-quantum lattice algorithms",
]

for query in test_queries:
    print(f"Query: '{query}'")
    emb = embedder.embed([query])[0]
    results = collection.query(
        query_embeddings=[emb],
        n_results=3,
        include=["documents", "metadatas", "distances"]
    )
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    dists = results["distances"][0]
    
    for i in range(len(docs)):
        sim = 1.0 - dists[i]
        src = metas[i].get("source_type", "?")
        snippet = docs[i][:80].replace("\n", " ")
        print(f"  [{i+1}] source={src} | raw_distance={dists[i]:.6f} | similarity={sim:.6f}")
        print(f"       snippet: {snippet}")
    print()
