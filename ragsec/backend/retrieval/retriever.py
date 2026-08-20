"""
ragsec.backend.retrieval.retriever
Retrieves evidence chunks from the vector store, calculates retrieval confidence,
applies temporal recency decay prioritization, and builds Evidence objects.
"""
from typing import List, Dict, Any, Optional
import datetime
from models import Evidence, CanonicalChunk, SensitivityTier
from retrieval.vector_store import VectorStore
from retrieval.embedder import Embedder
from config import settings

def apply_temporal_decay(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Applies decaying recency boost (+0.00 to +0.05) to chunks based on publication_timestamp."""
    now = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    boosted = []
    for c in chunks:
        c_copy = dict(c)
        pub_str = c["metadata"].get("publication_timestamp", "")
        boost = 0.0
        if pub_str:
            try:
                pub_date = datetime.datetime.fromisoformat(pub_str.replace("Z", "+00:00")).replace(tzinfo=None)
                days_old = max(0, (now - pub_date).days)
                # Decays linearly from 0.05 to 0.0 over 365 days
                boost = max(0.0, 0.05 * (1.0 - (days_old / 365.0)))
            except Exception:
                pass
        c_copy["adjusted_similarity"] = round(min(1.0, c["similarity"] + boost), 4)
        boosted.append(c_copy)
        
    return sorted(boosted, key=lambda x: x["adjusted_similarity"], reverse=True)

class Retriever:
    def __init__(self, vector_store: VectorStore, embedder: Embedder):
        self.vector_store = vector_store
        self.embedder = embedder

    def retrieve(
        self,
        query: str,
        top_k: int = settings.RETRIEVAL_TOP_K,
        allowed_tiers: Optional[List[SensitivityTier]] = None
    ) -> List[Evidence]:
        """
        Embeds query, performs vector search, applies temporal prioritization,
        and constructs Evidence instances with sequential citation tags [C1], [C2], ...
        """
        query_emb = self.embedder.embed_query(query)
        raw_results = self.vector_store.query(
            query_embedding=query_emb,
            top_k=top_k,
            allowed_tiers=allowed_tiers
        )
        
        if not raw_results:
            return []
            
        prioritized = apply_temporal_decay(raw_results)
        
        evidence_list: List[Evidence] = []
        for i, item in enumerate(prioritized):
            meta = item["metadata"]
            tag = f"C{i+1}"
            evidence_list.append(Evidence(
                chunk_id=item["chunk_id"],
                document_id=meta.get("document_id", ""),
                source_name=meta.get("source_name", "unknown"),
                source_type=meta.get("source_type", "evidence"),
                text=item["text"],
                similarity_score=item["similarity"],
                adjusted_similarity=item["adjusted_similarity"],
                sensitivity_tier=SensitivityTier(meta.get("sensitivity_tier", "internal")),
                publication_timestamp=meta.get("publication_timestamp"),
                citation_tag=tag
            ))
            
        return evidence_list
