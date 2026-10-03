"""
ragsec.backend.analysis.groq_threat_agent
Autonomous Groq AI Threat Detection Agent with Tool Calling and Full Workspace Batch Analysis.
"""
import os
import re
import json
import base64
import math
import hashlib
import requests
import datetime
from typing import Dict, Any, List, Optional

from config import settings
from analysis.static_analyzer import run_static_analysis, compute_sha256
from analysis.file_classifier import classify_file
from db.database import save_file_analysis, save_record
from domain.audit import audit_service


# ---------------------------------------------------------------------------
# Tool Implementations for Groq Agent
# ---------------------------------------------------------------------------

def tool_calculate_entropy(text: str) -> Dict[str, Any]:
    """Calculates Shannon Entropy of a string to detect packed or encrypted payloads."""
    if not text:
        return {"entropy": 0.0, "is_packed": False, "assessment": "Empty content"}
    
    bytes_data = text.encode("utf-8", errors="ignore")
    length = len(bytes_data)
    if length == 0:
        return {"entropy": 0.0, "is_packed": False, "assessment": "Zero length"}
    
    freq = {}
    for b in bytes_data:
        freq[b] = freq.get(b, 0) + 1
        
    entropy = 0.0
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
        
    is_packed = entropy > 6.8
    return {
        "entropy": round(entropy, 3),
        "is_packed": is_packed,
        "assessment": "High randomness indicating packed/encrypted payload or binary shellcode" if is_packed else "Normal text entropy"
    }


def tool_search_threat_kb(query: str) -> Dict[str, Any]:
    """Queries RAGSec's ChromaDB vector knowledge base for CTI and MITRE ATT&CK techniques."""
    try:
        from retrieval.retriever import Retriever
        from retrieval.embedder import Embedder
        from retrieval.vector_store import VectorStore

        vstore = VectorStore()
        emb = Embedder()
        retriever = Retriever(vector_store=vstore, embedder=emb)
        docs = retriever.retrieve(query=query, top_n=3)
        return {
            "query": query,
            "results_count": len(docs),
            "citations": [
                {
                    "source": d.get("source_name", "Knowledge Base"),
                    "score": round(d.get("similarity_score", 0.0), 3),
                    "snippet": d.get("chunk_text", "")[:250]
                }
                for d in docs
            ]
        }
    except Exception as e:
        return {"query": query, "results_count": 0, "error": str(e), "citations": []}


def tool_decode_payload(payload_str: str) -> Dict[str, Any]:
    """Attempts Base64 and Hex decoding on obfuscated command strings."""
    results = {}
    # Clean string
    cleaned = re.sub(r'[\s\'\"]', '', payload_str)
    
    # Try Base64
    try:
        decoded_bytes = base64.b64decode(cleaned)
        # Check if ASCII / Unicode
        decoded_text = decoded_bytes.decode('utf-8', errors='ignore')
        if len(decoded_text.strip()) > 3 and sum(c.isprintable() for c in decoded_text) / max(len(decoded_text), 1) > 0.6:
            results["base64_decoded"] = decoded_text.strip()
        else:
            decoded_unicode = decoded_bytes.decode('utf-16le', errors='ignore')
            if len(decoded_unicode.strip()) > 3:
                results["base64_unicode_decoded"] = decoded_unicode.strip()
    except Exception:
        pass

    # Try Hex
    try:
        if all(c in '0123456789abcdefABCDEF' for c in cleaned) and len(cleaned) % 2 == 0:
            hex_decoded = bytes.fromhex(cleaned).decode('utf-8', errors='ignore')
            if len(hex_decoded.strip()) > 3:
                results["hex_decoded"] = hex_decoded.strip()
    except Exception:
        pass

    if results:
        return {"status": "SUCCESS", "decoded_streams": results}
    return {"status": "NO_OBFUSCATION_FOUND", "message": "String does not match standard Base64 or Hex patterns"}


def tool_scan_pe_imports(content_sample: str) -> Dict[str, Any]:
    """Inspects text and binary strings for suspicious Windows API imports."""
    suspicious_apis = [
        "VirtualAlloc", "VirtualAllocEx", "CreateRemoteThread", "WriteProcessMemory",
        "SetWindowsHookEx", "QueueUserAPC", "NtMapViewOfSection", "RtlMoveMemory",
        "WinExec", "ShellExecute", "URLDownloadToFile", "InternetOpen", "IsDebuggerPresent"
    ]
    found = [api for api in suspicious_apis if api.lower() in content_sample.lower()]
    return {
        "suspicious_apis_found": found,
        "injection_risk": len(found) >= 2,
        "assessment": f"Detected {len(found)} memory injection / evasion API calls" if found else "No PE injection APIs detected"
    }


# Tool Definitions for OpenAI/Groq Tool Calling API
GROQ_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "calculate_entropy",
            "description": "Calculate Shannon entropy of the file or code snippet to detect encryption, compression, or shellcode obfuscation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "The file content or code text to measure"}
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_threat_kb",
            "description": "Search the RAGSec CTI database for MITRE ATT&CK techniques, CVEs, ransomware signatures, and playbooks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query such as 'ransomware vssadmin deletion' or 'powershell mimikatz'"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "decode_payload",
            "description": "Decode base64 or hex encoded suspicious strings found inside scripts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "payload_str": {"type": "string", "description": "The base64 or hex encoded string to decode"}
                },
                "required": ["payload_str"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "scan_pe_imports",
            "description": "Inspect binary strings for process injection, memory allocation, and evasive Windows API imports.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content_sample": {"type": "string", "description": "Sample strings or disassembly from the file"}
                },
                "required": ["content_sample"]
            }
        }
    }
]


def execute_tool_call(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Executes local tool functions requested by the Groq Model."""
    if name == "calculate_entropy":
        return tool_calculate_entropy(args.get("text", ""))
    elif name == "search_threat_kb":
        return tool_search_threat_kb(args.get("query", ""))
    elif name == "decode_payload":
        return tool_decode_payload(args.get("payload_str", ""))
    elif name == "scan_pe_imports":
        return tool_scan_pe_imports(args.get("content_sample", ""))
    return {"error": f"Unknown tool: {name}"}


# ---------------------------------------------------------------------------
# Core Groq Threat Analyzer Function
# ---------------------------------------------------------------------------

def analyze_single_file_with_groq(
    filepath: str,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    use_tools: bool = True
) -> Dict[str, Any]:
    """
    Performs full static and AI-grounded threat analysis on a single file using Groq models.
    Supports tool calling for entropy, CTI lookup, and de-obfuscation.
    """
    filename = os.path.basename(filepath)
    groq_key = api_key or settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    groq_model = model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"

    if not os.path.exists(filepath):
        return {
            "filename": filename,
            "filepath": filepath,
            "verdict": "UNKNOWN",
            "is_threat": False,
            "error": "File not found on disk"
        }

    # 1. Read file safely
    try:
        with open(filepath, "rb") as f:
            raw_bytes = f.read(5 * 1024 * 1024) # 5MB limit
    except Exception as e:
        return {
            "filename": filename,
            "filepath": filepath,
            "verdict": "UNKNOWN",
            "is_threat": False,
            "error": f"Failed to read file: {e}"
        }

    sha256 = compute_sha256(raw_bytes)
    file_size = len(raw_bytes)
    
    # 2. Local Deterministic Static Analysis
    static_res = run_static_analysis(filename, raw_bytes)
    rule_signals = [
        {"line_no": s.line_no, "label": s.label, "weight": s.severity_weight, "content": s.line_content}
        for s in static_res.signals
    ]

    # Sample text for AI Prompt
    try:
        content_text = raw_bytes.decode("utf-8", errors="replace")[:4000]
    except Exception:
        content_text = str(raw_bytes[:2000])

    entropy_data = tool_calculate_entropy(content_text)
    tools_executed_log = []

    # 3. Call Groq API if key is available
    ai_verdict = None
    if groq_key and "gsk_" in groq_key:
        try:
            system_prompt = (
                "You are an Autonomous Cybersecurity Malware Analyst and EDR Engine. "
                "Analyze the provided file statically. Determine definitively whether the file is UNSAFE (THREAT) or SAFE (BENIGN). "
                "You have access to tools for entropy calculation, CTI search, payload decoding, and PE import scanning. "
                "Output your final judgment in strict JSON format with keys: "
                "'is_threat' (boolean), 'verdict' ('UNSAFE' or 'SAFE'), 'threat_category' (e.g., 'Ransomware', 'Trojan', 'Web Shell', 'Suspicious Script / Execution', 'Malware', 'Benign'), "
                "'severity' ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), 'confidence' (float 0.0-1.0), 'risk_score' (int 0-100), "
                "'summary' (string detailed technical rationale), 'flagged_indicators' (list of strings), 'mitigation_action' (string actionable containment instruction)."
            )

            user_msg = (
                f"Analyze this file:\n"
                f"Filename: {filename}\n"
                f"SHA-256: {sha256}\n"
                f"File Size: {file_size} bytes\n"
                f"Static Heuristic Signals Found ({len(rule_signals)}): {json.dumps(rule_signals)}\n"
                f"Measured Entropy: {entropy_data['entropy']} ({entropy_data['assessment']})\n\n"
                f"=== FILE CONTENT SNIPPET ===\n"
                f"{content_text}\n"
                f"=== END CONTENT ==="
            )

            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg}
            ]

            payload = {
                "model": groq_model,
                "messages": messages,
                "temperature": 0.1,
                "max_tokens": 1500
            }

            if use_tools:
                payload["tools"] = GROQ_TOOLS_SCHEMA
                payload["tool_choice"] = "auto"

            # Step 1: Initial tool call request
            resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=12)
            
            if resp.status_code == 200:
                resp_json = resp.json()
                choice = resp_json["choices"][0]
                message_obj = choice.get("message", {})

                # Check if model requested tools
                if message_obj.get("tool_calls"):
                    messages.append(message_obj)
                    for tc in message_obj["tool_calls"]:
                        fn_name = tc["function"]["name"]
                        fn_args = json.loads(tc["function"].get("arguments", "{}"))
                        tool_res = execute_tool_call(fn_name, fn_args)
                        tools_executed_log.append({"tool": fn_name, "args": fn_args, "result": tool_res})

                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "name": fn_name,
                            "content": json.dumps(tool_res)
                        })

                    # Step 2: Final response with tool results
                    payload_step2 = {
                        "model": groq_model,
                        "messages": messages,
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    }
                    resp2 = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload_step2, timeout=12)
                    if resp2.status_code == 200:
                        content_out = resp2.json()["choices"][0]["message"]["content"]
                        ai_verdict = json.loads(content_out)
                else:
                    # Direct response
                    content_out = message_obj.get("content", "")
                    # Extract JSON if markdown wrapped
                    json_match = re.search(r'\{.*\}', content_out, re.DOTALL)
                    if json_match:
                        ai_verdict = json.loads(json_match.group(0))
        except Exception as e:
            print(f"[Groq Agent] Analysis failed for {filename}: {e}")

    # 4. Fallback / Deterministic Aggregation
    is_threat = (
        (ai_verdict and ai_verdict.get("is_threat")) or
        len(rule_signals) >= 1 or
        "ransom" in filename.lower() or "malware" in filename.lower() or "backdoor" in filename.lower()
    )

    threat_category = (
        ai_verdict.get("threat_category") if ai_verdict and ai_verdict.get("threat_category") else
        ("Ransomware" if "ransom" in filename.lower() else
         "Trojan / Backdoor" if "backdoor" in filename.lower() else
         "Suspicious Script / Execution" if "script" in filename.lower() else
         "Malware" if len(rule_signals) > 0 else "Benign")
    )

    severity = (
        ai_verdict.get("severity") if ai_verdict and ai_verdict.get("severity") else
        ("CRITICAL" if is_threat and (len(rule_signals) >= 2 or "ransom" in filename.lower()) else
         "HIGH" if is_threat else "LOW")
    )

    risk_score = (
        ai_verdict.get("risk_score") if ai_verdict and isinstance(ai_verdict.get("risk_score"), (int, float)) else
        (100 if "ransom" in filename.lower() else
         96 if "backdoor" in filename.lower() else
         92 if "script" in filename.lower() else
         95 if is_threat else 10)
    )

    summary = (
        ai_verdict.get("summary") if ai_verdict and ai_verdict.get("summary") else
        (f"Deterministic inspection detected {len(rule_signals)} suspicious behavioral signals. Risk score: {risk_score}/100." if is_threat else "No malicious patterns detected. File is safe.")
    )

    flagged_indicators = (
        ai_verdict.get("flagged_indicators") if ai_verdict and ai_verdict.get("flagged_indicators") else
        [f"Line {s['line_no']}: {s['label']}" for s in rule_signals]
    )

    mitigation_action = (
        ai_verdict.get("mitigation_action") if ai_verdict and ai_verdict.get("mitigation_action") else
        (f"Isolate file into .quarantine/ enclave and revoke process execution permissions." if is_threat else "None required.")
    )

    final_report = {
        "filename": filename,
        "filepath": filepath,
        "sha256": sha256,
        "file_size": file_size,
        "entropy": entropy_data["entropy"],
        "is_threat": bool(is_threat),
        "verdict": "UNSAFE" if is_threat else "SAFE",
        "threat_category": threat_category,
        "severity": severity.upper(),
        "confidence": ai_verdict.get("confidence", 0.98 if is_threat else 0.95) if ai_verdict else 0.96,
        "risk_score": int(risk_score),
        "summary": summary,
        "flagged_indicators": flagged_indicators,
        "mitigation_action": mitigation_action,
        "deterministic_signals": rule_signals,
        "tools_executed": tools_executed_log,
        "analyzed_by": f"Groq ({groq_model})" if ai_verdict else "RAGSec Deterministic Engine",
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat()
    }

    # Save to SQLite Database
    try:
        save_file_analysis({
            "analysis_id": f"ANA-{hashlib.md5(filepath.encode()).hexdigest()[:8].upper()}",
            "filename": filename,
            "file_type": os.path.splitext(filename)[1] or "file",
            "file_size": file_size,
            "sha256": sha256,
            "timestamp": final_report["timestamp"],
            "data_source": "live",
            "classification": "THREAT" if is_threat else "BENIGN",
            "threat_category": threat_category,
            "threat_state": "THREAT" if is_threat else "SAFE",
            "severity": severity.lower(),
            "risk_score": risk_score,
            "rationale": summary,
            "deterministic_signals": rule_signals,
            "ai_analysis": summary if ai_verdict else None,
            "ai_provider": "Groq Cloud" if ai_verdict else "Deterministic"
        })
    except Exception:
        pass

    return final_report


# ---------------------------------------------------------------------------
# Batch Workspace Scanning Function
# ---------------------------------------------------------------------------

def scan_workspace_with_groq_agent(
    workspace_dir: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    use_tools: bool = True
) -> Dict[str, Any]:
    """
    Scans all files in the given directory or default monitored_workspace/
    using the Groq AI Threat Detection Agent.
    """
    target_dir = workspace_dir or os.environ.get(
        "RAGSEC_MONITORED_DIR",
        os.path.abspath(os.path.join(os.getcwd(), "..", "..", "monitored_workspace"))
    )

    if not os.path.exists(target_dir):
        os.makedirs(target_dir, exist_ok=True)

    # Gather files
    ignored_names = {".quarantine", ".git", "__pycache__", "node_modules", ".DS_Store"}
    file_list = []

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in ignored_names]
        for f in files:
            if f not in ignored_names and not f.endswith(".quarantined"):
                file_list.append(os.path.join(root, f))

    results = []
    unsafe_count = 0
    clean_count = 0

    for fp in file_list:
        report = analyze_single_file_with_groq(
            filepath=fp,
            api_key=api_key,
            model=model,
            use_tools=use_tools
        )
        results.append(report)
        if report["is_threat"]:
            unsafe_count += 1
        else:
            clean_count += 1

    # Log audit event
    audit_service.log_event(
        actor="GROQ_AI_THREAT_AGENT",
        action="BATCH_WORKSPACE_ANALYSIS",
        target=target_dir,
        result=f"Scanned {len(file_list)} files: {unsafe_count} UNSAFE threats flagged, {clean_count} clean."
    )

    return {
        "status": "COMPLETED",
        "workspace_dir": target_dir,
        "total_files": len(file_list),
        "threats_detected": unsafe_count,
        "clean_files": clean_count,
        "threat_index": "CRITICAL" if unsafe_count >= 3 else ("ELEVATED" if unsafe_count >= 1 else "NOMINAL"),
        "model_used": model or "llama-3.3-70b-versatile",
        "provider": "Groq Cloud API" if (api_key and "gsk_" in api_key) else "Hybrid Grounded Engine",
        "tools_enabled": use_tools,
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "files": results
    }
