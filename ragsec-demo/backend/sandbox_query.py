import json
from embedding import EmbeddingEngine
from vectorstore import VectorStore

def main():
    print("Loading Embedding Model...")
    embedder = EmbeddingEngine("BAAI/bge-small-en-v1.5")
    
    print("Loading Vector Store...")
    vector_store = VectorStore()
    
    query = "ransomware containment steps"
    print(f"\nQuerying for: '{query}'")
    
    # 1. Embed query
    query_emb = embedder.embed([query])[0]
    
    # 2. Search
    results = vector_store.query(query_embedding=query_emb, k=3)
    
    # 3. Print results
    print("\n--- Top 3 Results ---")
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    
    for i in range(len(documents)):
        print(f"\nResult {i+1} (Distance: {distances[i]:.4f})")
        print(f"Source Type: {metadatas[i].get('source_type')}")
        print(f"Sensitivity: {metadatas[i].get('sensitivity_tier')}")
        entities = metadatas[i].get("entity_tags", "[]")
        print(f"Entities: {entities}")
        # Print a snippet of the text
        text_snippet = documents[i][:300].replace('\n', ' ')
        print(f"Snippet: {text_snippet}...")

if __name__ == "__main__":
    main()
