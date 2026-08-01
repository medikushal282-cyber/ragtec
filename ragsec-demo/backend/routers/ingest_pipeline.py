from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
import uuid
import re

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    chroma_client = chromadb.Client()
    collection = chroma_client.get_or_create_collection(name="threat_intel")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    CHROMA_AVAILABLE = True
except Exception as e:
    CHROMA_AVAILABLE = False
    collection = None
    embedder = None

router = APIRouter(prefix="/api/ingest_pipeline", tags=["ingest_pipeline"])

class IngestDocument(BaseModel):
    title: str
    content: str
    source: str # e.g. "SIEM", "IDS", "THREAT_FEED", "PLAYBOOK"
    sensitivity: str # "Public", "Internal", "Confidential"

def extract_entities(text: str) -> list:
    """Extract IPs, CVEs, and ATT&CK techniques."""
    entities = []
    # IPs
    ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)
    entities.extend(ips)
    # CVEs
    cves = re.findall(r'CVE-\d{4}-\d+', text)
    entities.extend(cves)
    # MITRE ATT&CK (e.g. T1078, T1021.002)
    mitre = re.findall(r'T\d{4}(?:\.\d+)?', text)
    entities.extend(mitre)
    return list(set(entities))

def hybrid_chunking(content: str) -> list:
    """Implement semantic paragraphs, table rows, rule blocks chunking."""
    chunks = []
    # Very basic paragraph splitting for demo purposes
    paragraphs = content.split('\n\n')
    for p in paragraphs:
        if p.strip():
            chunks.append(p.strip())
    return chunks

@router.post("/document")
def ingest_document(doc: IngestDocument, db: Session = Depends(get_db)):
    if not CHROMA_AVAILABLE:
        raise HTTPException(status_code=500, detail="ChromaDB or Embedder unavailable")

    chunks = hybrid_chunking(doc.content)
    
    ingested_count = 0
    for idx, chunk in enumerate(chunks):
        entities = extract_entities(chunk)
        chunk_id = f"{uuid.uuid4()}"
        
        metadata = {
            "title": doc.title,
            "source": doc.source,
            "sensitivity": doc.sensitivity,
            "entities": ",".join(entities),
            "chunk_index": idx
        }
        
        # Embed and store
        embedding = embedder.encode([chunk]).tolist()
        collection.upsert(
            ids=[chunk_id],
            embeddings=embedding,
            documents=[chunk],
            metadatas=[metadata]
        )
        ingested_count += 1

    # Audit Log
    audit = models.AuditLog(
        id=str(uuid.uuid4()),
        action_type="INGEST",
        resource=f"Document: {doc.title}",
        details=f"Ingested {ingested_count} chunks. Source: {doc.source}, Sensitivity: {doc.sensitivity}"
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "chunks_ingested": ingested_count}
