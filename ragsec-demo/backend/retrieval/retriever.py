import datetime
from typing import List, Dict, Any
from embedding.embedder import EmbeddingEngine
from vectorstore.store import VectorStore

# We can initialize these once globally if we want to avoid reloading,
# but FastAPI dependencies or module-level instances work well.
# For simplicity, we initialize them at module load.
print("Initializing Retriever dependencies...")
embedder = EmbeddingEngine("BAAI/bge-small-en-v1.5")
vector_store = VectorStore()

def retrieve_and_gate(
    query: str, 
    allowed_tiers: List[str] = ["public", "internal"], 
    theta_sim: float = 0.55, 
    theta_conf: float = 0.55,
    top_k: int = 8
) -> Dict[str, Any]:
    """
    Retrieves chunks for a query and applies Confidence Gating as per Section VII-A.
    """
    if not query.strip():
         return {"status": "insufficient", "reason": "Empty query provided.", "nearest_chunks": []}

    # 1. Embed Query
    query_emb = embedder.embed([query])[0]
    
    # 2. Query Vector Store
    # We construct a filter for allowed tiers. Chroma supports $in for multiple values.
    filters = {"sensitivity_tier": {"$in": allowed_tiers}} if allowed_tiers else None
    
    results = vector_store.query(query_embedding=query_emb, k=top_k, filters=filters)
    
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    ids = results.get("ids", [[]])[0]
    
    if not documents:
        return {"status": "insufficient", "reason": "No documents found in corpus.", "nearest_chunks": []}
        
    # Combine into a structured list of chunks
    retrieved_chunks = []
    for i in range(len(documents)):
        # Chroma with cosine space returns distance = 1 - cosine_similarity.
        # We convert back to similarity for easier thresholding.
        similarity = 1.0 - distances[i]
        
        chunk = {
            "chunk_id": ids[i],
            "text": documents[i],
            "metadata": metadatas[i],
            "similarity": similarity,
            "raw_distance": distances[i]
        }
        retrieved_chunks.append(chunk)
        
    # 3. Temporal Prioritization
    # Add a small boost (e.g. up to +0.05) to similarity based on recency.
    now = datetime.datetime.utcnow()
    for chunk in retrieved_chunks:
        pub_date_str = chunk["metadata"].get("published_date")
        if pub_date_str:
            try:
                # Naive parse, assuming YYYY-MM-DD or ISO format.
                pub_date = datetime.datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                # If pub_date is naive, make it naive utc for comparison
                pub_date = pub_date.replace(tzinfo=None)
                
                days_old = (now - pub_date).days
                if days_old < 0: days_old = 0
                
                # Boost formula: max 0.05 boost, decaying to 0 over 365 days
                boost = max(0.0, 0.05 * (1.0 - (days_old / 365.0)))
                chunk["similarity"] += boost
            except Exception:
                pass # ignore parsing errors
                
    # Sort again by adjusted similarity (descending)
    retrieved_chunks = sorted(retrieved_chunks, key=lambda x: x["similarity"], reverse=True)
    
    # 4. Filter by θ_sim (Similarity Gate)
    surviving_chunks = [c for c in retrieved_chunks if c["similarity"] >= theta_sim]
    
    if not surviving_chunks:
        return {
            "status": "insufficient", 
            "reason": f"No chunks met the similarity threshold ({theta_sim}).", 
            "nearest_chunks": retrieved_chunks[:3]
        }
        
    # 5. Compute θ_conf (Aggregate Confidence Gate)
    # Average similarity of the top min(3, len) chunks
    top_n = min(3, len(surviving_chunks))
    avg_similarity = sum(c["similarity"] for c in surviving_chunks[:top_n]) / top_n
    
    if avg_similarity < theta_conf:
        return {
            "status": "insufficient",
            "reason": f"Aggregate confidence ({avg_similarity:.2f}) below threshold ({theta_conf}).",
            "nearest_chunks": surviving_chunks
        }
        
    # 6. Source Diversity Check
    # Must have >= 2 distinct parent_doc_ids OR source_types.
    # We will track a composite tuple to represent distinct sources.
    distinct_sources = set()
    for c in surviving_chunks:
        p_id = c["metadata"].get("parent_doc_id", "unknown")
        s_type = c["metadata"].get("source_type", "unknown")
        distinct_sources.add((p_id, s_type))
        
    if len(distinct_sources) < 2:
        return {
            "status": "insufficient",
            "reason": "Single-source bias detected. Evidence lacks corroborating diverse sources.",
            "nearest_chunks": surviving_chunks
        }
        
    # All gates passed
    return {
        "status": "sufficient",
        "chunks": surviving_chunks,
        "metrics": {
            "avg_top3_similarity": avg_similarity,
            "distinct_sources": len(distinct_sources),
            "surviving_count": len(surviving_chunks)
        }
    }
