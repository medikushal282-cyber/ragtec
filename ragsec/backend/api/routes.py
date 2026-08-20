"""
ragsec.backend.api.routes
FastAPI router implementing the canonical RAGSec API endpoints:
- POST /api/ingest
- POST /api/index
- POST /api/query
- GET /api/evidence/{chunk_id}
- GET /api/health
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from models import (
    QueryRequest, QueryResponse, CanonicalDocument, CanonicalChunk,
    SensitivityTier, IncidentSeverity, ResponseStatus
)
from ingestion.loader import create_canonical_document, load_from_json
from retrieval.chunker import chunk_document
from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore
from retrieval.retriever import Retriever
from governance.policy import evaluate_evidence_policy
from governance.abstention import create_abstention_response
from generation.prompts import build_grounded_prompt
from generation.generator import Generator
from verification.verifier import verify_response
from verification.citations import verify_and_bind_citations

router = APIRouter(prefix="/api", tags=["ragsec"])

# Core Services
embedder = Embedder()
vector_store = VectorStore()
retriever = Retriever(vector_store=vector_store, embedder=embedder)
generator = Generator()

class IngestDocPayload(BaseModel):
    title: Optional[str] = None
    content: str
    source_name: str = "manual_ingest"
    source_type: str = "cti_report" # cve, mitre, cti_report, internal_sop, incident
    sensitivity_tier: SensitivityTier = SensitivityTier.INTERNAL
    publication_timestamp: Optional[str] = None
    url: Optional[str] = None

class IndexBatchPayload(BaseModel):
    documents: List[IngestDocPayload]

@router.get("/health")
def health_check():
    """Health and vector index status."""
    return {
        "status": "healthy",
        "service": "RAGSec-Core",
        "indexed_chunks_count": vector_store.count()
    }

@router.post("/ingest")
def ingest_document(payload: IngestDocPayload):
    """
    Normalizes, chunks, embeds, and indexes a single document.
    """
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")
        
    doc = create_canonical_document(
        content=payload.content,
        source_name=payload.source_name,
        source_type=payload.source_type,
        title=payload.title,
        sensitivity_tier=payload.sensitivity_tier,
        publication_timestamp=payload.publication_timestamp,
        url=payload.url
    )
    
    chunks = chunk_document(doc)
    if chunks:
        texts = [c.text for c in chunks]
        embeddings = embedder.embed_texts(texts)
        vector_store.upsert_chunks(chunks, embeddings)
        
    return {
        "status": "ingested",
        "document_id": doc.document_id,
        "chunks_indexed": len(chunks),
        "content_hash": doc.content_hash,
        "extracted_entities": doc.extracted_entities.model_dump()
    }

@router.post("/index")
def index_batch(payload: IndexBatchPayload):
    """
    Batch ingests and indexes multiple documents.
    """
    total_chunks = 0
    doc_ids = []
    
    for item in payload.documents:
        if not item.content.strip():
            continue
        doc = create_canonical_document(
            content=item.content,
            source_name=item.source_name,
            source_type=item.source_type,
            title=item.title,
            sensitivity_tier=item.sensitivity_tier,
            publication_timestamp=item.publication_timestamp,
            url=item.url
        )
        chunks = chunk_document(doc)
        if chunks:
            texts = [c.text for c in chunks]
            embeddings = embedder.embed_texts(texts)
            vector_store.upsert_chunks(chunks, embeddings)
            total_chunks += len(chunks)
            doc_ids.append(doc.document_id)
            
    return {
        "status": "indexed",
        "documents_count": len(doc_ids),
        "total_chunks_indexed": total_chunks,
        "document_ids": doc_ids
    }

@router.post("/query", response_model=QueryResponse)
def execute_query(req: QueryRequest) -> QueryResponse:
    """
    Executes the full RAGSec SOC Analyst query pipeline:
    1. Retrieve candidate evidence with sensitivity filtering
    2. Apply severity-aware confidence governance
    3. If insufficient -> Return explicit ABSTAINED response
    4. If sufficient -> Build grounded prompt with compliance buffer masking
    5. Run LLM generation with forbidden inference rules
    6. Run post-generation entity grounding and CRC verification
    7. Return stable QueryResponse contract
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    # 1. Retrieval
    candidate_evidence = retriever.retrieve(
        query=req.query,
        allowed_tiers=req.allowed_tiers
    )
    
    # 2. Governance Policy Gate
    policy_check = evaluate_evidence_policy(
        evidence=candidate_evidence,
        severity=req.severity
    )
    
    if not policy_check["passed"]:
        # Pre-generation policy abstention
        return create_abstention_response(
            severity=req.severity,
            reason=policy_check["reason"],
            confidence=policy_check["confidence"],
            retrieval_summary=policy_check["retrieval_summary"]
        )
        
    surviving_evidence = policy_check["surviving_evidence"]
    retrieval_summary = policy_check["retrieval_summary"]
    
    # 3. Grounded Prompt Assembly & Compliance Masking
    prompt, masked_evidence = build_grounded_prompt(req.query, surviving_evidence)
    
    # 4. LLM Generation
    gen_result = generator.generate(prompt)
    raw_answer = gen_result["answer"]
    
    # 5. Verification
    v_result, resp_status = verify_response(
        answer_text=raw_answer,
        evidence=masked_evidence,
        severity=req.severity
    )
    
    # 6. Citations
    citations, _, _ = verify_and_bind_citations(raw_answer, masked_evidence)
    
    return QueryResponse(
        status=resp_status,
        severity=req.severity,
        answer=raw_answer,
        confidence=policy_check["confidence"],
        retrieval=retrieval_summary,
        evidence=masked_evidence,
        citations=citations,
        verification=v_result,
        reason=None
    )

@router.get("/evidence/{chunk_id}")
def get_evidence_chunk(chunk_id: str):
    """Retrieves full text and provenance metadata for a specific chunk."""
    chunk = vector_store.get_chunk_by_id(chunk_id)
    if not chunk:
        raise HTTPException(status_code=404, detail="Evidence chunk not found.")
    return chunk
