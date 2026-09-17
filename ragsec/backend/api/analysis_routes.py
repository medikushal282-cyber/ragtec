"""
ragsec.backend.api.analysis_routes
Threat File Classification API.
Files are analyzed statically — never executed.
"""
import base64
import dataclasses
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from analysis.static_analyzer import run_static_analysis
from analysis.file_classifier import classify_file
from db.database import save_file_analysis, get_file_analysis, list_file_analyses

router = APIRouter(prefix="/api/analysis", tags=["file_analysis"])


class AnalyzeFileRequest(BaseModel):
    filename: str
    content_b64: str                  # base64-encoded file content
    data_source: str = "live"         # 'live' | 'seeded' | 'demo'
    linked_event_id: Optional[str] = None
    linked_incident_id: Optional[str] = None


@router.post("/analyze")
def analyze_file(req: AnalyzeFileRequest):
    """
    Accepts a file (base64-encoded) and performs safe static threat analysis.
    The file is NEVER executed. Analysis is deterministic + AI advisory.
    """
    try:
        content = base64.b64decode(req.content_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 content.")

    if len(content) > 10 * 1024 * 1024:  # 10 MB hard cap
        raise HTTPException(status_code=413, detail="File too large (max 10MB).")

    # 1. Safe static analysis
    static_result = run_static_analysis(req.filename, content)

    # 2. Classify (deterministic + AI)
    result = classify_file(
        filename=req.filename,
        content=content,
        static_result=static_result,
        data_source=req.data_source,
        linked_event_id=req.linked_event_id,
        linked_incident_id=req.linked_incident_id,
    )

    # 3. Persist
    result_dict = dataclasses.asdict(result)
    save_file_analysis(result_dict)

    return result_dict


@router.get("/result/{analysis_id}")
def get_analysis(analysis_id: str):
    """Retrieve a persisted analysis result by ID."""
    data = get_file_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return data


@router.get("/recent")
def list_recent_analyses(limit: int = 20):
    """List most recent file analyses."""
    return list_file_analyses(limit=min(limit, 100))
