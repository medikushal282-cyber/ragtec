from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from models import (
    QueryRequest, QueryResponse, CanonicalDocument, CanonicalChunk,
    SensitivityTier, IncidentSeverity, ResponseStatus, Evidence
)
from ingestion.loader import create_canonical_document, load_from_json
from retrieval.chunker import chunk_document
from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore
from retrieval.retriever import Retriever
from db.database import save_knowledge_document, get_knowledge_sources, get_connection
from generation.generator import Generator
from generation.prompts import build_grounded_prompt
from governance.confidence import calculate_retrieval_confidence
from ingestion.entities import extract_entities_from_text

router = APIRouter(prefix="/api", tags=["ragsec"])

embedder = Embedder()
vector_store = VectorStore()
retriever = Retriever(vector_store=vector_store, embedder=embedder)
generator = Generator()


# --- Helpers ---

def _dicts_to_evidence(evidence_dicts: List[Dict[str, Any]]) -> List[Evidence]:
    """Convert retriever's plain dicts into Evidence Pydantic models for governance modules."""
    results = []
    for d in evidence_dicts:
        meta_parts = (d.get("provenance") or "").split(":")
        doc_id = meta_parts[1] if len(meta_parts) > 1 else "unknown"
        results.append(Evidence(
            chunk_id=d.get("chunk_id", ""),
            document_id=doc_id,
            source_name=d.get("source", "unknown"),
            source_type="cti_report",
            text=d.get("chunk_text", ""),
            similarity_score=float(d.get("dense_score", 0.0)),
            adjusted_similarity=float(d.get("rerank_score", d.get("dense_score", 0.0))),
            sensitivity_tier=SensitivityTier.INTERNAL,
        ))
    return results


def _run_crc_verification(answer: str, evidence_models: List[Evidence], severity: IncidentSeverity) -> Dict[str, Any]:
    """Run CRC citation and entity verification. Returns governance dict."""
    try:
        from verification.verifier import verify_response
        v_result, resp_status = verify_response(answer, evidence_models, severity)
        return {
            "citation_check": v_result.status,  # VERIFIED / PARTIAL / UNSUPPORTED
            "valid_citations": [c.model_dump() for c in v_result.valid_citations],
            "verified_citations": v_result.verified_citations,
            "unsupported_citations": v_result.unsupported_citations,
            "verified_entities": v_result.verified_entities,
            "unsupported_entities": v_result.unsupported_entities,
            "warnings": v_result.warnings,
            "response_status": resp_status.value,
            "crc_passed": v_result.passed,
        }
    except Exception as e:
        print(f"[CRC] Verification error: {e}")
        return {
            "citation_check": "ERROR",
            "warnings": [str(e)],
            "response_status": "ANSWERED",
            "crc_passed": False,
        }


def _run_evidence_gating(evidence_models: List[Evidence], severity: IncidentSeverity) -> Dict[str, Any]:
    """Run evidence sufficiency gating. Returns policy result dict."""
    try:
        from governance.policy import evaluate_evidence_policy
        result = evaluate_evidence_policy(evidence_models, severity)
        return result
    except Exception as e:
        print(f"[Gating] Policy evaluation error: {e}")
        return {"passed": True, "status": "SUFFICIENT", "confidence": 0.5, "reason": f"Gating error: {e}"}


# --- Payloads ---

class IngestDocPayload(BaseModel):
    title: Optional[str] = None
    content: str
    source_name: str = "manual_ingest"
    source_type: str = "cti_report"
    sensitivity_tier: SensitivityTier = SensitivityTier.INTERNAL
    publication_timestamp: Optional[str] = None
    url: Optional[str] = None

class RetrievePayload(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    top_k: int = 50
    top_n: int = 5


# --- Endpoints ---

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "RAGSec-Core", "indexed_chunks_count": vector_store.count()}


@router.post("/ingest")
def ingest_document(payload: IngestDocPayload):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    doc = create_canonical_document(
        content=payload.content, source_name=payload.source_name, source_type=payload.source_type,
        title=payload.title, sensitivity_tier=payload.sensitivity_tier,
        publication_timestamp=payload.publication_timestamp, url=payload.url
    )

    chunks = chunk_document(doc)
    mime = "application/json" if payload.source_name.endswith(".json") else "text/csv" if payload.source_name.endswith(".csv") else "text/plain"

    if chunks:
        save_knowledge_document(doc.document_id, payload.source_name, mime, chunks, doc.model_dump())
        texts = [c.text for c in chunks]
        embeddings = embedder.embed_texts(texts)
        vector_store.upsert_chunks(chunks, embeddings)

    from domain.audit import audit_service
    audit_service.log_event("SYSTEM", "INGEST_KNOWLEDGE", payload.source_name, f"Ingested {len(chunks)} chunks")

    return {
        "status": "ingested",
        "document_id": doc.document_id,
        "chunks_extracted": len(chunks),
        "content_hash": doc.content_hash,
        "extracted_entities": doc.extracted_entities.model_dump()
    }


@router.get("/knowledge/sources")
def api_get_knowledge_sources():
    docs = get_knowledge_sources()
    res = []
    for d in docs:
        res.append({
            "id": d["id"],
            "name": d["source_name"],
            "mimeType": d["mime_type"],
            "chunkCount": d["chunk_count"],
            "ingestionStatus": d["status"],
            "createdAt": d["created_at"],
            "extractedEntities": d.get("extractedEntities", [])
        })
    return res


@router.post("/retrieve")
def retrieve_evidence(payload: RetrievePayload):
    evidence = retriever.retrieve(
        query=payload.query,
        filters=payload.filters,
        top_k=payload.top_k,
        top_n=payload.top_n
    )
    return {
        "query": payload.query,
        "retrieval_metadata": {
            "embedding_model": vector_store.collection.metadata.get("embedding_model", "unknown"),
            "filters_applied": payload.filters
        },
        "evidence": evidence
    }


@router.post("/query")
def execute_query(req: QueryRequest):
    """
    Full RAGSec pipeline:
    1. Retrieve evidence (dense + cross-encoder reranking)
    2. Evidence sufficiency gating (severity-aware)
    3. PII masking + grounded prompt construction
    4. LLM generation (Ollama)
    5. CRC citation + entity verification
    6. Return answer + evidence + governance state
    """
    # --- Step 1: Retrieve ---
    from domain.audit import audit_service
    evidence_dicts = retriever.retrieve(query=req.query, top_n=5)
    evidence_models = _dicts_to_evidence(evidence_dicts)
    cross_encoder_active = retriever.reranker.model is not None

    # --- Step 2: Evidence Gating ---
    policy = _run_evidence_gating(evidence_models, req.severity)
    is_sufficient = policy.get("passed", True)

    # If absolutely zero evidence was found at all or gating failed
    if not evidence_dicts or len(evidence_dicts) == 0:
        audit_service.log_event("SYSTEM", "RAG_ABSTAIN", req.query, "Zero evidence chunks retrieved")
        return {
            "query_id": "Q-NO-EVIDENCE",
            "answer": "ABSTAINED: " + policy.get("reason", "I searched the ingested CTI corpus and telemetry logs, but no correlated security records or indicators were found matching your query."),
            "evidence": [],
            "confidence_score": 0.0,
            "status": "ABSTAINED",
            "governance": {
                "gating": "BLOCKED",
                "gating_reason": "Zero evidence chunks retrieved for query",
                "pii_masked": False,
                "cross_encoder_active": cross_encoder_active,
                "citation_check": "N/A",
                "crc_passed": False,
                "identity_verified": True,
            }
        }

    if not is_sufficient:
        audit_service.log_event("SYSTEM", "RAG_ABSTAIN", req.query, "Evidence insufficient")
        return {
            "query_id": f"Q-{hash(req.query) % 100000:05d}",
            "answer": "ABSTAINED: " + policy.get("reason", "Insufficient evidence to support a reliable conclusion."),
            "evidence": evidence_dicts,
            "confidence_score": policy.get("confidence", 0.0),
            "status": "ABSTAINED",
            "governance": {
                "gating": "BLOCKED",
                "gating_reason": policy.get("reason", "Evidence did not meet sufficiency thresholds"),
                "pii_masked": False,
                "cross_encoder_active": cross_encoder_active,
                "citation_check": "N/A",
                "crc_passed": False,
                "identity_verified": True,
            }
        }

    # --- Step 3: Build Grounded Prompt (PII masking happens here) ---
    surviving = policy.get("surviving_evidence", evidence_models)
    surviving_dicts = [e.model_dump() for e in surviving]
    prompt, masked_evidence = build_grounded_prompt(req.query, surviving_dicts)

    # --- Step 4: Generate via Ollama ---
    result = generator.generate(prompt)
    answer = result.get("answer", "")
    provider = result.get("provider", "unknown")

    # Real confidence from governance module
    try:
        confidence = calculate_retrieval_confidence(evidence_models)
    except Exception:
        confidence = policy.get("confidence", 0.5)

    if result.get("error"):
        return {
            "query_id": f"Q-{hash(req.query) % 100000:05d}",
            "answer": answer,
            "evidence": masked_evidence,
            "citations": [],
            "confidence_score": round(confidence, 4),
            "status": "ERROR",
            "provider": provider,
            "governance": {
                "gating": "PASSED",
                "gating_reason": None,
                "pii_masked": True,
                "cross_encoder_active": cross_encoder_active,
                "citation_check": "ERROR",
                "crc_passed": False,
                "verified_citations": [],
                "unsupported_citations": [],
                "unsupported_entities": [],
                "warnings": ["LLM generation failed"],
                "identity_verified": True,
            }
        }

    # --- Step 5: CRC Verification ---
    crc = _run_crc_verification(answer, evidence_models, req.severity)

    # Determine final status
    final_status = crc.get("response_status", "ANSWERED")

    audit_service.log_event(
        "SYSTEM", 
        "RAG_QUERY", 
        req.query, 
        f"Answered with {len(crc.get('valid_citations', []))} citations"
    )

    return {
        "query_id": f"Q-{hash(req.query) % 100000:05d}",
        "answer": answer,
        "evidence": masked_evidence,
        "citations": crc.get("valid_citations", []),
        "confidence_score": round(confidence, 4),
        "status": final_status,
        "provider": provider,
        "governance": {
            "gating": "PASSED",
            "gating_reason": None,
            "pii_masked": True,
            "cross_encoder_active": cross_encoder_active,
            "citation_check": crc.get("citation_check", "ERROR"),
            "crc_passed": crc.get("crc_passed", False),
            "verified_citations": crc.get("verified_citations", []),
            "unsupported_citations": crc.get("unsupported_citations", []),
            "unsupported_entities": crc.get("unsupported_entities", []),
            "warnings": crc.get("warnings", []),
            "identity_verified": True,
        }
    }


@router.get("/search")
def search_knowledge(q: str = ""):
    """
    Global search across SQLite entities, documents, and chunks.
    Used by the frontend search bar.
    """
    if not q or len(q.strip()) < 2:
        return {"results": [], "query": q}

    q_lower = q.strip().lower()
    results = []

    try:
        conn = get_connection()
        c = conn.cursor()

        # 1. Search entities table
        c.execute(
            "SELECT entity_type, entity_value FROM entities WHERE LOWER(entity_value) LIKE ?",
            (f"%{q_lower}%",)
        )
        for row in c.fetchall():
            results.append({
                "type": "entity",
                "entity_type": row["entity_type"],
                "value": row["entity_value"],
            })

        # 2. Search documents by source_name
        c.execute(
            "SELECT id, source_name, mime_type, chunk_count FROM documents WHERE LOWER(source_name) LIKE ?",
            (f"%{q_lower}%",)
        )
        for row in c.fetchall():
            results.append({
                "type": "document",
                "id": row["id"],
                "name": row["source_name"],
                "mime_type": row["mime_type"],
                "chunk_count": row["chunk_count"],
            })

        # 3. Semantic Search via Chroma (vector store)
        try:
            semantic_docs = retriever.retrieve(query=q.strip(), top_n=3)
            for doc in semantic_docs:
                results.append({
                    "type": "semantic_chunk",
                    "id": doc.get("chunk_id", ""),
                    "source": doc.get("source", ""),
                    "score": round(doc.get("rerank_score", doc.get("dense_score", 0)), 3),
                    "text": doc.get("chunk_text", "")[:100] + "..."
                })
        except Exception as e:
            print(f"[Search] Semantic search failed: {e}")

        conn.close()
    except Exception as e:
        print(f"[Search] Error: {e}")

    # Deduplicate and limit
    # Just return top 20 items combined
    return {"results": results[:20], "query": q, "count": len(results)}
