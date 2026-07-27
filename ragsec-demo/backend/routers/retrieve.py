from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import List
from datetime import datetime
import warnings
import os

warnings.filterwarnings("ignore")

# Initialize ChromaDB and Embedding Model (Cached)
# We use an ephemeral client for demo speed, but in production this would be PersistentClient
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    chroma_client = chromadb.Client()
    collection = chroma_client.get_or_create_collection(name="threat_intel")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    CHROMA_AVAILABLE = True
except Exception as e:
    print(f"Warning: ChromaDB or SentenceTransformers failed to initialize. Falling back to mock RAG. Error: {e}")
    CHROMA_AVAILABLE = False
    collection = None
    embedder = None

router = APIRouter(
    prefix="/api/retrieve",
    tags=["retrieve"],
)

class RetrieveRequest(BaseModel):
    query: str
    useRagsec: bool

class Scores(BaseModel):
    similarity: float
    recency: float
    severity: float
    trust: float
    final: float

class RetrieveResponse(BaseModel):
    id: str
    timestamp: str
    severity: str
    scores: Scores

@router.post("/", response_model=List[RetrieveResponse])
def handle_retrieve(req: RetrieveRequest, db: Session = Depends(get_db)):
    # 1. Sync DB to ChromaDB (Naive sync for demo purposes)
    threats = db.query(models.Threat).all()
    
    if CHROMA_AVAILABLE and threats:
        try:
            ids = [t.id for t in threats]
            documents = [f"{t.name} {t.type} {t.origin} {t.solution} {t.exceptions}" for t in threats]
            metadatas = [{"severity": t.severity or "Unknown", "origin": str(t.origin)} for t in threats]
            
            # Upsert into Chroma
            embeddings = embedder.encode(documents).tolist()
            collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)
        except Exception as e:
            print(f"ChromaDB upsert error: {e}")

    # 2. Embed the User Query
    res_ids = []
    res_distances = []
    if CHROMA_AVAILABLE and threats:
        try:
            query_embedding = embedder.encode([req.query]).tolist()
            chroma_results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(10, len(threats)),
                include=["distances", "metadatas"]
            )
            if chroma_results["ids"] and len(chroma_results["ids"][0]) > 0:
                res_ids = chroma_results["ids"][0]
                res_distances = chroma_results["distances"][0]
        except Exception:
            pass
    
    # 3. If Chroma fails or is unavailable, use mock ids
    if not res_ids and threats:
        res_ids = [t.id for t in threats[:5]]
        res_distances = [0.1, 0.2, 0.3, 0.4, 0.5]
    
    results = []
    for i, t_id in enumerate(res_ids):
        # Convert L2 distance to a pseudo-similarity score (0 to 1)
        # Closer to 0 distance = closer to 1 similarity
        dist = res_distances[i]
        sim = max(0.0, 1.0 - (dist / 2.0))
        sim = round(sim, 3)
        
        # Get actual threat from DB for time/severity calculations
        t = db.query(models.Threat).filter(models.Threat.id == t_id).first()
        if not t:
            continue
            
        # Calculate RAGSec factors based on actual data
        sev_map = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2, "Resolved": 0.0}
        sev_score = sev_map.get(t.severity, 0.5)
        
        trust = 0.95 if "CISA" in str(t.origin).upper() else 0.7
        
        # Recency calculation based on created_at
        now = datetime.utcnow()
        if t.created_at:
            delta_days = (now - t.created_at).days
            recency = max(0.0, 1.0 - (delta_days / 30.0)) # 30 days scale
        else:
            recency = 0.5
        recency = round(recency, 3)
        
        if req.useRagsec:
            # RAGSec Formula: 0.45(Sim) + 0.30(Time) + 0.15(Risk) + 0.10(Trust)
            final = round((0.45 * sim) + (0.30 * recency) + (0.15 * sev_score) + (0.10 * trust), 3)
        else:
            final = sim
            
        results.append(RetrieveResponse(
            id=t.id,
            timestamp=t.created_at.isoformat() if t.created_at else "2024-01-01T00:00:00Z",
            severity=t.severity or "Unknown",
            scores=Scores(
                similarity=sim,
                recency=recency,
                severity=sev_score,
                trust=trust,
                final=final
            )
        ))
        
    # Sort results
    if req.useRagsec:
        results.sort(key=lambda x: x.scores.final, reverse=True)
    else:
        results.sort(key=lambda x: x.scores.similarity, reverse=True)
        
    return results[:5]
