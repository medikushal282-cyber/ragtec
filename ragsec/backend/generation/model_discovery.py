"""
ragsec.backend.generation.model_discovery
Auto Model Discovery Service for Local (Ollama, LM Studio, LocalAI) and Cloud LLM Providers (Groq, OpenRouter, Gemini).
"""
import requests
from typing import Dict, Any, List, Optional
from config import settings

# Curated Fallback Catalogs
GROQ_CURATED_MODELS = [
    {
        "id": "llama-3.3-70b-versatile",
        "name": "Llama 3.3 70B Versatile",
        "description": "State-of-the-art 70B model with 128k context, ideal for security analysis and IR playbooks.",
        "context_window": 128000,
        "recommended": True,
        "category": "Reasoning & Playbooks"
    },
    {
        "id": "llama-3.1-8b-instant",
        "name": "Llama 3.1 8B Instant",
        "description": "Ultra-low latency model for high-throughput log classification and rapid IOC parsing.",
        "context_window": 128000,
        "recommended": True,
        "category": "Ultra Fast"
    },
    {
        "id": "deepseek-r1-distill-llama-70b",
        "name": "DeepSeek R1 Distill Llama 70B",
        "description": "Deep reasoning model with step-by-step containment logic synthesis.",
        "context_window": 128000,
        "recommended": True,
        "category": "Deep Reasoning"
    },
    {
        "id": "mixtral-8x7b-32768",
        "name": "Mixtral 8x7B MoE (32k)",
        "description": "High performance mixture-of-experts for multi-step forensic triage.",
        "context_window": 32768,
        "recommended": False,
        "category": "Forensics"
    },
    {
        "id": "gemma2-9b-it",
        "name": "Google Gemma 2 9B IT",
        "description": "Compact Google instruction model for code and command generation.",
        "context_window": 8192,
        "recommended": False,
        "category": "Compact"
    }
]

OPENROUTER_TOP_MODELS = [
    {
        "id": "meta-llama/llama-3.3-70b-instruct",
        "name": "Meta: Llama 3.3 70B Instruct",
        "description": "High intelligence general & security model with 128k context.",
        "context_window": 131072,
        "recommended": True,
        "category": "Recommended"
    },
    {
        "id": "deepseek/deepseek-r1",
        "name": "DeepSeek: R1 Reasoning",
        "description": "Advanced multi-stage reasoning model for complex malware eradication.",
        "context_window": 64000,
        "recommended": True,
        "category": "Deep Reasoning"
    },
    {
        "id": "deepseek/deepseek-chat",
        "name": "DeepSeek: V3 671B",
        "description": "Massive 671B parameter foundation model with deep cybersecurity grounding.",
        "context_window": 64000,
        "recommended": True,
        "category": "General Intelligence"
    },
    {
        "id": "anthropic/claude-3.5-sonnet",
        "name": "Anthropic: Claude 3.5 Sonnet",
        "description": "Industry leading coding and playbook synthesis model.",
        "context_window": 200000,
        "recommended": True,
        "category": "Elite Coding & Playbooks"
    },
    {
        "id": "anthropic/claude-3.7-sonnet",
        "name": "Anthropic: Claude 3.7 Sonnet (Hybrid Reasoning)",
        "description": "Latest hybrid thought model with elite cybersecurity capabilities.",
        "context_window": 200000,
        "recommended": True,
        "category": "Elite Coding & Playbooks"
    },
    {
        "id": "openai/gpt-4o",
        "name": "OpenAI: GPT-4o",
        "description": "Omni foundation model for incident response orchestration.",
        "context_window": 128000,
        "recommended": False,
        "category": "General"
    },
    {
        "id": "openai/gpt-4o-mini",
        "name": "OpenAI: GPT-4o-mini",
        "description": "Fast and economical model for automated triage.",
        "context_window": 128000,
        "recommended": False,
        "category": "Fast & Economical"
    },
    {
        "id": "google/gemini-2.0-flash-001",
        "name": "Google: Gemini 2.0 Flash",
        "description": "Sub-second multi-turn reasoning with 1M token context.",
        "context_window": 1048576,
        "recommended": True,
        "category": "Ultra Fast Long-Context"
    },
    {
        "id": "mistralai/mistral-large-2411",
        "name": "Mistral: Large 2411",
        "description": "Top-tier open-weights model for enterprise IR compliance.",
        "context_window": 128000,
        "recommended": False,
        "category": "Enterprise"
    },
    {
        "id": "qwen/qwen-2.5-72b-instruct",
        "name": "Qwen: 2.5 72B Instruct",
        "description": "Strong open multilingual foundation model with deep bash/ps1 coding capability.",
        "context_window": 131072,
        "recommended": False,
        "category": "Coding"
    }
]

OLLAMA_RECOMMENDED_PULLS = [
    {
        "id": "llama3.1",
        "name": "Llama 3.1 8B (Default)",
        "size_formatted": "4.7 GB",
        "recommended": True,
        "command": "ollama run llama3.1"
    },
    {
        "id": "deepseek-r1:8b",
        "name": "DeepSeek R1 8B (Reasoning)",
        "size_formatted": "4.9 GB",
        "recommended": True,
        "command": "ollama run deepseek-r1:8b"
    },
    {
        "id": "mistral:7b",
        "name": "Mistral 7B Instruct",
        "size_formatted": "4.1 GB",
        "recommended": True,
        "command": "ollama run mistral:7b"
    },
    {
        "id": "qwen2.5:7b",
        "name": "Qwen 2.5 7B Instruct",
        "size_formatted": "4.4 GB",
        "recommended": False,
        "command": "ollama run qwen2.5:7b"
    },
    {
        "id": "codellama:7b",
        "name": "CodeLlama 7B (Scripting)",
        "size_formatted": "3.8 GB",
        "recommended": False,
        "command": "ollama run codellama:7b"
    }
]

GEMINI_CURATED_MODELS = [
    {
        "id": "gemini-2.0-flash",
        "name": "Gemini 2.0 Flash (Next-Gen Fast)",
        "description": "High-speed multi-turn generation with Google's latest multimodal architecture.",
        "recommended": True
    },
    {
        "id": "gemini-1.5-pro",
        "name": "Gemini 1.5 Pro (Deep Analysis)",
        "description": "2M token context window for full forensic log analysis and CTI parsing.",
        "recommended": True
    },
    {
        "id": "gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "description": "Lightweight and ultra fast for rapid alert summaries.",
        "recommended": False
    }
]


def _format_bytes(size_bytes: int) -> str:
    if not size_bytes or size_bytes <= 0:
        return ""
    if size_bytes >= 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    return f"{size_bytes / 1024:.1f} KB"


def discover_ollama_models(base_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Scans local Ollama engine via /api/tags and /v1/models.
    Returns live installed models if running, or connection status & recommendations if offline.
    """
    target_url = (base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434").rstrip("/")
    try:
        resp = requests.get(f"{target_url}/api/tags", timeout=(0.8, 1.2))
        if resp.status_code == 200:
            data = resp.json()
            raw_models = data.get("models", [])
            
            discovered = []
            for m in raw_models:
                m_name = m.get("name", "")
                m_size = _format_bytes(m.get("size", 0))
                details = m.get("details", {})
                param_size = details.get("parameter_size", "")
                quant = details.get("quantization_level", "")
                family = details.get("family", "")
                
                desc_parts = [p for p in [param_size, quant, family] if p]
                desc_str = f"Installed Local Model ({', '.join(desc_parts)})" if desc_parts else "Installed Local Model"

                discovered.append({
                    "id": m_name,
                    "name": f"{m_name} ({m_size})" if m_size else m_name,
                    "description": desc_str,
                    "size_formatted": m_size,
                    "details": details,
                    "is_installed": True,
                    "recommended": "llama" in m_name.lower() or "deepseek" in m_name.lower()
                })

            if discovered:
                return {
                    "provider": "ollama",
                    "connected": True,
                    "base_url": target_url,
                    "models": discovered,
                    "default_model": discovered[0]["id"],
                    "message": f"Connected to Ollama! Found {len(discovered)} locally installed models.",
                    "total_count": len(discovered)
                }
            else:
                return {
                    "provider": "ollama",
                    "connected": True,
                    "base_url": target_url,
                    "models": OLLAMA_RECOMMENDED_PULLS,
                    "default_model": "llama3.1",
                    "message": "Ollama is running, but no local models have been pulled yet. Run 'ollama pull llama3.1' in terminal to install.",
                    "total_count": 0
                }
    except Exception as e:
        pass

    return {
        "provider": "ollama",
        "connected": False,
        "base_url": target_url,
        "models": OLLAMA_RECOMMENDED_PULLS,
        "default_model": "llama3.1",
        "error": f"Ollama is offline or unreachable at {target_url}.",
        "help": "Ensure Ollama is started locally (`ollama serve` or open Ollama app) and listening on port 11434.",
        "recommended_command": "ollama run llama3.1"
    }


def discover_lmstudio_models(base_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Scans local LM Studio / LocalAI OpenAI-compatible endpoint (default http://localhost:1234/v1).
    """
    target_url = (base_url or "http://localhost:1234/v1").rstrip("/")
    try:
        resp = requests.get(f"{target_url}/models", timeout=(0.8, 1.2))
        if resp.status_code == 200:
            data = resp.json()
            raw_models = data.get("data", [])
            discovered = []
            for m in raw_models:
                m_id = m.get("id", "")
                discovered.append({
                    "id": m_id,
                    "name": m_id,
                    "description": "LM Studio Local Model",
                    "is_installed": True,
                    "recommended": True
                })
            
            if discovered:
                return {
                    "provider": "lmstudio",
                    "connected": True,
                    "base_url": target_url,
                    "models": discovered,
                    "default_model": discovered[0]["id"],
                    "message": f"Connected to LM Studio! Found {len(discovered)} loaded models.",
                    "total_count": len(discovered)
                }
    except Exception:
        pass

    return {
        "provider": "lmstudio",
        "connected": False,
        "base_url": target_url,
        "models": [
            {"id": "local-model", "name": "Loaded LM Studio Model", "description": "Local model currently loaded in LM Studio", "recommended": True}
        ],
        "default_model": "local-model",
        "error": f"LM Studio is offline or server is not started on {target_url}.",
        "help": "In LM Studio, go to the Developer / Local Server tab (<->) and click 'Start Server'."
    }


def discover_groq_models(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Queries Groq API /openai/v1/models with the user's API key.
    Returns live available models, or curated models if no key provided.
    """
    key = api_key or settings.GROQ_API_KEY
    if not key:
        return {
            "provider": "groq",
            "connected": False,
            "models": GROQ_CURATED_MODELS,
            "default_model": "llama-3.3-70b-versatile",
            "message": "Enter your Groq API Key (starts with gsk_...) to validate connectivity and query live models."
        }

    try:
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        resp = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            raw_models = data.get("data", [])
            
            # Filter active models and sort
            discovered = []
            for m in raw_models:
                m_id = m.get("id", "")
                is_active = m.get("active", True)
                ctx = m.get("context_window", 0)
                
                # Check if it's a known production model
                is_rec = any(rec["id"] == m_id for rec in GROQ_CURATED_MODELS)
                
                discovered.append({
                    "id": m_id,
                    "name": m_id,
                    "description": f"Groq Cloud Model • {ctx:,} tokens ctx" if ctx else "Groq Cloud Model",
                    "context_window": ctx,
                    "active": is_active,
                    "recommended": is_rec or "llama-3.3" in m_id or "r1" in m_id
                })

            # Sort recommended first
            discovered.sort(key=lambda x: (not x["recommended"], x["id"]))

            return {
                "provider": "groq",
                "connected": True,
                "models": discovered if discovered else GROQ_CURATED_MODELS,
                "default_model": "llama-3.3-70b-versatile",
                "message": f"Groq API Key Validated! {len(discovered)} active models available.",
                "total_count": len(discovered)
            }
        elif resp.status_code in (401, 403):
            return {
                "provider": "groq",
                "connected": False,
                "models": GROQ_CURATED_MODELS,
                "default_model": "llama-3.3-70b-versatile",
                "error": "Invalid Groq API Key. Please check the key and retry."
            }
        else:
            return {
                "provider": "groq",
                "connected": False,
                "models": GROQ_CURATED_MODELS,
                "default_model": "llama-3.3-70b-versatile",
                "error": f"Groq API returned status {resp.status_code}: {resp.text[:150]}"
            }
    except Exception as e:
        return {
            "provider": "groq",
            "connected": False,
            "models": GROQ_CURATED_MODELS,
            "default_model": "llama-3.3-70b-versatile",
            "error": f"Failed to reach Groq API: {e}"
        }


def discover_openrouter_models(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Queries OpenRouter API /api/v1/models.
    OpenRouter provides a public catalog of 400+ models. Key enables authenticated validation.
    """
    key = api_key or settings.OPENROUTER_API_KEY
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"

    try:
        resp = requests.get("https://openrouter.ai/api/v1/models", headers=headers, timeout=6.0)
        if resp.status_code == 200:
            data = resp.json()
            raw_models = data.get("data", [])
            
            # Map of top models for priority sorting
            top_ids = {m["id"]: m for m in OPENROUTER_TOP_MODELS}
            
            top_list = []
            other_list = []
            
            for m in raw_models:
                m_id = m.get("id", "")
                m_name = m.get("name", m_id)
                m_desc = m.get("description", "")
                m_ctx = m.get("context_length", 0)
                pricing = m.get("pricing", {})
                
                is_free = False
                if pricing:
                    prompt_price = float(pricing.get("prompt", "0") or 0)
                    is_free = prompt_price == 0.0 or ":free" in m_id

                item = {
                    "id": m_id,
                    "name": m_name,
                    "description": m_desc[:120] + "..." if len(m_desc) > 120 else m_desc,
                    "context_window": m_ctx,
                    "is_free": is_free,
                    "recommended": m_id in top_ids or "llama-3.3" in m_id or "deepseek-r1" in m_id or "claude-3.5" in m_id
                }

                if m_id in top_ids:
                    top_list.append(item)
                else:
                    other_list.append(item)

            # Combine top list with sorted others
            combined = top_list + other_list[:50]  # Cap at 60 top options for fast UI rendering

            return {
                "provider": "openrouter",
                "connected": bool(key),
                "has_key": bool(key),
                "models": combined if combined else OPENROUTER_TOP_MODELS,
                "default_model": "meta-llama/llama-3.3-70b-instruct",
                "message": f"OpenRouter catalog loaded ({len(raw_models)} total models available across all providers)." if not key else f"OpenRouter API Key active! {len(raw_models)} models accessible.",
                "total_count": len(raw_models)
            }
        else:
            return {
                "provider": "openrouter",
                "connected": False,
                "models": OPENROUTER_TOP_MODELS,
                "default_model": "meta-llama/llama-3.3-70b-instruct",
                "error": f"OpenRouter API returned status {resp.status_code}"
            }
    except Exception as e:
        return {
            "provider": "openrouter",
            "connected": False,
            "models": OPENROUTER_TOP_MODELS,
            "default_model": "meta-llama/llama-3.3-70b-instruct",
            "error": f"Failed to connect to OpenRouter: {e}"
        }


def discover_gemini_models(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Queries Google Gemini API for available models supporting generateContent.
    """
    key = api_key or settings.GOOGLE_API_KEY
    if not key:
        return {
            "provider": "gemini",
            "connected": False,
            "models": GEMINI_CURATED_MODELS,
            "default_model": "gemini-2.0-flash",
            "message": "Enter your Google AI Studio Gemini API Key to discover live Google models."
        }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
        resp = requests.get(url, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            raw_models = data.get("models", [])
            
            discovered = []
            for m in raw_models:
                methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in methods:
                    m_name = m.get("name", "").replace("models/", "")
                    disp_name = m.get("displayName", m_name)
                    desc = m.get("description", "")
                    
                    is_rec = "2.0-flash" in m_name or "1.5-pro" in m_name
                    discovered.append({
                        "id": m_name,
                        "name": f"{disp_name} ({m_name})",
                        "description": desc[:100] + "..." if len(desc) > 100 else desc,
                        "recommended": is_rec
                    })

            discovered.sort(key=lambda x: (not x["recommended"], x["id"]))

            return {
                "provider": "gemini",
                "connected": True,
                "models": discovered if discovered else GEMINI_CURATED_MODELS,
                "default_model": "gemini-2.0-flash",
                "message": f"Gemini API Key Validated! Found {len(discovered)} generation models.",
                "total_count": len(discovered)
            }
        else:
            return {
                "provider": "gemini",
                "connected": False,
                "models": GEMINI_CURATED_MODELS,
                "default_model": "gemini-2.0-flash",
                "error": f"Gemini API returned status {resp.status_code}: {resp.text[:150]}"
            }
    except Exception as e:
        return {
            "provider": "gemini",
            "connected": False,
            "models": GEMINI_CURATED_MODELS,
            "default_model": "gemini-2.0-flash",
            "error": f"Failed to connect to Google Gemini API: {e}"
        }


def scan_all_local_engines() -> Dict[str, Any]:
    """
    Scans all common local LLM engine ports on localhost in parallel:
    - 11434: Ollama
    - 1234: LM Studio
    """
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f_ollama = executor.submit(discover_ollama_models, "http://localhost:11434")
        f_lmstudio = executor.submit(discover_lmstudio_models, "http://localhost:1234/v1")
        
        ollama_res = f_ollama.result()
        lmstudio_res = f_lmstudio.result()
    
    return {
        "ollama": ollama_res,
        "lmstudio": lmstudio_res,
        "any_local_connected": ollama_res.get("connected", False) or lmstudio_res.get("connected", False)
    }


def discover_models_for_provider(
    provider: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main dispatcher for model discovery across providers.
    """
    p = (provider or "groq").lower().strip()
    if p == "ollama":
        return discover_ollama_models(base_url)
    elif p in ("lmstudio", "local", "localai"):
        return discover_lmstudio_models(base_url)
    elif p == "groq":
        return discover_groq_models(api_key)
    elif p == "openrouter":
        return discover_openrouter_models(api_key)
    elif p == "gemini":
        return discover_gemini_models(api_key)
    else:
        # Fallback default
        return discover_groq_models(api_key)
