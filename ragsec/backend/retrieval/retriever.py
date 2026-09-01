"""
ragsec.backend.retrieval.retriever
Retrieves evidence chunks from the vector store using 2-stage (dense + cross-encoder).
"""
from typing import List, Dict, Any, Optional
from models import Evidence, SensitivityTier
from retrieval.vector_store import VectorStore
from retrieval.embedder import Embedder
from retrieval.reranker import Reranker
from config import settings

class Retriever:
    def __init__(self, vector_store: VectorStore, embedder: Embedder):
        self.vector_store = vector_store
        self.embedder = embedder
        self.reranker = Reranker()

    def retrieve(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 50,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Embeds query, performs vector search (top_k), then reranks (top_n).
        """
        query_emb = self.embedder.embed_query(query)
        
        # Dense Retrieval
        raw_results = self.vector_store.query(
            query_embedding=query_emb,
            top_k=top_k,
            filters=filters
        )
        
        if not raw_results:
            return []
            
        # Rerank Phase
        reranked = self.reranker.rerank(query, raw_results, top_n=top_n)
        
        # Build Provenance metadata properly
        evidence_list = []
        for i, item in enumerate(reranked):
            meta = item["metadata"]
            # Explode comma-separated entities for the API return format
            entities = []
            for t in ["ips", "domains", "cves", "ttps", "hashes"]:
                if meta.get(t):
                    for val in meta[t].split(","):
                        if val: entities.append(f"{t[:-1] if t.endswith('s') else t}:{val}")
            
            evidence_list.append({
                "chunk_id": item["chunk_id"],
                "source": meta.get("source_name", "unknown"),
                "chunk_text": item["text"],
                "dense_score": item["dense_score"],
                "rerank_score": round(item["rerank_score"], 4),
                "entities": entities,
                "provenance": f"DB:{meta.get('document_id')}"
            })
            
        return evidence_list
