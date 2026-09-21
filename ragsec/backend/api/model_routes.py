"""
ragsec.backend.api.model_routes
API Endpoints for Auto Model Discovery, Local Model Scanning, and Connectivity Validation.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from generation.model_discovery import (
    discover_models_for_provider,
    discover_ollama_models,
    discover_lmstudio_models,
    discover_groq_models,
    discover_openrouter_models,
    discover_gemini_models,
    scan_all_local_engines
)

router = APIRouter(prefix="/api/models", tags=["model_discovery"])


class ModelDiscoveryRequest(BaseModel):
    provider: str = "groq" # "groq" | "openrouter" | "ollama" | "lmstudio" | "gemini"
    api_key: Optional[str] = None
    base_url: Optional[str] = None


@router.post("/discover")
def discover_models(req: ModelDiscoveryRequest):
    """
    Auto-discovers and enumerates available models for a given provider or local server.
    - Ollama: queries local /api/tags
    - LM Studio / LocalAI: queries local /models
    - Groq: queries /openai/v1/models with key
    - OpenRouter: queries /api/v1/models
    - Gemini: queries /v1beta/models with key
    """
    result = discover_models_for_provider(
        provider=req.provider,
        api_key=req.api_key,
        base_url=req.base_url
    )
    return result


@router.get("/local-status")
def get_local_engines_status():
    """
    Quick status probe for all common local LLM engines (Ollama on 11434, LM Studio on 1234).
    """
    return scan_all_local_engines()


@router.get("/providers")
def list_supported_providers():
    """
    Returns metadata for all supported LLM providers and engines.
    """
    return {
        "providers": [
            {
                "id": "groq",
                "name": "Groq Cloud API",
                "type": "cloud",
                "description": "Ultra-low latency inference (Llama 3.3 70B, Mixtral, DeepSeek Distill)",
                "default_model": "llama-3.3-70b-versatile",
                "requires_api_key": True,
                "key_prefix": "gsk_"
            },
            {
                "id": "openrouter",
                "name": "OpenRouter Multi-LLM Gateway",
                "type": "cloud",
                "description": "Access to 400+ models (Claude 3.5/3.7, DeepSeek R1/V3, Llama 3.3, GPT-4o)",
                "default_model": "meta-llama/llama-3.3-70b-instruct",
                "requires_api_key": True,
                "key_prefix": "sk-or-"
            },
            {
                "id": "ollama",
                "name": "Local Ollama Engine",
                "type": "local",
                "description": "Fully offline, private on-premise LLMs (Llama 3.1, DeepSeek R1, Mistral)",
                "default_url": "http://localhost:11434",
                "default_model": "llama3.1",
                "requires_api_key": False
            },
            {
                "id": "lmstudio",
                "name": "Local LM Studio / LocalAI",
                "type": "local",
                "description": "OpenAI-compatible local server running quantized GGUF models",
                "default_url": "http://localhost:1234/v1",
                "default_model": "local-model",
                "requires_api_key": False
            },
            {
                "id": "gemini",
                "name": "Google Gemini API",
                "type": "cloud",
                "description": "Gemini 2.0 Flash & Gemini 1.5 Pro long-context models",
                "default_model": "gemini-2.0-flash",
                "requires_api_key": True,
                "key_prefix": "AIza"
            }
        ]
    }
