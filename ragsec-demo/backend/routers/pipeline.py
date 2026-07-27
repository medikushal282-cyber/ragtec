from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/pipeline", tags=["Data Pipeline"])

@router.get("/topology")
def get_topology():
    return {
        "nodes": [
            {"id": "ingest-1", "type": "ingestion", "status": "active", "label": "CloudTrail Log Stream"},
            {"id": "ingest-2", "type": "ingestion", "status": "active", "label": "CrowdStrike Falcon Events"},
            {"id": "process-1", "type": "processing", "status": "active", "label": "IoC Extractor (NLP)"},
            {"id": "store-1", "type": "storage", "status": "active", "label": "ChromaDB Vectors"},
            {"id": "store-2", "type": "storage", "status": "active", "label": "PostgreSQL Metadata"}
        ],
        "edges": [
            {"source": "ingest-1", "target": "process-1"},
            {"source": "ingest-2", "target": "process-1"},
            {"source": "process-1", "target": "store-1"},
            {"source": "process-1", "target": "store-2"}
        ]
    }

@router.get("/metrics")
def get_pipeline_metrics():
    return {
        "events_per_second": 3450,
        "latency_ms": 12,
        "backlog_size": 0
    }
