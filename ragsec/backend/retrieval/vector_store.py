"""
ragsec.backend.retrieval.vector_store
Persistent ChromaDB vector store for indexed canonical chunks.
Supports filtering by sensitivity tier, source type, and document ID.
"""
from typing import List, Dict, Any, Optional
import os
import chromadb
from models import CanonicalChunk, SensitivityTier
from config import settings

class VectorStore:
    def __init__(self, persist_dir: str = settings.CHROMA_PERSIST_DIR, collection_name: str = "ragsec_chunks"):
        os.makedirs(persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={
                "hnsw:space": "cosine",
                "embedding_model": settings.EMBEDDING_MODEL
            }
        )

    def upsert_chunks(self, chunks: List[CanonicalChunk], embeddings: List[List[float]]):
        """Inserts or updates chunks in the ChromaDB collection."""
        if not chunks:
            return
            
        ids = [c.chunk_id for c in chunks]
        docs = [c.text for c in chunks]
        metadatas = [
            {
                "document_id": c.document_id,
                "source_name": c.source_name,
                "source_type": c.source_type,
                "chunk_index": c.chunk_index,
                "sensitivity_tier": c.sensitivity_tier.value,
                "publication_timestamp": c.publication_timestamp or "",
                "ips": ",".join(c.extracted_entities.ips),
                "domains": ",".join(c.extracted_entities.domains),
                "cves": ",".join(c.extracted_entities.cves),
                "ttps": ",".join(c.extracted_entities.ttps),
            }
            for c in chunks
        ]
        
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=docs,
            metadatas=metadatas
        )

    def query(
        self,
        query_embedding: List[float],
        top_k: int = settings.RETRIEVAL_TOP_K,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Queries nearest neighbors in cosine space with metadata filtering.
        """
        where_clause = None
        if filters:
            # ChromaDB expects simple dicts for equality, or $and / $in logic
            # This handles simple equality for things like network_id, sensitivity_tier, source_type
            if len(filters) == 1:
                where_clause = filters
            else:
                where_clause = {"$and": [{k: v} for k, v in filters.items()]}
                
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause
        )
        
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]
        
        retrieved = []
        for i in range(len(docs)):
            # Cosine distance = 1 - cosine_similarity
            similarity = max(0.0, min(1.0, 1.0 - distances[i]))
            retrieved.append({
                "chunk_id": ids[i],
                "text": docs[i],
                "metadata": metas[i],
                "dense_score": round(similarity, 4)
            })
            
        return retrieved

    def get_chunk_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a specific chunk by chunk_id."""
        res = self.collection.get(ids=[chunk_id])
        docs = res.get("documents", [])
        if docs:
            return {
                "chunk_id": chunk_id,
                "text": docs[0],
                "metadata": res.get("metadatas", [{}])[0]
            }
        return None

    def count(self) -> int:
        return self.collection.count()
