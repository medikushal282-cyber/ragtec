"""
ragsec.backend.config
Central configuration management using Pydantic Settings.
All thresholds, models, and paths are configurable via environment variables.
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Dict
from pathlib import Path
import os

class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "RAGSec Threat Intelligence Core"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    CHROMA_PERSIST_DIR: str = str(DATA_DIR / "vector_store")
    RAW_DATA_DIR: str = str(DATA_DIR / "raw")
    
    # Embedding Model (Configurable, default: BAAI/bge-small-en-v1.5)
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384
    
    # LLM Settings (Local Ollama / Google Gemini fallback)
    LLM_PROVIDER: str = "ollama" # "ollama" | "gemini" | "mock"
    LLM_MODEL: str = "llama3.2"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GOOGLE_API_KEY: str = ""
    
    # Retrieval Defaults
    RETRIEVAL_TOP_K: int = 6
    MIN_SOURCE_DIVERSITY: int = 2
    
    # Governance: Severity-Aware Thresholds (similarity, confidence)
    # Project implementation values (clearly documented as configurable defaults)
    SEVERITY_THRESHOLDS: Dict[str, Dict[str, float]] = Field(default={
        "low": {"similarity": 0.55, "confidence": 0.55},
        "medium": {"similarity": 0.60, "confidence": 0.60},
        "high": {"similarity": 0.65, "confidence": 0.65},
        "critical": {"similarity": 0.70, "confidence": 0.70},
    })
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
