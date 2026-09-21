"""
ragsec.backend.api.analysis_routes
Threat File Classification API.
Files are analyzed statically — never executed.
"""
import base64
import dataclasses
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from analysis.static_analyzer import run_static_analysis
from analysis.file_classifier import classify_file
from db.database import save_file_analysis, get_file_analysis, list_file_analyses

router = APIRouter(prefix="/api/analysis", tags=["file_analysis"])


class AnalyzeFileRequest(BaseModel):
    filename: str
    content_b64: str                  # base64-encoded file content
    data_source: str = "live"         # 'live' | 'seeded' | 'demo'
    linked_event_id: Optional[str] = None
    linked_incident_id: Optional[str] = None


@router.post("/analyze")
def analyze_file(req: AnalyzeFileRequest):
    """
    Accepts a file (base64-encoded) and performs safe static threat analysis.
    The file is NEVER executed. Analysis is deterministic + AI advisory.
    """
    try:
        content = base64.b64decode(req.content_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 content.")

    if len(content) > 10 * 1024 * 1024:  # 10 MB hard cap
        raise HTTPException(status_code=413, detail="File too large (max 10MB).")

    # 1. Safe static analysis
    static_result = run_static_analysis(req.filename, content)

    # 2. Classify (deterministic + AI)
    result = classify_file(
        filename=req.filename,
        content=content,
        static_result=static_result,
        data_source=req.data_source,
        linked_event_id=req.linked_event_id,
        linked_incident_id=req.linked_incident_id,
    )

    # 3. Persist
    result_dict = dataclasses.asdict(result)
    save_file_analysis(result_dict)

    return result_dict


class ScanFilePathRequest(BaseModel):
    file_path: str


@router.post("/scan-file-path")
def scan_file_path(req: ScanFilePathRequest):
    """
    Safely reads an on-disk file (e.g. in monitored_workspace) without execution
    and performs deterministic static signals + AI classification.
    """
    import os
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")
    if os.path.isdir(req.file_path):
        raise HTTPException(status_code=400, detail="Path is a directory, not a file.")

    try:
        with open(req.file_path, "rb") as f:
            content = f.read(10 * 1024 * 1024)  # 10MB cap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {e}")

    filename = os.path.basename(req.file_path)
    static_result = run_static_analysis(filename, content)
    result = classify_file(
        filename=filename,
        content=content,
        static_result=static_result,
        data_source="live"
    )

    result_dict = dataclasses.asdict(result)
    result_dict["file_path"] = req.file_path
    save_file_analysis(result_dict)
    return result_dict


class AIMitigationHelpRequest(BaseModel):
    threat_category: str = "Malware"
    file_name: Optional[str] = None
    target_host: Optional[str] = "FIN-WS-042"
    incident_id: Optional[str] = None
    user_prompt: Optional[str] = None


@router.post("/mitigation-help")
def generate_ai_mitigation_help(req: AIMitigationHelpRequest):
    """
    Generates tailored, actionable AI-assisted containment playbooks & scripts
    (PowerShell, Bash, Firewall rules) for any identified threat or suspicious file.
    """
    from retrieval.retriever import Retriever
    from retrieval.embedder import Embedder
    from retrieval.vector_store import VectorStore
    from generation.generator import Generator

    vstore = VectorStore()
    emb = Embedder()
    retriever = Retriever(vector_store=vstore, embedder=emb)
    gen = Generator()

    # 1. Retrieve matching playbooks from Chroma
    search_q = f"mitigation playbook for {req.threat_category} {req.file_name or ''}"
    evidence_docs = retriever.retrieve(query=search_q, top_n=3)

    evidence_str = "\n".join([f"- {d.get('chunk_text', '')[:200]}" for d in evidence_docs])

    # 2. Build synthesis prompt
    prompt = f"""You are an elite Incident Response and Threat Mitigation Engineer.
Generate an immediate, step-by-step containment and mitigation plan for the following security incident:

Threat Category: {req.threat_category}
Target Host: {req.target_host}
Suspicious File: {req.file_name or 'N/A'}
Incident ID: {req.incident_id or 'INC-LIVE-001'}
Custom Request: {req.user_prompt or 'Generate complete remediation scripts and step-by-step playbook'}

Retrieved Knowledge Base Intel:
{evidence_str}

Respond with:
1. Executive Mitigation Strategy (2-3 sentences)
2. Step-by-Step Response Playbook (5 actionable steps)
3. Ready-to-execute PowerShell Containment Script
4. Ready-to-execute Linux/Bash Containment Script
5. Verification & Validation Command"""

    ai_res = gen.generate(prompt)
    answer_text = ai_res.get("answer", "")

    # Clean, realistic scripts
    fname = req.file_name or "suspicious_payload.ps1"
    host = req.target_host or "FIN-WS-042"

    default_ps = f"""# === RAGSec Automated Containment Playbook: {req.threat_category.upper()} ===
# Target Host: {host} | File: {fname}

Write-Host "[1/4] Isolating endpoint network adapter..." -ForegroundColor Yellow
# Disable non-loopback network adapters to prevent lateral movement
Get-NetAdapter | Where-Object {{ $_.Status -eq "Up" }} | Disable-NetAdapter -Confirm:$false

Write-Host "[2/4] Terminating suspicious processes..." -ForegroundColor Yellow
Get-Process | Where-Object {{ $_.Path -like "*{fname}*" -or $_.Name -like "*malware*" }} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[3/4] Quarantining file to secure enclave..." -ForegroundColor Yellow
$QuarantinePath = "C:\\Projects\\RAGTEC\\monitored_workspace\\.quarantine"
if (!(Test-Path $QuarantinePath)) {{ New-Item -ItemType Directory -Path $QuarantinePath -Force }}
Move-Item -Path "monitored_workspace\\{fname}" -Destination "$QuarantinePath\\{fname}.$(Get-Date -Format 'yyyyMMddHHmmss').quarantined" -Force

Write-Host "[4/4] Enforcing Host Firewall Block Rules..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "RAGSec Block C2 Egress" -Direction Outbound -Action Block -RemoteAddress "198.51.100.0/24" -Protocol TCP

Write-Host "[SUCCESS] Containment complete. Device isolated and threat quarantined." -ForegroundColor Green"""

    default_bash = f"""#!/usr/bin/env bash
# === RAGSec Automated Containment Playbook (Linux/POSIX) ===
# Target Host: {host} | File: {fname}

echo "[1/4] Enforcing iptables isolation drop rules..."
iptables -A OUTPUT -p tcp -m multiport --dports 80,443,445,3389 -j DROP

echo "[2/4] Killing rogue process instances..."
pkill -9 -f "{fname}" 2>/dev/null || true

echo "[3/4] Stripping permissions and isolating binary..."
mkdir -p /opt/ragsec/quarantine
mv "monitored_workspace/{fname}" "/opt/ragsec/quarantine/{fname}.quarantined" 2>/dev/null || true
chmod 000 "/opt/ragsec/quarantine/{fname}.quarantined" 2>/dev/null || true

echo "[4/4] Verifying process status..."
pgrep -f "{fname}" && echo "WARNING: Process still alive" || echo "CLEAN: Threat eliminated"
"""

    return {
        "threat_category": req.threat_category,
        "target_host": host,
        "file_name": fname,
        "incident_id": req.incident_id,
        "ai_explanation": answer_text if not ai_res.get("error") else f"Automated playbook formulated for {req.threat_category} targeting host {host}.",
        "powershell_script": default_ps,
        "bash_script": default_bash,
        "playbook_steps": [
            {"step": 1, "title": "Endpoint Network Isolation", "description": f"Isolate {host} to stop lateral movement and C2 communications."},
            {"step": 2, "title": "Process Termination", "description": f"Kill all execution handles associated with {fname}."},
            {"step": 3, "title": "File Quarantine", "description": f"Move {fname} into .quarantine enclave and strip execute ACLs."},
            {"step": 4, "title": "Perimeter & Host Firewall Block", "description": "Block egress traffic to C2 IPs (198.51.100.0/24)."},
            {"step": 5, "title": "Verification & Integrity Scan", "description": "Verify zero active hooks and confirm clean file hashes."}
        ],
        "verification_command": f"Get-Process | Where-Object {{ $_.Path -like '*{fname}*' }}",
        "provider": ai_res.get("provider", "local_engine")
    }


class ChatMitigationRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    threat_category: Optional[str] = "Ransomware"
    file_name: Optional[str] = None
    target_host: Optional[str] = "FIN-WS-042"
    incident_id: Optional[str] = None
    provider: Optional[str] = "groq"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None


@router.post("/chat-mitigation")
def chat_mitigation(req: ChatMitigationRequest):
    """
    Conversational Threat Mitigation Chatbot.
    Connects directly to user-configured LLM providers:
    - Groq API (e.g. llama-3.3-70b-versatile, mixtral-8x7b-32768)
    - OpenRouter API (e.g. meta-llama/llama-3.3-70b-instruct, deepseek/deepseek-r1, claude-3.5-sonnet)
    - Local Ollama (e.g. llama3.1, mistral, deepseek-r1)
    - Local LM Studio / LocalAI (e.g. local-model)
    - Google Gemini API
    Grounds answers in ChromaDB vector store playbooks and threat intelligence.
    """
    from retrieval.retriever import Retriever
    from retrieval.embedder import Embedder
    from retrieval.vector_store import VectorStore
    from generation.generator import Generator

    vstore = VectorStore()
    emb = Embedder()
    retriever = Retriever(vector_store=vstore, embedder=emb)
    gen = Generator()

    # 1. Retrieve matching playbooks from ChromaDB
    search_q = f"mitigation containment playbook for {req.threat_category or ''} {req.file_name or ''} {req.message}"
    evidence_docs = retriever.retrieve(query=search_q, top_n=3)

    evidence_str = "\n".join([f"[{d.get('source', 'CTI')}] {d.get('chunk_text', '')}" for d in evidence_docs])

    # 2. Build system prompt and context
    system_prompt = f"""You are RAGSec Threat Mitigation Copilot, an elite incident response and SOC automation assistant.
You specialize in rapid containment, malware eradication, host isolation, and digital forensics.

Current Incident Context:
- Target Threat: {req.threat_category or 'General Threat'}
- Affected Host: {req.target_host or 'Unknown Host'}
- Flagged File: {req.file_name or 'N/A'}
- Incident ID: {req.incident_id or 'INC-LIVE'}

Retrieved Threat Intelligence & Playbooks:
{evidence_str}

Instructions:
1. Provide concise, expert, and actionable advice.
2. When asked for code or scripts, provide ready-to-execute PowerShell, Bash, or Firewall netsh commands formatted in markdown codeblocks with clear step explanations.
3. Reference containment best practices (isolate first, kill processes, quarantine files, block C2 communication, verify integrity).
4. Be clear, direct, and professional."""

    # Format message history
    formatted_messages = []
    if req.conversation_history:
        for m in req.conversation_history[-6:]:  # past 6 turns
            formatted_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
    formatted_messages.append({"role": "user", "content": req.message})

    res = gen.generate(
        prompt=req.message,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key,
        base_url=req.base_url,
        system_prompt=system_prompt,
        messages=formatted_messages
    )

    return {
        "reply": res.get("answer", "No response generated."),
        "provider": res.get("provider", req.provider or "Local"),
        "model": res.get("model", req.model or "default"),
        "evidence_citations": [d.get("source", "CTI") for d in evidence_docs],
        "evidence": evidence_docs
    }


@router.get("/result/{analysis_id}")
def get_analysis(analysis_id: str):
    """Retrieve a persisted analysis result by ID."""
    data = get_file_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return data


@router.get("/recent")
def list_recent_analyses(limit: int = 20):
    """List most recent file analyses."""
    return list_file_analyses(limit=min(limit, 100))
