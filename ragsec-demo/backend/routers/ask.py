"""
routers/ask.py
POST /api/ask — the full RAGSec pipeline:
  retrieve → gate → mask → prompt → generate → return with citations
"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from retrieval.retriever import retrieve_and_gate
from masking.mask import mask_chunk
from generation.prompt_template import build_prompt
from generation.generator import generate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ask", tags=["ask"])


class AskRequest(BaseModel):
    query: str
    allowed_tiers: Optional[List[str]] = ["public", "internal"]
    model: Optional[str] = "llama3.2"


@router.post("/")
def handle_ask(req: AskRequest):
    """
    Full RAGSec grounded generation pipeline.

    Returns:
      - status: "answered" | "abstained"
      - answer: the generated text (only if answered)
      - citations: list of source chunks [C1..Cn] for UI rendering
      - abstention_reason: string (only if abstained)
      - nearest_chunks: top-3 nearest (only if abstained)
      - verification: citation coverage metrics
      - flagged: bool (true = post-generation check found uncited claims)
    """
    # ── Step 1: Retrieve & Gate ───────────────────────────────────────
    retrieval = retrieve_and_gate(req.query, allowed_tiers=req.allowed_tiers)

    if retrieval["status"] == "insufficient":
        nearest = retrieval.get("nearest_chunks", [])
        return {
            "status": "abstained",
            "abstention_reason": retrieval.get("reason", "Insufficient evidence."),
            "nearest_chunks": [
                {
                    "label": f"N{i+1}",
                    "source_type": c["metadata"].get("source_type", "unknown"),
                    "similarity": round(c["similarity"], 4),
                    "snippet": c["text"][:200],
                    "url": c["metadata"].get("url", None),
                    "title": c["metadata"].get("title", ""),
                }
                for i, c in enumerate(nearest[:3])
            ],
        }

    # ── Step 2: Mask chunks before prompt assembly ─────────────────────
    surviving_chunks = retrieval["chunks"]
    masked_chunks = []
    for chunk in surviving_chunks:
        masked_text, redactions = mask_chunk(chunk["text"])
        masked_chunks.append({
            "original_text": chunk["text"],
            "masked_text": masked_text,
            "redactions": redactions,
            "source_type": chunk["metadata"].get("source_type", "unknown"),
            "parent_doc_id": chunk["metadata"].get("parent_doc_id", ""),
            "published_date": chunk["metadata"].get("published_date", ""),
            "url": chunk["metadata"].get("url", None),
            "title": chunk["metadata"].get("title", ""),
            "similarity": round(chunk["similarity"], 4),
            "chunk_id": chunk.get("chunk_id", ""),
        })

    # Log masked prompt for audit/inspection (redaction verification)
    prompt = build_prompt(req.query, masked_chunks)
    logger.info("[ASK] Outgoing prompt (first 600 chars):\n%s", prompt[:600])

    # ── Step 3: Generate with citation enforcement ─────────────────────
    gen_result = generate(prompt, masked_chunks, model=req.model)

    # ── Step 4: Build citation map for UI ──────────────────────────────
    citations = [
        {
            "label": f"C{i+1}",
            "source_type": c["source_type"],
            "similarity": c["similarity"],
            "snippet": c["original_text"][:300],
            "url": c.get("url"),
            "title": c.get("title", ""),
            "published_date": c.get("published_date", ""),
        }
        for i, c in enumerate(masked_chunks)
    ]

    return {
        "status": "answered",
        "answer": gen_result["answer"],
        "provider": gen_result["provider"],
        "flagged": gen_result["flagged"],
        "citations": citations,
        "verification": gen_result["citation_check"],
        "retrieval_metrics": retrieval.get("metrics", {}),
    }
