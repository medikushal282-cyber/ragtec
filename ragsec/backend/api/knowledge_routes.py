"""
ragsec.backend.api.knowledge_routes
Endpoints for the Knowledge Base Centre & Threat Intelligence Incubator.
Provides continuous live online exploit synchronization from CISA KEV feeds,
RAG threat comparison against workspace files, and multi-factor threat scoring.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ingestion.live_threat_feed_service import live_threat_feed_service
from analysis.threat_rag_comparator import threat_rag_comparator

router = APIRouter(prefix="/api/knowledge", tags=["knowledge_centre"])

class CompareThreatRequest(BaseModel):
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    content: Optional[str] = None
    process_name: Optional[str] = "fim_watcher"
    process_pid: Optional[int] = 3824
    compare_mode: Optional[str] = "file_and_process_rag"  # Default ON mode

@router.post("/sync-live-feeds")
def sync_live_feeds(limit: int = Query(25, ge=1, le=100)):
    """
    Triggers live ingestion of online hack advisories and CVEs from
    the CISA Known Exploited Vulnerabilities catalog.
    Converts each exploit into an actionable RAG mitigation playbook
    and embeds it into ChromaDB vector store.
    """
    try:
        result = live_threat_feed_service.sync_live_feeds(limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync live feeds: {str(e)}")

@router.get("/live-feed-status")
def get_live_feed_status():
    """
    Returns live threat intelligence feed engine health, last sync time,
    and number of active exploit playbooks cataloged.
    """
    try:
        return live_threat_feed_service.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading feed status: {str(e)}")

@router.post("/compare-threat-file")
def compare_threat_file(req: CompareThreatRequest):
    """
    RAG Threat Matching Comparator:
    Takes an active file or running process from the workspace,
    runs semantic vector search against the Knowledge Base CTI playbooks,
    computes the grounded multi-factor threat score, and returns
    tailored mitigation actions.
    """
    try:
        result = threat_rag_comparator.compare_file_to_knowledge_base(
            file_path=req.file_path,
            file_name=req.file_name,
            content=req.content,
            process_name=req.process_name,
            process_pid=req.process_pid
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/incubator-deck")
def get_incubator_deck_stats():
    """
    Provides aggregated metrics for the Knowledge Base Centre incubator overview.
    """
    status = live_threat_feed_service.get_status()
    return {
        "status": "INCUBATOR_ACTIVE",
        "live_sources": [
            {"name": "CISA Known Exploited Vulnerabilities (KEV)", "status": "ONLINE", "type": "Automated HTTPS JSON Feed"},
            {"name": "NVD CVE Vulnerability Intelligence", "status": "ONLINE", "type": "MITRE ATT&CK Cross-Referenced"},
            {"name": "Ransomware Threat Campaigns Catalog", "status": "ONLINE", "type": "High-Severity Incident Playbooks"}
        ],
        "default_toggles": {
            "file_process_rag_comparator": True,  # DEFAULT SWITCHED ON
            "external_network_live_sources": False  # DEFAULT SWITCHED OFF
        },
        "total_playbooks": status.get("total_knowledge_documents", 0),
        "live_cve_playbooks": status.get("live_exploit_playbooks_count", 0),
        "last_sync": status.get("last_sync", "Realtime"),
        "active_embedding_model": status.get("embedding_model", "BAAI/bge-small-en-v1.5")
    }
