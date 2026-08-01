from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import List, Optional
from datetime import datetime
import warnings
import uuid

warnings.filterwarnings("ignore")

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    chroma_client = chromadb.Client()
    collection = chroma_client.get_or_create_collection(name="threat_intel")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    CHROMA_AVAILABLE = True
except Exception as e:
    print(f"Warning: ChromaDB or SentenceTransformers failed to initialize. Error: {e}")
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
    sim_weight: Optional[float] = 0.45
    recency_weight: Optional[float] = 0.30
    severity_weight: Optional[float] = 0.15
    trust_weight: Optional[float] = 0.10
    iamRole: Optional[str] = "L1 Analyst"

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

def retrieve_chunks_internal(query: str, limit: int = 5, iam_role: str = "L1 Analyst") -> list:
    """Internal function to retrieve chunks for RAG pipelines (Source diversity + IAM + Temporal prioritization)."""
    if not CHROMA_AVAILABLE or collection.count() == 0:
        return []
        
    try:
        query_embedding = embedder.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=limit * 3, # Fetch more to allow filtering for source diversity & IAM
            include=["documents", "metadatas", "distances"]
        )
        
        chunks = []
        sources_seen = set()
        
        if results["documents"] and len(results["documents"][0]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            
            for i in range(len(docs)):
                doc = docs[i]
                meta = metas[i]
                source = meta.get("source", "unknown")
                severity = meta.get("severity", "Medium")
                
                # IAM Role Classification Filtering
                if iam_role == "L1 Analyst" and severity in ["Critical", "High"]:
                    continue # L1 Analysts cannot view Top Secret/Critical playbooks directly via retrieval
                
                # Source diversity constraint: Only allow up to 2 chunks from the same source
                if list(sources_seen).count(source) < 2:
                    chunks.append(doc)
                    sources_seen.add(source)
                
                if len(chunks) >= limit:
                    break
        return chunks
    except Exception as e:
        print(f"Internal retrieval error: {e}")
        return []

@router.post("/", response_model=List[RetrieveResponse])
def handle_retrieve(req: RetrieveRequest, db: Session = Depends(get_db)):
    # 1. Sync DB to ChromaDB for older mock logic
    threats = db.query(models.Threat).all()
    
    if CHROMA_AVAILABLE and threats and collection.count() == 0:
        try:
            ids = [t.id for t in threats]
            documents = [f"{t.name} {t.type} {t.origin} {t.solution} {t.exceptions}" for t in threats]
            metadatas = [{"severity": t.severity or "Unknown", "source": str(t.origin)} for t in threats]
            
            embeddings = embedder.encode(documents).tolist()
            collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)
        except Exception as e:
            pass

    res_ids = []
    res_distances = []
    if CHROMA_AVAILABLE and threats:
        try:
            query_embedding = embedder.encode([req.query]).tolist()
            chroma_results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(10, len(threats)),
                include=["distances"]
            )
            if chroma_results["ids"] and len(chroma_results["ids"][0]) > 0:
                res_ids = chroma_results["ids"][0]
                res_distances = chroma_results["distances"][0]
        except Exception:
            pass
    
    if not res_ids and threats:
        res_ids = [t.id for t in threats[:5]]
        res_distances = [0.1, 0.2, 0.3, 0.4, 0.5]
    
    results = []
    for i, t_id in enumerate(res_ids):
        dist = res_distances[i]
        sim = max(0.0, 1.0 - (dist / 2.0))
        sim = round(sim, 3)
        
        t = db.query(models.Threat).filter(models.Threat.id == t_id).first()
        if not t:
            continue
            
        sev_map = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2, "Resolved": 0.0}
        sev_score = sev_map.get(t.severity, 0.5)
        trust = 0.95 if "CISA" in str(t.origin).upper() else 0.7
        
        now = datetime.utcnow()
        if t.created_at:
            delta_days = (now - t.created_at).days
            recency = max(0.0, 1.0 - (delta_days / 30.0))
        else:
            recency = 0.5
        recency = round(recency, 3)
        
        if req.useRagsec:
            w_sim = req.sim_weight if req.sim_weight is not None else 0.45
            w_rec = req.recency_weight if req.recency_weight is not None else 0.30
            w_sev = req.severity_weight if req.severity_weight is not None else 0.15
            w_tru = req.trust_weight if req.trust_weight is not None else 0.10
            
            # IAM Role Weight Adjustment (Mock logic for L1 vs L3 access priority)
            if req.iamRole == "L3 Threat Hunter":
                w_sev += 0.2 # Bias heavily towards critical items for L3
                
            final = round((w_sim * sim) + (w_rec * recency) + (w_sev * sev_score) + (w_tru * trust), 3)
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
        
    if req.useRagsec:
        results.sort(key=lambda x: x.scores.final, reverse=True)
    else:
        results.sort(key=lambda x: x.scores.similarity, reverse=True)
        
    # Audit Retrieval Event
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        action_type="RETRIEVE",
        resource="ChromaDB: threat_intel",
        details=f"Query: {req.query}, RAGSec: {req.useRagsec}"
    )
    db.add(audit)
    db.commit()

    return results[:5]
