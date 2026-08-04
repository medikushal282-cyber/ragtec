import os
import chromadb
from typing import List, Dict, Any
from chunking import Chunk

class VectorStore:
    def __init__(self, persist_dir: str = "data/chroma_db", collection_name: str = "ragsec_chunks"):
        # Resolve path relative to backend root
        self.persist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), persist_dir)
        os.makedirs(self.persist_dir, exist_ok=True)
        
        # Initialize PersistentClient
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"} # Use cosine similarity
        )

    def add_chunks(self, chunks: List[Chunk], embeddings: List[List[float]]):
        """
        Adds chunks and their corresponding embeddings to Chroma.
        """
        if not chunks or not embeddings:
            return
            
        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks must match number of embeddings.")
            
        ids = [chunk.chunk_id for chunk in chunks]
        documents = [chunk.text for chunk in chunks]
        metadatas = [chunk.to_metadata() for chunk in chunks]
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def query(self, query_embedding: List[float], k: int = 5, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Queries the vector store using a pre-computed query embedding.
        Filters can be provided to restrict search (e.g. {"sensitivity_tier": "public"})
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=filters if filters else None,
            include=["documents", "metadatas", "distances"]
        )
        return results
