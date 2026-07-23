from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from websocket_manager import manager
from routers import ingest, threats

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAGSec API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ingest.router)
app.include_router(threats.router)

@app.get("/")
def read_root():
    return {"status": "RAGSec API Online", "database": "Connected"}

@app.websocket("/ws/threats")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, though we only push from backend
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
