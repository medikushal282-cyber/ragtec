"""
ragsec.backend.app
FastAPI application entrypoint for RAGSec Threat Intelligence Core.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from api.soc_routes import router as soc_router
from config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Clean-slate modular implementation of IEEE RAGSec framework",
    version=settings.APP_VERSION
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
