from fastapi import APIRouter
from typing import List, Dict
import datetime

router = APIRouter(prefix="/api/v1/kb", tags=["Knowledge Base"])

@router.get("/status")
def get_kb_status():
    return {
        "status": "Operational",
        "vector_db": "ChromaDB",
        "total_embeddings": 1245000,
        "collections": ["threat_intel", "cve_catalog", "mitre_attack"]
    }

@router.get("/documents")
def get_documents():
    return [
        {
            "id": "VEC-7892",
            "category": "RAG Security",
            "title": "Indirect Prompt Injection Vulnerabilities",
            "content": "Indirect prompt injection occurs when an attacker embeds adversarial instructions inside external documents or web data.",
            "similarity": 0.98,
            "status": "INDEXED"
        },
        {
            "id": "VEC-7893",
            "category": "MITRE ATT&CK",
            "title": "T1190 - Exploit Public-Facing Application",
            "content": "Adversaries may attempt to exploit weaknesses in internet-facing applications to gain unauthorized access.",
            "similarity": 0.85,
            "status": "INDEXED"
        },
        {
            "id": "VEC-7894",
            "category": "CISA Standards",
            "title": "Known Exploited Vulnerabilities (KEV) Catalog",
            "content": "The CISA KEV catalog serves as an authoritative repository of flaws that have been actively exploited in the wild.",
            "similarity": 0.92,
            "status": "INDEXED"
        }
    ]

@router.post("/ingest")
def ingest_document(payload: dict):
    return {"status": "success", "message": "Document queued for embedding", "doc_id": "VEC-NEW"}
