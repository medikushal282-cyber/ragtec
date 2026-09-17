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

    def generate(self, prompt: str) -> Dict[str, Any]:
        """
        Executes generation using the configured provider.
        Returns {"answer": str, "provider": str}.
        """
        # 0. Test Mock
        if os.environ.get("MOCK_LLM"):
            mock_ans = os.environ.get("MOCK_LLM_RESPONSE", "This is a mock answer based on [C1] and [C2].")
            return {"answer": mock_ans, "provider": "mock"}

        # 1. Try Local Ollama
        if self.provider == "ollama":
            try:
                resp = requests.post(
                    f"{self.ollama_url}/api/generate",
                    json={"model": self.model, "prompt": prompt, "stream": False},
                    timeout=45
                )
                if resp.status_code == 200:
                    text = resp.json().get("response", "").strip()
                    if text:
                        return {"answer": text, "provider": "ollama"}
            except Exception as e:
                print(f"[Generator] Ollama connection failed: {e}. Falling back...")

        # 2. Try Google Gemini API if API key is provided
        api_key = self.google_api_key or os.environ.get("GOOGLE_API_KEY", "")
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                resp = requests.post(url, json=payload, timeout=45)
                if resp.status_code == 200:
                    data = resp.json()
                    ans = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if ans:
                        return {"answer": ans, "provider": "gemini"}
            except Exception as e:
                print(f"[Generator] Gemini API connection failed: {e}. Falling back...")

        # 3. Return explicit error state if no LLM is available
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

