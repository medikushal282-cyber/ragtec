from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingEngine:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        print(f"Loading Embedding Model: {model_name}")
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Embeds a list of texts using the underlying sentence transformer model.
        Automatically batches requests for efficiency.
        """
        if not texts:
            return []
            
        # Returns a numpy array, convert to list of lists of floats for Chroma
        embeddings = self.model.encode(texts, batch_size=batch_size, show_progress_bar=False)
        return embeddings.tolist()
