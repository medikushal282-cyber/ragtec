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


@router.get("/discover")
def discover_models_get(
    provider: str = "groq",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None
):
    """GET handler for model discovery with query parameters."""
    return discover_models_for_provider(
        provider=provider,
        api_key=api_key,
        base_url=base_url
    )



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
                "description": "Ultra-low latency inference (GPT-OSS 120B, GPT-OSS 20B, Safeguard 20B, Qwen 3.8)",
                "default_model": "openai/gpt-oss-120b",
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


# Global in-memory Active Brain state
_ACTIVE_BRAIN_STATE: Dict[str, Any] = {
    "model": "openai/gpt-oss-120b",
    "provider": "groq",
    "name": "GPT-OSS 120B Flagship (Groq LPU)",
    "tier_name": "Flagship Reasoning",
    "badge": "120B Flagship",
    "context_window": 131072,
    "category": "Flagship Reasoning",
    "description": "Groq Flagship 120B parameter reasoning model with 131k context. Top-tier multi-stage cybersecurity threat correlation, reverse engineering, and mitigation playbooks."
}


@router.get("/groq-top-tier")
def get_groq_top_tier_models():
    """
    Returns curated top-tier models verified on Groq API suited for cybersecurity tasks.
    """
    from generation.model_discovery import GROQ_CURATED_MODELS
    return {
        "status": "success",
        "provider": "groq",
        "models": GROQ_CURATED_MODELS,
        "default_model": "openai/gpt-oss-120b"
    }


class ActiveBrainPayload(BaseModel):
    model: str
    provider: Optional[str] = "groq"
    api_key: Optional[str] = None


@router.get("/active-brain")
def get_active_brain():
    """
    Returns the currently active AI Brain for the entire platform.
    """
    return {
        "active_brain": _ACTIVE_BRAIN_STATE,
        "status": "active"
    }


@router.post("/active-brain")
def set_active_brain(payload: ActiveBrainPayload):
    """
    Updates the globally active AI Brain across all SOC scanners, copilots, and helpers.
    """
    from generation.model_discovery import GROQ_CURATED_MODELS
    matched = next((m for m in GROQ_CURATED_MODELS if m["id"] == payload.model), None)
    
    _ACTIVE_BRAIN_STATE["model"] = payload.model
    _ACTIVE_BRAIN_STATE["provider"] = payload.provider or "groq"
    if matched:
        _ACTIVE_BRAIN_STATE["name"] = matched.get("name", payload.model)
        _ACTIVE_BRAIN_STATE["tier_name"] = matched.get("category", "Selected Groq Model")
        _ACTIVE_BRAIN_STATE["badge"] = matched.get("badge", "Groq AI")
        _ACTIVE_BRAIN_STATE["context_window"] = matched.get("context_window", 128000)
        _ACTIVE_BRAIN_STATE["description"] = matched.get("description", "")
    else:
        _ACTIVE_BRAIN_STATE["name"] = payload.model
        _ACTIVE_BRAIN_STATE["tier_name"] = "Custom Model"
        _ACTIVE_BRAIN_STATE["badge"] = "Custom"

    return {
        "status": "updated",
        "active_brain": _ACTIVE_BRAIN_STATE
    }


class TestKeyPayload(BaseModel):
    api_key: str
    model: Optional[str] = "openai/gpt-oss-120b"


@router.post("/test-groq-key")
def test_groq_key(payload: TestKeyPayload):
    """
    Tests live Groq API key connectivity, measures ping latency, and lists active models.
    """
    import time
    import requests
    key = payload.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Groq API key cannot be empty.")
    
    if not key.startswith("gsk_"):
        return {
            "valid": False,
            "connected": False,
            "latency_ms": 0,
            "error": "Invalid format: Groq API keys must begin with 'gsk_'."
        }

    start = time.time()
    try:
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        resp = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=5.0)
        latency = round((time.time() - start) * 1000)
        
        if resp.status_code == 200:
            data = resp.json()
            models_list = [m.get("id") for m in data.get("data", []) if m.get("active", True)]
            return {
                "valid": True,
                "connected": True,
                "latency_ms": latency,
                "message": f"Groq LPU Connected! ({latency}ms latency)",
                "active_models_count": len(models_list),
                "model_available": payload.model in models_list
            }
        else:
            return {
                "valid": False,
                "connected": False,
                "latency_ms": latency,
                "error": f"Groq API returned HTTP {resp.status_code}: {resp.text[:120]}"
            }
    except Exception as e:
        return {
            "valid": False,
            "connected": False,
            "latency_ms": 0,
            "error": f"Connection timed out or failed: {e}"
        }

