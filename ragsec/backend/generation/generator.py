"""
ragsec.backend.generation.generator
Executes LLM inference against the governed prompt.
Configurable providers: Ollama, Google Gemini, or deterministic structured fallback.
"""
import os
import requests
from typing import Dict, Any, Optional
from config import settings

class Generator:
    def __init__(
        self,
        provider: str = settings.LLM_PROVIDER,
        model: str = settings.LLM_MODEL,
        ollama_url: str = settings.OLLAMA_BASE_URL,
        google_api_key: str = settings.GOOGLE_API_KEY
    ):
        self.provider = provider
        self.model = model
        self.ollama_url = ollama_url
        self.google_api_key = google_api_key

    def generate(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        system_prompt: Optional[str] = None,
        messages: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Executes generation using the configured or explicitly requested provider:
        - groq: Fast Llama-3.3-70b / Mixtral via Groq API
        - openrouter: OpenRouter API (Claude, Llama, DeepSeek, Mistral, GPT-4o)
        - ollama: Local Ollama server (default http://localhost:11434)
        - lmstudio / local: LM Studio or OpenAI-compatible local server (default http://localhost:1234/v1)
        - gemini: Google Gemini API (gemini-2.0-flash, gemini-1.5-pro, etc.)
        """
        selected_provider = (provider or self.provider or "ollama").lower()
        
        # 0. Test Mock
        if os.environ.get("MOCK_LLM") or selected_provider == "mock":
            mock_ans = os.environ.get("MOCK_LLM_RESPONSE", "This is a mock answer grounded in retrieved security playbooks.")
            return {"answer": mock_ans, "provider": "mock", "model": "mock"}

        # 1. Try Groq API
        if (selected_provider == "groq" or (api_key and "gsk_" in api_key)) and (api_key or settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")):
            groq_key = api_key or settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
            groq_model = model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"
            if groq_key:
                try:
                    chat_msgs = []
                    if system_prompt:
                        chat_msgs.append({"role": "system", "content": system_prompt})
                    if messages:
                        chat_msgs.extend(messages)
                    else:
                        chat_msgs.append({"role": "user", "content": prompt})

                    headers = {
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": groq_model,
                        "messages": chat_msgs,
                        "temperature": 0.2,
                        "max_tokens": 2048
                    }
                    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=8)
                    if resp.status_code == 200:
                        data = resp.json()
                        ans = data["choices"][0]["message"]["content"].strip()
                        if ans:
                            return {"answer": ans, "provider": "Groq Cloud", "model": groq_model}
                    else:
                        print(f"[Generator] Groq API returned status {resp.status_code}: {resp.text}")
                except Exception as e:
                    print(f"[Generator] Groq API request failed: {e}. Falling back...")

        # 2. Try OpenRouter API
        if (selected_provider == "openrouter" or (api_key and "sk-or-" in api_key)) and (api_key or settings.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY")):
            or_key = api_key or settings.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY", "")
            or_model = model or settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct"
            if or_key:
                try:
                    chat_msgs = []
                    if system_prompt:
                        chat_msgs.append({"role": "system", "content": system_prompt})
                    if messages:
                        chat_msgs.extend(messages)
                    else:
                        chat_msgs.append({"role": "user", "content": prompt})

                    headers = {
                        "Authorization": f"Bearer {or_key}",
                        "HTTP-Referer": "https://ragsec.local",
                        "X-Title": "RAGSec SOC Copilot",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": or_model,
                        "messages": chat_msgs,
                        "temperature": 0.2,
                        "max_tokens": 2048
                    }
                    resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=8)
                    if resp.status_code == 200:
                        data = resp.json()
                        ans = data["choices"][0]["message"]["content"].strip()
                        if ans:
                            return {"answer": ans, "provider": "OpenRouter Cloud", "model": or_model}
                    else:
                        print(f"[Generator] OpenRouter API returned status {resp.status_code}: {resp.text}")
                except Exception as e:
                    print(f"[Generator] OpenRouter API request failed: {e}. Falling back...")

        # 3. Try Local Ollama
        if selected_provider == "ollama":
            ollama_url = (base_url or self.ollama_url or "http://localhost:11434").rstrip("/")
            ollama_model = model or self.model or "llama3.1"
            try:
                # First try chat API with quick connection timeout
                chat_msgs = []
                if system_prompt:
                    chat_msgs.append({"role": "system", "content": system_prompt})
                if messages:
                    chat_msgs.extend(messages)
                else:
                    chat_msgs.append({"role": "user", "content": prompt})

                chat_resp = requests.post(
                    f"{ollama_url}/api/chat",
                    json={"model": ollama_model, "messages": chat_msgs, "stream": False},
                    timeout=(1.5, 10.0)
                )
                if chat_resp.status_code == 200:
                    text = chat_resp.json().get("message", {}).get("content", "").strip()
                    if text:
                        return {"answer": text, "provider": "Local Ollama", "model": ollama_model}

                # Fallback to generate endpoint
                gen_resp = requests.post(
                    f"{ollama_url}/api/generate",
                    json={"model": ollama_model, "prompt": prompt, "system": system_prompt or "", "stream": False},
                    timeout=(1.5, 10.0)
                )
                if gen_resp.status_code == 200:
                    text = gen_resp.json().get("response", "").strip()
                    if text:
                        return {"answer": text, "provider": "Local Ollama", "model": ollama_model}
            except Exception as e:
                print(f"[Generator] Ollama connection failed: {e}. Falling back...")

        # 4. Try LM Studio / Local OpenAI Compatible
        if selected_provider in ("lmstudio", "local", "localai"):
            lms_url = (base_url or "http://localhost:1234/v1").rstrip("/")
            lms_model = model or "local-model"
            try:
                chat_msgs = []
                if system_prompt:
                    chat_msgs.append({"role": "system", "content": system_prompt})
                if messages:
                    chat_msgs.extend(messages)
                else:
                    chat_msgs.append({"role": "user", "content": prompt})

                payload = {
                    "model": lms_model,
                    "messages": chat_msgs,
                    "temperature": 0.2,
                    "max_tokens": 2048
                }
                resp = requests.post(f"{lms_url}/chat/completions", json=payload, timeout=(1.5, 10.0))
                if resp.status_code == 200:
                    data = resp.json()
                    ans = data["choices"][0]["message"]["content"].strip()
                    if ans:
                        return {"answer": ans, "provider": "LM Studio Local", "model": lms_model}
            except Exception as e:
                print(f"[Generator] LM Studio / Local server failed: {e}. Falling back...")

        # 5. Try Google Gemini API
        gemini_key = api_key or self.google_api_key or os.environ.get("GOOGLE_API_KEY", "")
        if gemini_key or selected_provider == "gemini":
            if gemini_key:
                gemini_model = (model or "gemini-2.0-flash").replace("models/", "")
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"
                    combined_text = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                    payload = {"contents": [{"parts": [{"text": combined_text}]}]}
                    resp = requests.post(url, json=payload, timeout=45)
                    if resp.status_code == 200:
                        data = resp.json()
                        ans = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if ans:
                            return {"answer": ans, "provider": "Google Gemini", "model": gemini_model}
                except Exception as e:
                    print(f"[Generator] Gemini API connection failed: {e}. Falling back...")

        # 6. Fallback Grounded Synthesizer
        try:
            synthesized = self._synthesize_natural_answer(prompt)
            return {
                "answer": synthesized,
                "provider": "RAGSec Grounded Playbook Engine",
                "model": "SOC Heuristics (Offline Fallback)",
                "fallback": True
            }
        except Exception:
            return {
                "answer": "ERROR: LLM unavailable or timed out. Unable to generate grounded response.",
                "provider": "error",
                "error": True
            }

    def _synthesize_natural_answer(self, prompt: str) -> str:
        """
        Synthesizes a fluent, natural cybersecurity analyst answer directly answering
        the user's specific query from the evidence without using rigid templates.
        """
        import re

        # Extract query
        query_match = re.search(r"### (?:USER QUERY|INCIDENT QUERY):\s*\n(.*?)(?=\n###|$)", prompt, re.DOTALL)
        query = query_match.group(1).strip() if query_match else ""

        # Extract evidence blocks
        ev_matches = re.findall(r"\[(C\d+)\][^\n]*\n(.*?)(?=(?:\n\[C\d+\]|\n###|$))", prompt, re.DOTALL)
        
        if not ev_matches:
            # Fallback if format is slightly different
            ev_matches = re.findall(r"\[(C\d+)\]\s*(.*?)(?=(?:\[C\d+\]|###|$))", prompt, re.DOTALL)

        if not ev_matches:
            return "I analyzed your query against the ingested threat corpus, but no matching telemetry or intelligence records were found for that subject."

        # Extract key entities across evidence
        cves = []
        ttps = []
        iocs = []
        hosts = []
        key_facts = []

        for tag, text in ev_matches:
            # Find CVEs
            for cve in re.findall(r"CVE-\d{4}-\d{4,7}", text, re.IGNORECASE):
                if cve.upper() not in cves:
                    cves.append(cve.upper())
            # Find TTPs
            for ttp in re.findall(r"T\d{4}(?:\.\d{3})?", text):
                if ttp not in ttps:
                    ttps.append(ttp)
            # Find Hashes / IPs / Domains
            for h in re.findall(r"\b[a-f0-9]{32,64}\b", text, re.IGNORECASE):
                if h not in iocs:
                    iocs.append(h)
            for ip in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", text):
                if ip not in iocs and not ip.startswith("127."):
                    iocs.append(ip)
            for d in re.findall(r"\b[a-zA-Z0-9-]+\.(?:xyz|com|net|org|ru|top)\b", text):
                if d not in iocs:
                    iocs.append(d)
            # Find hosts
            for host in re.findall(r"\b(?:WS|FIN|DMZ|CORP|ENG|OPS|EDGE)-[A-Z0-9-]+\b", text):
                if host not in hosts:
                    hosts.append(host)

            # Grab first clean sentence of chunk for fact grounding
            clean_lines = [l.strip() for l in text.split("\n") if l.strip() and not l.startswith("Entities:") and not l.startswith("RERANK:")]
            if clean_lines:
                key_facts.append((tag, clean_lines[0]))

        # Synthesize conversational paragraphs
        paragraphs = []
        
        # Primary summary sentence
        first_tag, first_fact = key_facts[0] if key_facts else ("C1", "telemetry observed in the monitored environment")
        paragraphs.append(f"Based on the threat intelligence telemetry in the corpus [{first_tag}], {first_fact[:1].lower() + first_fact[1:] if not first_fact.startswith('http') else first_fact} [{first_tag}].")

        # Technical context & indicators
        tech_points = []
        if cves:
            tech_points.append(f"the adversary exploits vulnerability **{', '.join(cves)}** for code execution")
        if ttps:
            tech_points.append(f"techniques mapped to **{', '.join(ttps)}** were identified during execution")
        if hosts:
            tech_points.append(f"activity directly impacts enterprise host(s) **{', '.join(hosts)}**")
        if iocs:
            ioc_sample = ", ".join([f"`{i}`" for i in iocs[:3]])
            tech_points.append(f"associated indicators of compromise include {ioc_sample}")

        if tech_points:
            secondary_tag = key_facts[1][0] if len(key_facts) > 1 else first_tag
            paragraphs.append(f"Investigation confirms that {'; additionally, '.join(tech_points)} [{secondary_tag}].")

        # Contextual mitigation recommendation
        if "cve" in query.lower() or "patch" in query.lower() or cves:
            paragraphs.append(f"**Recommended Action:** Immediately apply the vendor security patch addressing {', '.join(cves) if cves else 'the identified CVE'} and isolate unpatched endpoints from the network segment.")
        elif "ioc" in query.lower() or "ip" in query.lower() or "hash" in query.lower():
            paragraphs.append(f"**Recommended Action:** Ingest the identified IOCs into edge firewalls and endpoint detection sensors to block egress communications.")
        else:
            paragraphs.append(f"**Recommended Action:** Quarantine any dropped payloads into the secure enclave, conduct memory process triage on affected endpoints, and verify filesystem integrity.")

        return "\n\n".join(paragraphs)

