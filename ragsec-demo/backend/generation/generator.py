"""
generation/generator.py
Calls the LLM with the grounded prompt and post-processes for citation completeness.
"""
import re
import os
import requests

OLLAMA_API_URL = "http://localhost:11434/api/generate"

def _call_ollama(prompt: str, model: str = "llama3.2") -> str | None:
    try:
        resp = requests.post(OLLAMA_API_URL, json={
            "model": model,
            "prompt": prompt,
            "stream": False
        }, timeout=90)
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except Exception as e:
        print(f"[Generator] Ollama unavailable: {e}")
        return None


def _call_google(prompt: str) -> str | None:
    """Call Google Gemini API if GOOGLE_API_KEY is set."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        resp = requests.post(url, json=payload, timeout=90)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"[Generator] Google API error: {e}")
        return None


CITATION_RE = re.compile(r'\[C\d+\]')

def _check_citation_coverage(text: str, num_chunks: int) -> dict:
    """
    Check that generated sentences are cited.
    Returns {uncited_sentences: [...], cited_count: int, total: int}
    """
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 20]
    uncited = [s for s in sentences if not CITATION_RE.search(s)]
    cited = len(sentences) - len(uncited)
    return {
        "uncited_sentences": uncited,
        "cited_count": cited,
        "total_sentences": len(sentences)
    }


def generate(prompt: str, masked_chunks: list[dict], model: str = "llama3.2") -> dict:
    """
    Run the LLM and validate citation coverage.
    Returns: {answer, citation_check, flagged, raw_answer}
    """
    # Try Ollama first, then Google if available
    raw = _call_ollama(prompt, model)
    provider = "ollama"
    if raw is None:
        raw = _call_google(prompt)
        provider = "google"
    if raw is None:
        # Structured fallback that makes clear this is a mock
        fallback_refs = " ".join(f"[C{i+1}]" for i in range(min(3, len(masked_chunks))))
        raw = (
            f"⚠️ **LLM Unavailable** — No local (Ollama) or cloud (Google) model responded.\n\n"
            f"Based on retrieved evidence {fallback_refs}, a real answer would be generated here. "
            f"To enable live inference:\n"
            f"- **Local**: Start Ollama (`ollama serve`) and pull `llama3.2`\n"
            f"- **Cloud**: Set `GOOGLE_API_KEY` environment variable"
        )
        provider = "fallback"

    citation_check = _check_citation_coverage(raw, len(masked_chunks))
    # Flag if >30% of sentences are uncited
    total = citation_check["total_sentences"]
    uncited = len(citation_check["uncited_sentences"])
    flagged = (total > 0) and (uncited / total > 0.30)

    return {
        "answer": raw,
        "provider": provider,
        "citation_check": citation_check,
        "flagged": flagged
    }
