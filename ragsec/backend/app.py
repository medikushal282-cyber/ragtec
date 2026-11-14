"""
ragsec.backend.app
FastAPI application entrypoint for RAGSec Threat Intelligence Core.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from api.soc_routes import router as soc_router
from api.analysis_routes import router as analysis_router
from api.fim_routes import router as fim_router
from api.model_routes import router as model_router
from api.dashboard_routes import router as dashboard_router
from api.test_routes import router as test_router
from api.audit_routes import router as audit_router
from api.sps_routes import router as sps_router
from api.siem_routes import router as siem_router
from api.governance_routes import router as governance_router
from api.active_threat_routes import router as active_threat_router
from api.threat_lab_routes import router as threat_lab_router
from api.step_helper_routes import router as step_helper_router
from api.process_routes import router as process_router
from api.fleet_routes import router as fleet_router
from api.knowledge_routes import router as knowledge_router
from analysis.active_threat_detector import active_threat_detector
from config import settings, get_canonical_workspace_dir

from contextlib import asynccontextmanager
from ingestion.fim.watcher import FIMWatcher
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize real filesystem FIM watcher on the canonical monitored workspace directory
    workspace_dir = get_canonical_workspace_dir()
    os.makedirs(workspace_dir, exist_ok=True)
    os.makedirs(os.path.join(workspace_dir, ".quarantine"), exist_ok=True)
    os.makedirs(os.path.join(workspace_dir, "replication_sandbox"), exist_ok=True)
    os.makedirs(os.path.join(workspace_dir, "threat_lab"), exist_ok=True)
    watcher = FIMWatcher(workspace_dir)
    watcher.start()

    # Start Active Defense Real-time Interceptor Sentinel Daemon
    active_threat_detector.start_sentinel_daemon()

    yield

    watcher.stop()
    active_threat_detector.stop_sentinel_daemon()

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise modular implementation of RAGSec Threat Intelligence SIEM framework",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(soc_router)
app.include_router(fim_router)
app.include_router(analysis_router)
app.include_router(model_router)
app.include_router(dashboard_router)
app.include_router(test_router)
app.include_router(audit_router)
app.include_router(sps_router)
app.include_router(siem_router)
app.include_router(governance_router)
app.include_router(active_threat_router)
app.include_router(threat_lab_router)
app.include_router(step_helper_router)
app.include_router(process_router)
app.include_router(fleet_router)
app.include_router(knowledge_router)

@app.get("/")
def root_status():
    return {
        "status": "RAGSec Threat Intelligence Core Online",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    import sys
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    uvicorn.run("app:app", app_dir=backend_dir, host="127.0.0.1", port=settings.PORT, reload=settings.DEBUG)
