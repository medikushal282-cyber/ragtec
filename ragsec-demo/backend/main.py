from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from websocket_manager import manager
from routers import ingest, threats, chat, retrieve, telemetry, analytics, system_status, notifications, investigation, playbooks, patch, knowledge_base, pipeline, settings
from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from database import SessionLocal

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAGSec+ Enterprise Threat Intelligence API",
    description="Backend API powering RAGSec+ SOC Command Center",
    version="2.4.1"
)

def cleanup_old_threats():
    db = SessionLocal()
    try:
        thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        deleted = db.query(models.Threat).filter(models.Threat.created_at < thirty_days_ago).delete()
        db.commit()
        print(f"Cleanup: Removed {deleted} threats older than 30 days.")
    except Exception as e:
        print(f"Cleanup Error: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_old_threats, 'interval', days=1)

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    await manager.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

# CORS middleware (Phase 2: Restricted CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
from routers import auth_router
app.include_router(auth_router.router)
app.include_router(ingest.router)
app.include_router(threats.router)
app.include_router(chat.router)
app.include_router(retrieve.router)
app.include_router(telemetry.router)
app.include_router(analytics.router)
app.include_router(system_status.router)
app.include_router(notifications.router)
app.include_router(investigation.router)
app.include_router(playbooks.router)
app.include_router(patch.router)
app.include_router(knowledge_base.router)
app.include_router(pipeline.router)
app.include_router(settings.router)

from routers import scanner
app.include_router(scanner.router)

@app.get("/")
def read_root():
    return {"status": "RAGSec+ Enterprise API Online", "database": "Connected", "version": "2.4.1"}

@app.websocket("/ws/threats")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == 'ping':
                await websocket.send_text('pong')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
