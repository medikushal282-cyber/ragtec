# RAGSec — Retrieval-Augmented Generation for Cybersecurity Threat Intelligence

A clean, modular, research-paper-aligned implementation of the **IEEE RAGSec** framework.

---

## 1. Core Architecture Pipeline

```text
INGESTION (TXT, JSON, Markdown)
  ↓
NORMALIZATION & ENTITY EXTRACTION (IPs, hashes, CVEs, TTPs, domains)
  ↓
CHUNKING (Paragraph & IOC block splitting with parent provenance)
  ↓
DENSE EMBEDDINGS (BAAI/bge-small-en-v1.5)
  ↓
VECTOR STORE (Persistent ChromaDB Cosine Index + Metadata Filtering)
  ↓
RETRIEVAL (Top-k similarity + Temporal Recency Decay)
  ↓
GOVERNANCE POLICY (Dynamic Severity-Aware Abstention: Low / Med / High / Critical)
  ↓
COMPLIANCE BUFFER (Pre-generation PII, IP, and Hostname Masking)
  ↓
GROUNDED GENERATION (Mandatory [C1]..[Cn] Inline Citations + Forbidden Inference)
  ↓
VERIFICATION (Entity Grounding + CRC Sentence-to-Evidence Lexical Consistency)
  ↓
CANONICAL RESPONSE (ANSWERED | ABSTAINED | ESCALATED)
```

---

## 2. Dynamic Severity-Aware Abstention Thresholds

| Severity Level | Minimum Similarity ($\theta_{sim}$) | Minimum Confidence ($\theta_{conf}$) |
| :--- | :--- | :--- |
| **LOW** | `0.55` | `0.55` |
| **MEDIUM** | `0.60` | `0.60` |
| **HIGH** | `0.65` | `0.65` |
| **CRITICAL** | `0.70` | `0.70` |

*If evidence is insufficient or confidence falls below the severity threshold, the system immediately returns `ABSTAINED` rather than hallucinating.*

---

## 3. Quick Start & Execution

### A. Run Automated Test Suite
```bash
python tests/test_ragsec.py
```
*(All 11 unit, integration, and security tests pass).*

### B. Start Backend API
```bash
python backend/app.py
```
The FastAPI server will be available at `http://localhost:8000`.

### C. Launch SOC Analyst UI
Open `frontend/index.html` in your web browser.

---

## 4. API Endpoints

- `POST /api/query`: Primary analyst incident query endpoint.
- `POST /api/ingest`: Ingest and index single CTI advisory.
- `POST /api/index`: Batch ingest multiple documents.
- `GET /api/evidence/{chunk_id}`: Inspect specific evidence chunk and provenance.
- `GET /api/health`: Health status and total indexed chunks.
