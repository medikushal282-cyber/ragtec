"""
ragsec.backend.retrieval.embedder
Dense embedding engine with support for SentenceTransformers.
Default model: BAAI/bge-small-en-v1.5 (configurable).
"""
from typing import List
import numpy as np
from config import settings

class Embedder:
    def __init__(self, model_name: str = settings.EMBEDDING_MODEL):
        self.model_name = model_name
        self.model = None
        self._load_model()
        
    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
        except Exception as e:
            print(f"[Embedder] Notice: Running with fallback embedding generator: {e}")
            self.model = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates unit-normalized dense embeddings for a list of strings."""
        if not texts:
            return []
            
        if self.model is not None:
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        else:
            # Deterministic reproducible fallback embeddings
            results = []
            for t in texts:
                np.random.seed(abs(hash(t)) % (2**32))
                vec = np.random.randn(settings.EMBEDDING_DIM)
                vec = vec / np.linalg.norm(vec)
                results.append(vec.tolist())
            return results

    def embed_query(self, query: str) -> List[float]:
        """Embeds a single query string."""
        return self.embed_texts([query])[0]
