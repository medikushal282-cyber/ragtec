# Comprehensive Technical Audit & System Handoff Report: RAGSec / RAGTEC
**Document Target:** Claude Sonnet (Technical Architecture & Engineering Handoff)  
**Date:** October 2026  
**Repository:** `medikushal282-cyber/ragtec` (`main` branch)  
**Base Framework Reference:** IEEE Transactions Framework on Grounded Retrieval-Augmented Generation for Cybersecurity Operations (RAGSec v1.0)  

---

## 1. Executive Summary & System Purpose

**RAGSec** is an enterprise-grade Autonomous Security Operations Center (SOC) Copilot and Active Defense Platform. It bridges the gap between **passive, ungrounded LLM hallucinations** and **active, verifiable threat containment**. 

### Core Capabilities:
1. **Live File Integrity Monitoring (FIM)**: Kernel-level filesystem surveillance on `monitored_workspace/` using Python `watchdog`, capturing sub-120ms file modifications (`CREATED`, `MODIFIED`, `DELETED`).
2. **Dual-Stage Dense + Cross-Encoder Retrieval**: Bi-encoder vector search (`BAAI/bge-small-en-v1.5`, 384 dimensions) into **ChromaDB**, followed by deep cross-attention reranking (`cross-encoder/ms-marco-MiniLM-L-6-v2`) to eliminate false-positive Cyber Threat Intelligence (CTI) correlations.
3. **Autonomous Groq AI Threat Agent**: Tool-calling agent equipped with Shannon byte entropy calculation (\(H > 6.8\)), PE header import table analysis, Base64 decoding, and vector CTI searches.
4. **Harmless Active Replicator & Sentinel Interceptor**: Controlled in-memory replicator thread (`ControlledReplicatorThread`) bounded to safe marker files in `replication_sandbox/`. Intercepted by a real-time autonomous sentinel daemon (`ActiveThreatDetector`) that kills the process, permanently blacklists the signature, and moves files to an isolated `.quarantine/` enclave.
5. **Cryptographic Tamper-Evident Ledger**: Blockchain-style SHA-256 chained hash audit trail (\(h_i = \text{SHA256}(h_{i-1} \parallel \text{data}_i)\)) that prevents log tampering.
6. **Multi-Provider SOC Copilot**: Frontend support for Groq, OpenRouter, Local Ollama, LM Studio, and Google Gemini with live model auto-discovery.

---

## 2. Global Repository & Directory Layout

```
c:\Projects\RAGTEC\
├── monitored_workspace\                 # Live filesystem monitored by Watchdog FIM
│   ├── .quarantine\                     # Isolated quarantine enclave (.quarantined files)
│   ├── replication_sandbox\             # Bounded directory for controlled harmless replicator
│   └── [active monitored files]        # Monitored files (*.exe, *.py, *.txt, *.ps1)
│
├── ragsec\
│   ├── backend\                         # FastAPI Python 3.13 / 3.15 Core (Port 8000)
│   │   ├── analysis\                    # Active detection, replicators, Groq agent, static analyzer
│   │   ├── api\                         # 13 REST API router modules
│   │   ├── connectors\                  # SIEM & ticketing exports (ServiceNow, Splunk, Sentinel)
│   │   ├── db\                          # SQLite connection and table management
│   │   ├── domain\                      # Pydantic domain models, audit service, SOC entities
│   │   ├── evaluation\                  # SPS (Security Performance Score) evaluation engine
│   │   ├── generation\                  # Prompt templates, model discovery, LLM generators
│   │   ├── governance\                  # PII compliance masking, abstention gating, CRC verification
│   │   ├── ingestion\                   # FIM watcher, scanner, normalization, entity extraction
│   │   ├── pipeline\                    # Event pipeline, threat classifiers, rules
│   │   ├── retrieval\                   # Chunker, BGE embedder, ChromaDB store, Cross-Encoder reranker
│   │   ├── verification\                # Citation Redundancy Check (CRC), hallucination verifier
│   │   ├── app.py                       # FastAPI entrypoint, lifespan daemon startup
│   │   ├── config.py                    # Pydantic Settings (paths, models, thresholds)
│   │   ├── models.py                    # Core Pydantic request/response schemas
│   │   └── ragsec.db                    # Primary SQLite operational database
│   │
│   ├── ragsec-soc\                      # Fullstack Frontend & Middle-Tier (Port 3000)
│   │   ├── client\src\
│   │   │   ├── components\              # 20+ React components (Mitigation, Fleet, Scanner, etc.)
│   │   │   ├── pages\Home.tsx           # Primary Single-Page SOC Dashboard & View Router
│   │   │   ├── services\                # Demo engines, API clients, state helpers
│   │   │   └── types\                   # TypeScript definitions (FileCRUDEvent, ThreatCategory)
│   │   ├── server\                      # Express / Node.js orchestration layer & tRPC routers
│   │   ├── package.json                 # Node dependencies (React 19, Vite 7, Tailwind, tRPC)
│   │   └── vite.config.ts               # Vite configuration with proxy to FastAPI
│   │
│   └── data\                            # ChromaDB vector persistent storage & raw CTI sources
│       └── vector_store\                # In-process ChromaDB vector indices
```

---

## 3. Backend Architecture Deep Dive (`ragsec/backend/`)

### 3.1 Entrypoint & Lifecycle (`app.py`)
- **Framework:** FastAPI with Uvicorn (`http://127.0.0.1:8000`).
- **Lifespan Manager:**
  - Instantiates `FIMWatcher(workspace_dir)` on startup and runs it as a background OS observer.
  - Spawns `active_threat_detector.start_sentinel_daemon()`, a background thread constantly monitoring thread velocity and process replication markers.
  - Ensures graceful shutdown on exit (`watcher.stop()`, `sentinel.stop()`).

### 3.2 Key Subsystems & Implementations

#### A. Active Threat & Harmless Replicator (`analysis/`)
- **`controlled_replicator.py`**:
  - Defines `ControlledReplicatorThread(threading.Thread)`:
    - Bounded to `monitored_workspace/replication_sandbox/`.
    - Safety parameters: Maximum replicas hard-capped at 8 (default 4); step delay capped at 1.5s; absolute watchdog timeout at 20s.
    - Generates inert marker files with unique probe hashes and signature `RAGSEC-REPLICATING-PROBE-SIG-B74A`.
- **`active_threat_detector.py`**:
  - `ActiveThreatDetector`: Runs daemon polling at 500ms intervals.
  - Detects replicator activity via signature parsing and generation bursts (\(> 2\) files in \(< 3\)s).
  - Autonomous Action: Sets thread stop event (`STOPPED_BY_DEFENSE`), bans signature in SQLite, moves sandbox files into `.quarantine/`, logs an immutable incident record, and calculates Shannon entropy.
- **`groq_threat_agent.py`**:
  - Real Groq OpenAI-compatible agent with autonomous tool calling:
    - `tool_calculate_entropy`: Calculates Shannon byte entropy \(H = -\sum p_i \log_2 p_i\). Flags files if \(H > 6.8\).
    - `tool_inspect_pe_imports`: Regex-based ASCII import table extraction searching for Win32 API abuse (`VirtualAlloc`, `WriteProcessMemory`, `CreateRemoteThread`, `InternetOpenA`).
    - `tool_decode_base64`: Extracts and decodes obfuscated Base64 payloads.
    - `tool_search_threat_kb`: Queries local ChromaDB for matching MITRE techniques.

#### B. Retrieval & Grounding Core (`retrieval/`)
- **`embedder.py`**: Loads HuggingFace `BAAI/bge-small-en-v1.5` via `sentence-transformers`. 384-dimensional dense vectors running locally on CPU in \(< 25\)ms.
- **`vector_store.py`**: In-process `chromadb.PersistentClient` stored at `ragsec/data/vector_store`.
- **`reranker.py`**: Loads `cross-encoder/ms-marco-MiniLM-L-6-v2`. Reranks candidate chunks by running joint multi-head self-attention on `(query, document_chunk)` pairs, scoring them from \(-10.0\) to \(+10.0\).
- **`retriever.py`**: Two-stage retrieval: Initial top-50 dense vector search \(\to\) top-5 cross-encoder rerank \(\to\) entity metadata extraction.

#### C. Ingestion & File Integrity Monitoring (`ingestion/fim/`)
- **`watcher.py`**: Python `watchdog` `FileSystemEventHandler` listening on `monitored_workspace/`. Captures `on_created`, `on_modified`, `on_deleted`.
- Normalizes events, calculates SHA-256 hashes, passes through `classifier_service.py` to assess risk, and appends to in-memory event deque and SQLite database.

#### D. Governance, CRC & Cryptographic Audit (`governance/`, `domain/audit.py`)
- **`prompts.py` (`mask_compliance_buffer`)**: Deterministic regex scrubber redacting internal RFC-1918 IPs (`10.0.0.0/8`, `192.168.0.0/16`), corporate hostnames, and credentials before prompt assembly.
- **`verifier.py` & `citations.py` (CRC)**: Citation Redundancy Check verifying if every claim or IOC in an LLM response maps to a chunk ID and text span in the retrieved context. Abstains or forces fallback if hallucinated.
- **`audit.py` (`AuditLedgerService`)**: Computes \(h_i = \text{SHA256}(h_{i-1} \parallel \text{event\_data})\). Provides verification method `verify_ledger_integrity()` which iterates all records and flags any tampering.

### 3.3 Complete REST API Catalog (Port 8000)

| Router Prefix | Path | Method | Description |
|---|---|---|---|
| `/api` | `/query` | `POST` | Grounded RAG query (Retrieve \(\to\) Rerank \(\to\) Mask \(\to\) LLM \(\to\) CRC Verify) |
| `/api` | `/knowledge/upload` | `POST` | Upload and chunk CTI reports into ChromaDB |
| `/api` | `/knowledge/sources` | `GET` | List ingested knowledge documents |
| `/api/active-threats`| `/status` | `GET` | Active replicators and sentinel interceptor status |
| `/api/active-threats`| `/launch` | `POST` | Spawns safe `ControlledReplicatorThread` |
| `/api/active-threats`| `/halt` | `POST` | Manually halts active replicator threads |
| `/api/active-threats`| `/scan-and-intercept`| `POST` | Forces instant sentinel sweep, process kill & quarantine |
| `/api/active-threats`| `/recover-file` | `POST` | Restores a quarantined file back to workspace |
| `/api/active-threats`| `/clear-sandbox` | `POST` | Cleans up harmless replicator artifacts |
| `/api/active-threats`| `/scan-all-files` | `POST` | Scans workspace via static analyzer + Groq agent |
| `/api/fim` | `/events` | `GET` | Live CRUD file events stream from Watchdog |
| `/api/fim` | `/quarantined` | `GET` | List files isolated in `.quarantine/` |
| `/api/fim` | `/restore` | `POST` | Un-quarantines a file |
| `/api/fim` | `/whitelist` | `GET`/`POST` | Manage FIM ignored file rules |
| `/api/models` | `/discover` | `POST` | Dynamic discovery of Groq, OpenRouter, Ollama, LM Studio models |
| `/api/models` | `/chat` | `POST` | Multi-turn contiguous chat with selected model |
| `/api/models` | `/synthesize-mitigation` | `POST` | Generates PowerShell/Bash containment scripts |
| `/api/dashboard` | `/stats` | `GET` | Active threat index, benign count, 10-category taxonomy counts |
| `/api/soc` | `/devices` | `GET` | Network endpoint inventory (hostname, IP, OS, criticality) |
| `/api/soc` | `/mitigations` | `GET`/`POST` | Recommended, approved, and executed HITL playbooks |
| `/api/audit` | `/ledger` | `GET` | Full SHA-256 chained audit trail |
| `/api/audit` | `/verify` | `POST` | Mathematical cryptographic chain verification |
| `/api/sps` | `/evaluate` | `POST` | Security Performance Score (SPS) benchmark |
| `/api/siem` | `/export` | `POST` | Exports incident packages to Splunk, ServiceNow, Sentinel |

---

## 4. Frontend Architecture Deep Dive (`ragsec/ragsec-soc/`)

### 4.1 Framework & Stack
- **Framework:** React 19, TypeScript, Vite 7.
- **Styling:** Tailwind CSS with dark-mode SOC theme (`#060911`, `#070A12`, neon cyan/amber/rose accents).
- **Icons:** `lucide-react`.
- **Server:** Node.js Express server running on port `3000` (`server/_core/index.ts`), proxying API requests and serving the SPA.

### 4.2 Page & Routing Model (`client/src/pages/Home.tsx`)
Rather than heavy multi-page browser reloads, `Home.tsx` utilizes an instantaneous Single-Page state router (`currentPage: Page`):

```typescript
type Page = 
  | "dashboard"        // Primary SOC overview, live devices, FIM CRUD stream
  | "active_threats"  // Replicator Sentinel lab, launch threads, observe autonomous halt
  | "ai_chat"         // AI SOC Copilot multi-turn conversation
  | "mitigation"      // Threat playbooks, script synthesis & model discovery
  | "knowledge"       // Vector database management, CTI ingestion & similarity search
  | "file_scanner"    // On-demand static + Groq threat analysis on monitored workspace
  | "fleet"           // Endpoint device inventory, quarantine enclave, whitelists
  | "incident"        // Incident triage, evidence drill-down, MITRE mappings
  | "code_explorer"   // Deep payload inspection, disassembly, forensic metadata
  | "sps_benchmark"   // IEEE SPS evaluation, confusion matrix, grounding tests
  | "siem_gateway"    // Splunk, ServiceNow, Azure Sentinel export generator
  | "governance_lab"  // PII masking buffers, CRC citations, SHA-256 ledger verification
  | "autonomous_tester"// Self-running integration test runner
  | "test_reports";   // Comprehensive compliance and run reports
```

### 4.3 Key Components Audit

1. **`Home.tsx` (SOC Dashboard)**:
   - **Monitored Fleet Devices Grid**: Renders real-time status of connected endpoints (`FINANCE-PC-014`, `DMZ-WEB-03`, `ENG-LT-019`, `CORP-DC-01`).
   - **Live File CRUD Stream**: Polls `/api/fim/events` every 4s. Renders created, modified, or deleted files with risk status (`THREAT`, `SUSPICIOUS`, `SAFE`), entropy, and category badges.
   - **1-Click Threat Dispatch**: Flagged threat rows feature a **"Mitigate Threat"** button that preloads the file context (`fileName`, `filePath`, `evidence`) and transitions directly to the Mitigation view.
2. **`MitigationRulesView.tsx`**:
   - Supports 3 operational tabs: `PLAYBOOKS` (HITL approval queues), `CHATBOT` (interactive Copilot), and `SYNTHESIZER` (PowerShell/Bash script generator).
   - Dynamic model discovery drawer supporting Groq, OpenRouter, Local Ollama, LM Studio, and Gemini.
   - Accepts `initialThreat` prop: when launched from the dashboard, it auto-populates the chat with the incident's forensic evidence.
3. **`ActiveThreatReplicatorView.tsx`**:
   - Interactive testing laboratory for the controlled harmless replicator.
   - Sliders for maximum replicas (\(1\) to \(8\)) and interval delay.
   - Live generation progress bar, thread PID/name display, autonomous interception alerts, and 1-click quarantine file restoration.
4. **`FileThreatScannerView.tsx`**:
   - Executes multi-model scans over all files in `monitored_workspace/`.
   - Displays Shannon entropy, Win32 API import flags, Base64 strings, and Groq reasoning verdict.
5. **`FleetFimView.tsx`**:
   - Displays endpoint inventory, quarantine enclave files, and whitelist rules.
   - Allows analysts to restore files or whitelist paths with a custom expiration timeout.
6. **`GovernanceLabView.tsx`**:
   - Live demonstrations of RFC-1918 PII regex masking, CRC citation verification against ground truth, and SHA-256 cryptographic chain audits.

---

## 5. End-to-End Operational Workflow

The following diagram illustrates the complete runtime cycle of a detected threat:

```
[Adversary / Process]
       │ (Drops or modifies file)
       ▼
monitored_workspace/payload.exe
       │
       ▼ [Watchdog OS Event (< 120ms)]
ingestion.fim.watcher.FIMWatcher
       │
       ▼ [Static Analysis & Hash Extraction]
analysis.static_analyzer.run_static_analysis
  ├── Shannon Entropy calculation (H > 6.8 -> PACKED/ENCRYPTED)
  ├── PE Header & ASCII Win32 Import checks (VirtualAlloc, etc.)
  └── SHA-256 Hash Generation
       │
       ▼ [Event Pipeline & Risk Gating]
pipeline.event_pipeline.process_fim_event
       │
       ▼ [Auto-Persist]
SQLite database (ragsec.db) & Audit Ledger (SHA-256 Chained)
       │
       ▼ [Polled by React Dashboard (Home.tsx)]
Flagged as "THREAT" in Live CRUD Stream
       │
       ├─► [User clicks "Mitigate Threat"]
       │         │
       │         ▼
       │   MitigationRulesView.tsx (Auto-loaded context)
       │         │
       │         ▼ [Prompt assembled with PII Redaction]
       │   Groq / OpenRouter API (Tool Calling / Script Gen)
       │         │
       │         ▼
       │   PowerShell / Bash Containment Script + Playbook Step
       │
       └─► [If Replicating Process Detected]
                 │
                 ▼
           ActiveThreatDetector Sentinel Daemon
                 ├── Forcibly halts worker thread (STOPPED_BY_DEFENSE)
                 ├── Bans replicator signature
                 └── Relocates file into monitored_workspace/.quarantine/
```

---

## 6. Real Implementations vs Synthetic/Mock Audit

| Subsystem / Feature | Status | Reality Assessment |
|---|---|---|
| **FastAPI Backend (8000)** | **REAL** | Fully wired Uvicorn server, 13 routers, live SQLite access. |
| **Filesystem Watchdog FIM** | **REAL** | Real Python `watchdog` monitoring `monitored_workspace/` on the OS. |
| **Active Replicator Engine** | **REAL** | Real Python background threads generating physical marker files in `replication_sandbox/`. |
| **Autonomous Sentinel Interceptor** | **REAL** | Real daemon inspecting thread velocity, killing threads, and moving files to `.quarantine/`. |
| **Shannon Entropy Calculation** | **REAL** | Real mathematical formula executed byte-by-byte in `static_analyzer.py` and `groq_threat_agent.py`. |
| **PE Header & ASCII Scanner** | **REAL** | Real ASCII regex search for Win32 API calls inside binary files. |
| **ChromaDB Vector Store** | **REAL** | In-process ChromaDB SQLite instance in `ragsec/data/vector_store`. |
| **BGE-Small Embedder** | **REAL** | Real PyTorch/HuggingFace transformer model loaded in memory. |
| **Cross-Encoder Reranker** | **REAL** | Real `ms-marco-MiniLM-L-6-v2` CrossEncoder executing joint attention. |
| **Groq Threat Agent** | **REAL** | Real OpenAI-compatible tool calling loop connecting to `api.groq.com`. |
| **Model Discovery Endpoint** | **REAL** | Queries live provider endpoints (`/v1/models`) for Groq, OpenRouter, Ollama, LM Studio. |
| **Cryptographic Audit Ledger** | **REAL** | Real blockchain-style chained SHA-256 hashing in SQLite with mathematical verification. |
| **SIEM Connectors** | **REAL SCHEMAS** | Generates real Splunk HEC JSON, ServiceNow incident payload, and Sentinel Common Event Format (CEF). |
| **Endpoint Fleet Devices** | **SEEDED / DEMO** | 4 enterprise devices seeded in SQLite (`FINANCE-PC-014`, `DMZ-WEB-03`, etc.) simulating enterprise fleet telemetry. |
| **Demo Scenario Generator** | **HYBRID** | `demoEngine.ts` allows analysts to simulate complex multi-step APT scenarios without executing live ransomware. |

---

## 7. Configuration, Environment & Runbook

### 7.1 Port Allocations
- **FastAPI Core Backend**: `http://127.0.0.1:8000` (Swagger docs: `/docs`)
- **Fullstack React / Express Frontend**: `http://localhost:3000`

### 7.2 Running Services
To start both servers from the project root:

```powershell
# Terminal 1: Backend
cd C:\Projects\RAGTEC\ragsec\backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd C:\Projects\RAGTEC\ragsec\ragsec-soc
$env:NODE_ENV="development"
npx tsx server/_core/index.ts
```

### 7.3 Key Environment Variables (`ragsec/backend/.env`)
```ini
GROQ_API_KEY=<your_groq_api_key>
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=<optional_openrouter_key>
RAGSEC_MONITORED_DIR=C:\Projects\RAGTEC\monitored_workspace
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
```

---

## 8. Strategic Recommendations for Claude Sonnet

When taking over development, here are the most impactful technical areas to focus on:

1. **Live Sysmon / eBPF Endpoint Agent Integration**:
   - The current FIM sensor uses Python `watchdog`, which monitors file system events. Integrating Sysmon event log parsing (Windows Event ID 1 for process creation, ID 11 for file creation) will enrich events with real originating Parent Process IDs (PPID).
2. **WebSocket / Server-Sent Events (SSE) for FIM**:
   - The frontend currently polls `/api/fim/events` every 4 seconds. Replacing this with an SSE stream (`/api/fim/stream`) or WebSocket connection will reduce polling overhead and achieve instantaneous UI updates.
3. **Automated Playbook Execution Sandbox**:
   - Currently, PowerShell/Bash scripts generated by the AI Synthesizer require manual copy-paste or HITL approval. Adding an isolated virtual execution sandbox (e.g. Docker container or Windows Sandbox runner) would allow automated execution and verification of containment actions.
4. **Enhanced Vector Chunking for MITRE ATT&CK**:
   - While ChromaDB currently holds CTI text chunks, ingesting structured MITRE ATT&CK v15 STIX 2.1 JSON bundles with graph relation edges would further improve the Cross-Encoder's precision.

---
*Report generated and validated on repository state `main` (`4c881aa`).*
