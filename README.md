# RAGSec: Autonomous Cybersecurity Threat Intelligence Platform

> **IEEE ICAIC 2026 Reference Implementation**  
> *Retrieval-Augmented Generation for Cybersecurity Threat Intelligence in Enterprise Networks*

---

## 🛡️ Overview

**RAGSec** is a next-generation autonomous Security Operations Center (SOC) platform. It unifies **File Integrity Monitoring (FIM)**, **deep AI code inspection**, **grounded CTI retrieval (FAISS + Cross-Encoder Reranking)**, and **Human-in-the-Loop (HitL) automated mitigation workflows** powered by high-throughput Groq LPUs (`openai/gpt-oss-120b`).

---

## 📁 Clean Enterprise Repository Structure

```
C:\Projects\RAGTEC\
├── monitored_workspace/          # Canonical Live Monitored Sandbox Directory
│   ├── .quarantine/              # Secure zero-trust isolation enclave
│   ├── threat_lab/               # Threat simulation scenarios & attack scripts
│   └── [test artifacts]         # Curated live security evaluation payloads
│
├── ragsec/                       # Core Production Application
│   ├── backend/                  # Python FastAPI AI / CTI / FIM Core
│   │   ├── analysis/             # Static analyzers, Groq agent, Threat Lab engine
│   │   ├── api/                  # REST API routers (fim, dashboard, analysis, etc.)
│   │   ├── config.py             # Canonical configuration & workspace path resolver
│   │   ├── db/                   # SQLite database access & migrations
│   │   ├── domain/               # Domain models, audit service, SIEM exports
│   │   ├── generation/           # Model discovery & response generation
│   │   ├── governance/           # Policy checks, CRC scoring & guardrails
│   │   ├── ingestion/            # Real-time FIM watcher & CTI ingestion pipeline
│   │   ├── pipeline/             # Multi-factor threat analyzer & event pipeline
│   │   ├── retrieval/            # Vector store chunker & FAISS retrieval
│   │   └── app.py                # FastAPI server entry point
│   │
│   ├── ragsec-soc/               # Production SOC Web UI (React + Node + Vite)
│   │   ├── client/               # React 19 + TypeScript + Tailwind CSS UI
│   │   ├── server/               # Node.js backend & API proxy server
│   │   ├── dist/                 # Production-built bundle
│   │   └── package.json          # Dependencies & build scripts
│   │
│   ├── data/                     # Vector embeddings & intelligence feeds
│   │   ├── raw/                  # CTI source advisories (MITRE, CISA, LockBit)
│   │   ├── vector_store/         # FAISS vector database
│   │   └── soc_dataset.json      # Structured security baseline dataset
│   │
│   ├── samples/                  # Curated detection test fixtures
│   ├── tests/                    # Automated unit & E2E verification tests
│   └── ragsec.db                 # Canonical SQLite database
│
├── docs/                         # Project Documentation & Research
│   ├── papers/                   # IEEE ICAIC 2026 Reference Paper PDF
│   ├── reports/                  # Project audit & completion reports
│   └── images/                   # UI verification proofs & diagrams
│
├── start.bat                     # 1-Click Launch Script (FastAPI + React SOC)
├── sync.bat                      # Git automated repository sync
├── .env                          # Root environment configuration
└── .gitignore                    # Clean Git ignore specification
```

---

## 🚀 Quick Start (1-Click Launch)

To start both the **Python AI Core** and the **Full-Stack SOC Web Platform**:

```cmd
start.bat
```

This single command:
1. Launches the **FastAPI AI Core** on `http://127.0.0.1:8000`
2. Launches the **Node / React SOC Web Platform** on `http://localhost:3000`
3. Automatically opens the **SOC Analyst Portal** in your default web browser

---

## ⚡ Service Ports & Endpoints

| Component | Port | URL | Description |
|---|---|---|---|
| **SOC Web Platform** | `3000` | `http://localhost:3000` | Interactive SOC Analyst Portal & Workbench |
| **Python AI Core** | `8000` | `http://127.0.0.1:8000` | Threat Intelligence, FIM & LLM API |
| **API Documentation** | `8000` | `http://127.0.0.1:8000/docs` | Interactive Swagger OpenAPI Explorer |

---

## 🧪 Testing & Verification

Run the automated Playwright end-to-end verification suite:

```bash
python ragsec/tests/test_e2e_verification.py
```

Runs full verification across:
- **Groq AI Brain Model Selector** (`openai/gpt-oss-120b`)
- **AI File Threat Scanner** on canonical sandbox directory
- **True AI Code Inspection** (`Routine.py` -> `SAFE`, `mimikatz` -> `UNSAFE`)
- **AI Step Helper** with multi-turn chain memory
- **Interactive Mitigation Playbook Card** & 1-click staging to HitL deck
