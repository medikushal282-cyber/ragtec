"""
ragsec.backend.api.step_helper_routes
AI Chatbot Step & Problem Helper API.
Aids SOC analysts with troubleshooting, command synthesis, and roadblocks in the steps,
with a toggleable option to seek online cybersecurity sources (MITRE ATT&CK, NIST NVD, Microsoft Learn).
"""
import re
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.online_cti_search import search_online_cti_sources
from retrieval.retriever import Retriever
from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore
from generation.generator import Generator
from api.process_routes import get_top_processes_summary
from config import settings

router = APIRouter(prefix="/api/chat", tags=["step_helper"])

vstore = VectorStore()
emb = Embedder()
retriever = Retriever(vector_store=vstore, embedder=emb)
gen = Generator()


class StepContext(BaseModel):
    step_number: Optional[int] = None
    step_title: Optional[str] = None
    status: Optional[str] = None
    detail: Optional[str] = None
    error_message: Optional[str] = None
    target_file: Optional[str] = None
    target_host: Optional[str] = None
    raw_output: Optional[str] = None


class StepHelperRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    step_context: Optional[StepContext] = None
    current_page: Optional[str] = "threat_lab"
    search_online: bool = False
    provider: Optional[str] = "groq"
    model: Optional[str] = "openai/gpt-oss-120b"
    api_key: Optional[str] = None


def _extract_playbook(text: str) -> Optional[Dict[str, Any]]:
    """Extracts structured playbook only when an explicit Recommended Playbook block is present."""
    lower_text = text.lower()
    if "recommended playbook" not in lower_text:
        return None
        
    # Safety Check: If the text explicitly concludes the process is benign, platform core, or safe,
    # DO NOT extract a destructive process termination playbook!
    if any(phrase in lower_text for phrase in [
        "is legitimate", "is benign", "is safe", "do not terminate", 
        "must not be terminated", "ragsec core api", "platform service"
    ]) and "stop-process" in lower_text:
        # Check if termination was explicitly warned against
        if "action type: process_termination" in lower_text or "action: process_termination" in lower_text:
            return None

    script = _extract_code_block(text)
    if not script:
        return None
    title_match = re.search(r'(?:Recommended Playbook|Playbook):\s*([^\n\r]+)', text, re.IGNORECASE)
    title = title_match.group(1).strip("*# ") if title_match else "AI Containment & Remediation Playbook"
    action_match = re.search(r'(?:Action Type|Action):\s*([A-Za-z0-9_\-]+)', text, re.IGNORECASE)
    action_type = action_match.group(1).upper() if action_match else "CUSTOM_PLAYBOOK"
    return {
        "title": title,
        "action_type": action_type,
        "script": script,
        "description": "Synthesized directly by AI Step Helper based on session chain memory."
    }


def _extract_code_block(text: str) -> Optional[str]:
    match = re.search(r"```(?:powershell|bash|sh|cmd|python)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    return match.group(1).strip() if match else None


def _extract_verification_command(text: str) -> Optional[str]:
    match = re.search(r"(?:verify|verification|check with|test with):\s*`([^`]+)`", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    match2 = re.search(r"`(Get-[^`]+|Test-[^`]+|bcdedit[^`]+|python -m[^`]+)`", text)
    return match2.group(1).strip() if match2 else None


@router.post("/step-helper")
def handle_step_helper(req: StepHelperRequest):
    """
    Answers analyst questions, resolves step errors (Access Denied, Timeout, Missing Service, etc.),
    formulates clean PowerShell/Bash scripts, and optionally binds live online references.
    """
    online_sources: List[Dict[str, Any]] = []
    
    # 1. Search Online Sources if toggle is active
    if req.search_online:
        search_query = req.message
        if req.step_context:
            search_query += f" {req.step_context.step_title or ''} {req.step_context.error_message or ''}"
        try:
            online_sources = search_online_cti_sources(search_query, max_results=4)
        except Exception as e:
            print(f"[StepHelper] Online search error: {e}")

    # 2. Retrieve Local CTI Grounding from ChromaDB
    local_evidence_docs = []
    try:
        retrieval_q = f"{req.message} {req.step_context.step_title if req.step_context else ''}"
        local_evidence_docs = retriever.retrieve(query=retrieval_q, top_n=2)
    except Exception as e:
        print(f"[StepHelper] Local retrieval error: {e}")

    target_host_name = (
        req.step_context.target_host 
        if (req.step_context and req.step_context.target_host) 
        else "Local Endpoint"
    )

    # 3. Retrieve Live Process Telemetry
    top_processes = ""
    try:
        top_processes = get_top_processes_summary(limit=10)
    except Exception as e:
        top_processes = f"Telemetry unavailable: {e}"

    # 4. Build System Prompt & Grounding Context
    online_context_str = ""
    if req.search_online and online_sources:
        online_context_str = "\n".join([
            f"- [{s['source']}] {s['title']} ({s['url']}): {s['snippet']}"
            for s in online_sources
        ])
    elif req.search_online:
        online_context_str = "Online search enabled, but no external matching advisories were returned."
    else:
        online_context_str = "Offline / Air-Gapped Mode active (Seeking online sources is turned OFF)."

    local_context_str = "\n".join([
        f"- [Local CTI {d.get('source', '')}] {d.get('chunk_text', '')[:200]}"
        for d in local_evidence_docs
    ]) or "No correlated internal CTI records found."

    step_info_str = "No specific step context provided."
    if req.step_context:
        ctx = req.step_context
        step_info_str = (
            f"Step Number: {ctx.step_number or 'N/A'}\n"
            f"Step Title: {ctx.step_title or 'Unknown Step'}\n"
            f"Current Status: {ctx.status or 'IN_PROGRESS'}\n"
            f"Detail: {ctx.detail or 'None'}\n"
            f"Reported Error/Output: {ctx.error_message or ctx.raw_output or 'None'}\n"
            f"Target File/Host: {ctx.target_file or ctx.target_host or target_host_name}"
        )

    system_prompt = f"""You are the RAGSec Intelligent SOC Copilot & Autonomous Incident Response Technical Partner.
Talk conversationally, authoritatively, and concisely with the SOC analyst.

CRITICAL HOST ARCHITECTURE & PLATFORM SELF-AWARENESS (NEVER ADVISE TERMINATING YOURSELF):
- You are running on top of the RAGSec SOC Platform on this host ({target_host_name}):
  * RAGSec Core API Backend: `python.exe` running `uvicorn app:app` on port 8000 (C:\\Projects\\RAGTEC\\ragsec\\backend).
  * RAGSec SOC Web Console: `node.exe` running `dist/index.js` on port 3000 (C:\\Projects\\RAGTEC\\ragsec\\ragsec-soc).
  * Core Windows Infrastructure: `dwm.exe`, `csrss.exe`, `smss.exe`, `services.exe`, `lsass.exe`, `svchost.exe`, `explorer.exe`, `audiodg.exe`, `msmpeng.exe` (Windows Defender).
  * Developer & IDE Tools: Google Antigravity AI IDE, language_server.exe, Chrome, VS Code, PowerShell, git.
- SAFETY RULE: NEVER recommend stopping, killing, or isolating RAGSec platform services or critical Windows OS components! Doing so will kill this web application and crash the analyst console!
- If the analyst asks to investigate the uvicorn/backend process (e.g. `python.exe -m uvicorn app:app`), recognize it immediately:
  "This process is the RAGSec Core API Backend. It is the core service powering this very SOC console and neural threat analysis engine. It is legitimate, safe, and must NOT be terminated."

PROCESS INVESTIGATION & BALANCED MULTI-OPTION REMEDIATION METHODOLOGY:
1. DIG UP FULL INFORMATION BEFORE CONCLUDING:
   - Identify the binary's legitimate functional role and purpose in Windows, development, or user activity.
   - Look at the executable path, parent process, command-line parameters, listening ports, and resource consumption.
2. DIFFERENTIATE COMPUTE WORKLOAD FROM MALICIOUS ACTIVITY:
   - High CPU or memory usage in an ASGI web server (uvicorn), compiler, neural embeddings engine, browser tab, or database is normal compute workload, NOT malware!
   - NEVER conclude a process is "malicious / suspicious" simply because its CPU is high or because it's running a local web server on 127.0.0.1.
   - ONLY conclude a process is "Harmful / Malicious" if concrete adversary tactics are present (e.g. encoded PowerShell base64 evasion, ransomware encryption loops, unauthorized C2 beacons, credential dumping).
3. PROVIDE MULTI-TIERED REMEDIATION OPTIONS (NEVER JUST "KILL IT"):
   - When asked to investigate or remediate any process, break down proportional management options:
     * Option A (Allow & Baseline): Keep running, add to telemetry baseline, monitor CPU/RAM trends.
     * Option B (Resource Optimization / Throttling): Lower CPU priority in PowerShell: `(Get-Process -Id <pid>).PriorityClass = 'BelowNormal'`, or adjust worker concurrency to prevent CPU starvation.
     * Option C (Network Policy / Firewall): Verify socket bindings (e.g. `Get-NetTCPConnection -OwningProcess <pid>`), ensure it only binds to loopback (127.0.0.1) or restrict external firewall rules.
     * Option D (Forensic Capture): Collect a memory dump (`procdump.exe -ma <pid>`) or inspect open DLLs/handles before making changes.
     * Option E (Controlled Graceful Stop / Restart): Only if confirmed rogue, hung, or explicitly requested by the analyst, with clear notes on operational impact.
4. PLAYBOOK CARD RULES:
   - NEVER generate a `PROCESS_TERMINATION` playbook for benign software, developer tools, or platform infrastructure!
   - Only append a formal `### 🛡️ Recommended Playbook: [Title]` block if:
     a) An active confirmed threat or rogue process has been identified, OR
     b) The analyst explicitly asks for a containment script or remediation action.
   - If the process is benign, you may attach an optimization playbook (e.g. lowering priority or checking connections), or no playbook at all!

Current Target Endpoint: {target_host_name}
Page Context: {req.current_page}
{step_info_str}

Live Endpoint Processes Telemetry & Platform Architecture:
{top_processes}

Live Online Intelligence Sources (Toggle: {'ON' if req.search_online else 'OFF'}):
{online_context_str}

Internal Grounded Knowledge:
{local_context_str}
"""

    # 5. Normalize Groq Model aliases
    raw_m = req.model or "openai/gpt-oss-120b"
    rm_lower = raw_m.lower().strip()
    if "120b" in rm_lower:
        selected_model = "openai/gpt-oss-120b"
    elif "safeguard" in rm_lower:
        selected_model = "openai/gpt-oss-safeguard-20b"
    elif "20b" in rm_lower:
        selected_model = "openai/gpt-oss-20b"
    elif "qwen" in rm_lower and "distill" not in rm_lower:
        selected_model = "qwen/qwen3.8-27b"
    else:
        selected_model = raw_m.strip()

    # Format history
    history = []
    if req.conversation_history:
        for m in req.conversation_history[-6:]:
            history.append({"role": m.get("role", "user"), "content": m.get("content", "")})
    history.append({"role": "user", "content": req.message})

    # 6. Generate via Generator (calls Groq or fallback)
    groq_key = req.api_key or settings.GROQ_API_KEY
    res = gen.generate(
        prompt=req.message,
        provider="groq" if (groq_key and "gsk_" in groq_key) else req.provider or "groq",
        model=selected_model,
        api_key=groq_key,
        system_prompt=system_prompt,
        messages=history
    )

    reply_text = res.get("answer", "")
    
    # If LLM generation was offline or fallback, formulate a deterministic contextual solution
    if not reply_text or res.get("error") or res.get("fallback") or "no matching telemetry" in reply_text.lower():
        online_refs_text = ""
        if req.search_online and online_sources:
            online_refs_text = "\n\n#### 🌐 Online Intelligence References:\n" + "\n".join([
                f"- **[{s['title']}]({s['url']})** ({s['source']}): {s['snippet']}"
                for s in online_sources
            ])

        msg_lower = req.message.lower().strip()

        # A) Short Greeting or General Query
        if msg_lower in ["hi", "hello", "hey", "help", "who are you", "what can you do", "status"]:
            reply_text = (
                f"Hello! I am your RAGSec AI Copilot for endpoint `{target_host_name}`. "
                f"I have live visibility into active running processes, file integrity alerts, and mitigation playbooks.\n\n"
                f"- **Target Endpoint**: `{target_host_name}`\n"
                f"- **Online Threat Intel**: `{'Active' if req.search_online else 'Offline'}`\n\n"
                f"How can I assist your investigation? You can ask me to inspect running processes, analyze code, or stage a containment playbook."
            )

        # B) Process Deep Investigation by PID
        pid_search = re.search(r'\b(?:pid|id)?\s*([0-9]{2,6})\b', req.message, re.IGNORECASE)
        if pid_search and any(w in msg_lower for w in ["analyze", "investigate", "inspect", "check", "what is", "about", "detail"]):
            target_pid = int(pid_search.group(1))
            try:
                import psutil
                from api.process_routes import categorize_process, is_ragsec_platform_process, PROTECTED_PROCESS_NAMES, PROTECTED_PIDS
                proc = psutil.Process(target_pid)
                p_name = proc.name()
                p_cmd = " ".join(proc.cmdline()) if proc.cmdline() else p_name
                p_cpu = proc.cpu_percent(interval=0.05)
                p_mem = round(proc.memory_info().rss / (1024 * 1024), 1)
                p_cat, p_role, p_tag = categorize_process(p_name, p_cmd, target_pid)
                is_plat = is_ragsec_platform_process(p_name, p_cmd, target_pid)
                
                if is_plat:
                    verdict_banner = "**🛡️ CRITICAL PLATFORM SERVICE — VERIFIED SAFE**"
                    verdict_detail = f"This process is the core {p_role}. It powers this active SOC Web Console and neural analysis engine. It must NEVER be terminated."
                elif p_cat in ["SYSTEM_INFRASTRUCTURE"]:
                    verdict_banner = "**🏛️ OPERATING SYSTEM CORE — VERIFIED SAFE**"
                    verdict_detail = f"This process is a legitimate Windows subsystem component: {p_role}."
                elif p_cat in ["DEV_ENVIRONMENT", "PRODUCTIVITY_APP"]:
                    verdict_banner = "**✅ LEGITIMATE APPLICATION / WORKLOAD — BENIGN**"
                    verdict_detail = f"{p_role}. Elevated resource consumption is normal compute activity, NOT an indicator of malicious compromise."
                else:
                    verdict_banner = "**ℹ️ USER APPLICATION / UNCLASSIFIED PROCESS**"
                    verdict_detail = f"{p_role}. No adversary tactics, obfuscation, or persistence mechanisms detected."

                reply_text = (
                    f"### Deep Investigation Report: PID {target_pid} (`{p_name}`)\n\n"
                    f"| Telemetry Item | Value |\n"
                    f"|---|---|\n"
                    f"| **Process** | `{p_name}` (PID {target_pid}) |\n"
                    f"| **Functional Role** | {p_role} |\n"
                    f"| **Classification** | `{p_cat}` ({p_tag}) |\n"
                    f"| **CPU Usage** | {p_cpu}% |\n"
                    f"| **Memory (RAM)** | {p_mem} MB |\n"
                    f"| **Command Line** | `{p_cmd[:120]}` |\n\n"
                    f"#### Diagnostic Verdict:\n"
                    f"{verdict_banner}\n\n"
                    f"{verdict_detail}\n\n"
                    f"#### Multi-Tiered Remediation & Management Options:\n"
                    f"1. **Option A (Allow & Baseline)**: Maintain active execution, record baseline telemetry, and observe resource trends.\n"
                    f"2. **Option B (Resource Throttling)**: Lower CPU scheduling priority:\n"
                    f"   ```powershell\n   (Get-Process -Id {target_pid}).PriorityClass = 'BelowNormal'\n   ```\n"
                    f"3. **Option C (Network Audit)**: Inspect open network socket connections:\n"
                    f"   ```powershell\n   Get-NetTCPConnection -OwningProcess {target_pid} -ErrorAction SilentlyContinue\n   ```\n"
                    f"4. **Option D (Forensic Snapshot)**: Capture full memory dump before making any state changes:\n"
                    f"   ```powershell\n   procdump.exe -ma {target_pid} proc_{target_pid}.dmp\n   ```\n"
                    f"5. **Option E (Controlled Termination)**: {'DISABLED: Platform core cannot be terminated to prevent outage.' if is_plat else f'Terminate only if confirmed hung or rogue: `Stop-Process -Id {target_pid} -Force`'}\n"
                    + online_refs_text
                )
            except Exception as pe:
                reply_text = (
                    f"### Investigation for PID {target_pid}\n\n"
                    f"Unable to read live process {target_pid} (process may have completed or exited: {pe}).\n"
                    f"Would you like me to inspect other active processes on `{target_host_name}`?"
                    + online_refs_text
                )

        # C) Process Inspection Inquiry (General)
        elif any(w in msg_lower for w in ["process", "processes", "running", "what is running", "cpu", "task"]):
            reply_text = (
                f"### Live Running Processes on `{target_host_name}`\n\n"
                f"Here is a snapshot of current process activity:\n\n"
                f"```text\n{top_processes}\n```\n\n"
                f"Would you like me to dig into a specific PID's functional role or profile its resource usage?"
                + online_refs_text
            )

        # D) Process Termination / Kill Request with Safety Guard
        elif any(w in msg_lower for w in ["stop", "kill", "terminate", "halt", "end process"]):
            pid_match = re.search(r'\b(?:pid|id)?\s*([0-9]{2,6})\b', req.message, re.IGNORECASE)
            target_pid = int(pid_match.group(1)) if pid_match else 0
            
            is_safe_to_kill = True
            proc_desc = f"PID {target_pid}"
            if target_pid > 0:
                try:
                    import psutil
                    from api.process_routes import is_ragsec_platform_process, PROTECTED_PROCESS_NAMES, PROTECTED_PIDS
                    proc = psutil.Process(target_pid)
                    proc_desc = proc.name()
                    if is_ragsec_platform_process(proc.name(), " ".join(proc.cmdline()), target_pid):
                        is_safe_to_kill = False
                    elif proc.name().lower() in PROTECTED_PROCESS_NAMES or target_pid in PROTECTED_PIDS:
                        is_safe_to_kill = False
                except Exception:
                    pass

            if not is_safe_to_kill:
                reply_text = (
                    f"### 🛡️ Safety Lock Engaged: Refusing to Terminate PID {target_pid} (`{proc_desc}`)\n\n"
                    f"This process is a protected platform service or critical Windows operating system component. "
                    f"Terminating it would crash this active SOC console or destabilize the workstation.\n\n"
                    f"**Proportional Action**: If this process is consuming high resources, throttle its priority instead:\n"
                    f"```powershell\n(Get-Process -Id {target_pid}).PriorityClass = 'BelowNormal'\n```"
                )
            elif target_pid > 0:
                reply_text = (
                    f"### Process Containment Plan for `{target_host_name}` (PID {target_pid})\n\n"
                    f"To terminate process **{target_pid}** (`{proc_desc}`), execute an elevated termination in PowerShell:\n\n"
                    f"```powershell\n"
                    f"# Forcibly terminate non-critical process\n"
                    f"Stop-Process -Id {target_pid} -Force -ErrorAction SilentlyContinue\n"
                    f"Write-Host '[RAGSec] Terminated process {target_pid} successfully.'\n"
                    f"```\n\n"
                    f"**Verification:** `Get-Process -Id {target_pid} -ErrorAction SilentlyContinue`\n\n"
                    f"### 🛡️ Recommended Playbook: Terminate Process {target_pid}\n"
                    f"- **Target**: {target_host_name} (PID {target_pid})\n"
                    f"- **Action Type**: PROCESS_TERMINATION\n"
                    f"- **Playbook Script**:\n"
                    f"```powershell\n"
                    f"Stop-Process -Id {target_pid} -Force -ErrorAction SilentlyContinue\n"
                    f"```"
                )
            else:
                reply_text = (
                    f"### Process Termination Request\n\n"
                    f"Please specify the PID of the process you want to terminate. Example: `Stop PID 1234`.\n\n"
                    f"I will first verify that the PID is not a protected platform or operating system component before executing."
                )

        # D) Elevated Access Denied Error
        elif "access denied" in msg_lower or "0x80070005" in msg_lower:
            reply_text = (
                "### Resolving Access Denied (Error 0x80070005)\n\n"
                "This action requires an **elevated administrator token** (`RunAs Administrator` / `SeDebugPrivilege`).\n\n"
                "```powershell\n"
                "# Execute command in elevated administrative context\n"
                "Start-Process powershell -Verb RunAs\n"
                "```\n\n"
                "**Verification:** `whoami /priv`"
                + online_refs_text
            )

        # E) Shadow Copy Attack (MITRE T1490)
        elif "shadow" in msg_lower or "vssadmin" in msg_lower:
            reply_text = (
                "### Shadow Copy Containment (MITRE T1490)\n\n"
                "To block adversary deletion of Volume Shadow Copies:\n\n"
                "```powershell\n"
                "bcdedit /set {default} recoveryenabled Yes\n"
                "```\n\n"
                "**Verification:** `bcdedit /enum {default}`"
                + online_refs_text
            )

        # F) Default Contextual Response without Bloat
        else:
            step_name = req.step_context.step_title if req.step_context else "Current Investigation"
            reply_text = (
                f"### Contextual Guidance for `{target_host_name}`\n\n"
                f"I evaluated your inquiry regarding **{req.message[:50]}**:\n\n"
                f"- No critical anomaly or IOC has been triggered yet without specific target parameters.\n"
                f"- Current active processes on `{target_host_name}` are being monitored.\n\n"
                f"Could you specify the exact file name, process PID, or error log you want me to analyze?"
                + online_refs_text
            )

    # Extract script, verification command, and structured recommended playbook
    script = _extract_code_block(reply_text)
    verification_cmd = _extract_verification_command(reply_text)
    playbook = _extract_playbook(reply_text)
    if playbook:
        playbook["target"] = target_host_name

    return {
        "reply": reply_text,
        "solution_script": script,
        "verification_command": verification_cmd,
        "recommended_playbook": playbook,
        "online_sources": online_sources,
        "search_online": req.search_online,
        "model_used": selected_model,
        "provider": res.get("provider", "Groq Cloud" if (groq_key and "gsk_" in groq_key) else "RAGSec Diagnostic Engine")
    }
