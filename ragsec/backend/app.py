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
from config import settings

from contextlib import asynccontextmanager
from ingestion.fim.watcher import FIMWatcher
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize real filesystem FIM watcher on the monitored workspace directory
    workspace_dir = os.environ.get("RAGSEC_MONITORED_DIR", os.path.abspath(os.path.join(os.getcwd(), "..", "..", "monitored_workspace")))
    os.makedirs(workspace_dir, exist_ok=True)
    os.makedirs(os.path.join(workspace_dir, ".quarantine"), exist_ok=True)
    watcher = FIMWatcher(workspace_dir)
    watcher.start()
    yield
    watcher.stop()

app = FastAPI(
    title=settings.APP_NAME,
    description="Clean-slate modular implementation of IEEE RAGSec framework",
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

@app.get("/")
def root_status():
    return {
        "status": "RAGSec Threat Intelligence Core Online",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
