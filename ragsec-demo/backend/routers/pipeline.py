from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/v1/pipeline", tags=["Pipeline"])

@router.get("/topology")
def get_topology(db: Session = Depends(get_db)):
    nodes = db.query(models.PipelineNode).all()
    # Mocking edges for visualization
    edges = [
        {"source": "cisa", "target": "ingest"},
        {"source": "ingest", "target": "db"},
        {"source": "ingest", "target": "ws"},
        {"source": "db", "target": "rerank"},
        {"source": "rerank", "target": "copilot"},
        {"source": "copilot", "target": "soc"},
        {"source": "ws", "target": "soc"}
    ]
    return {
        "nodes": [
            {
                "id": n.id,
                "title": n.title,
                "icon": n.icon,
                "desc": n.desc,
                "status": n.status
            } for n in nodes
        ],
        "edges": edges
    }
