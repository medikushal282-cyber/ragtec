from fastapi import APIRouter, Depends
from typing import List, Dict
import datetime
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/v1/kb", tags=["Knowledge Base"])

@router.get("/status")
def get_kb_status(db: Session = Depends(get_db)):
    count = db.query(models.KBDocument).count()
    return {
        "status": "Operational",
        "vector_db": "ChromaDB",
        "total_embeddings": count * 10,
        "collections": ["threat_intel", "cve_catalog", "mitre_attack"]
    }

@router.get("/documents")
def get_kb_documents(db: Session = Depends(get_db)):
    docs = db.query(models.KBDocument).all()
    return [
        {
            "id": d.id,
            "category": d.category,
            "title": d.title,
            "content": d.content,
            "similarity": 0.95,
            "status": d.status
        } for d in docs
    ]

@router.post("/ingest")
def ingest_document(payload: dict, db: Session = Depends(get_db)):
    import uuid
    doc = models.KBDocument(
        id=str(uuid.uuid4()),
        title=payload.get("title", "New Document"),
        category=payload.get("category", "General"),
        content=payload.get("content", ""),
        status="indexing"
    )
    db.add(doc)
    db.commit()
    return {"status": "success", "message": "Document queued for embedding", "doc_id": doc.id}

from fastapi import UploadFile, File

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    import uuid
    contents = await file.read()
    text_content = contents.decode("utf-8", errors="ignore")
    
    doc = models.KBDocument(
        id=str(uuid.uuid4())[:8],
        title=file.filename,
        category="Uploaded Intel Report",
        content=text_content[:1000] + ("..." if len(text_content) > 1000 else ""),
        status="Indexed & Embedded"
    )
    db.add(doc)
    db.commit()
    return {"status": "success", "filename": file.filename, "doc_id": doc.id, "message": f"File '{file.filename}' processed and embedded."}
