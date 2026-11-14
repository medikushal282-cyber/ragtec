# RAGSec Phase 02 Report
**Phase:** Hybrid Chunking & Entity-Relational Parsing
**Status:** COMPLETED

## 1. Files & Functions Modified
- **`ragsec/backend/retrieval/chunker.py`**:
  - Refactored `chunk_document` to serve as a format-aware orchestrator.
  - Added `chunk_narrative`: Splits by semantic paragraph and bounds by sentences.
  - Added `chunk_rule_block`: Performs atomic splitting for YARA/Sigma using `rule` or `title:` keywords.
  - Added `chunk_ioc_csv`: Relational table-row grouping leveraging Python's `csv.DictReader`, preserving related keys to values. Includes a fallback mechanism to `chunk_narrative` if the format is malformed or headers are missing.
- **`ragsec/backend/test_phase_02.py`** (NEW): Developed specific automated tests covering Narrative, Rule, CSV, and Malformed formats.

## 2. Chunking Strategies
- **Narrative (`source_type="narrative"`):** Paragraph-level splitting with overlapping window fallbacks for excessively long blocks. This preserves the semantic flow of sentences.
- **Rule Artifacts (`source_type="rule"`):** Atomic splitting ensuring that an entire YARA rule or Sigma detection block remains entirely contiguous in a single chunk without being truncated mid-condition.
- **Structured IOCs (`source_type="csv"`):** Table-row grouping transforms `ip_address,domain...` into associative key-value groups (`ip_address: 192.168.5.5, domain: bad.com`), batching them by `rows_per_chunk` to maintain relationship context.

## 3. Entity Extraction & Provenance
- Extraction is performed *before* embedding on the precise chunk text using `extract_entities_from_text` (regex + deduplication).
- Supported Entities: IPs, Domains, Enterprise Hostnames, Hashes (MD5/SHA1/SHA256), CVEs, MITRE ATT&CK IDs.
- Every `CanonicalChunk` preserves its `document_id`, `source_name`, `source_type`, and `sensitivity_tier` mirroring the `CanonicalDocument`, guaranteeing traceable provenance back to the original source.

## 4. Automated Tests
**Command Executed:**
`$env:PYTHONPATH="C:\Projects\RAGTEC\ragsec\backend"; python test_phase_02.py`

**Results (4/4 Tests Passing):**
- Narrative: Properly bounded paragraphs and successfully extracted `CVE-2023-12345`, `TA0001`, `192.168.1.50`, and `malicious-c2.com`.
- Rule: Split 2 distinct YARA rules correctly and extracted `CVE-2023-12345` and `10.0.0.5`.
- CSV: Successfully grouped 2 rows of IOCs into a related text block, extracting `10.0.0.99`, `192.168.5.5`, and the associated hashes.
- Malformed CSV Fallback: Encountered a headerless string (`"this is just a bad csv string that doesn't really parse correctly 192.168.1.100"`), caught the exception, yielded 0 CSV chunks, and gracefully failed over to the narrative chunker, successfully extracting the IP `192.168.1.100`.

## 5. Known Limitations
- The orchestrator relies on `source_type` explicitly passed by the ingestion loader. It does not automatically infer MIME types from byte signatures.
- Entity extraction relies on deterministic regexes and does not currently employ advanced NLP/NER transformer models (which maintains efficiency for the MVP but may miss obfuscated IOCs).

## 6. Recommended Next Action
Review this report. Once approved, the system is ready for Phase 3 (Vector Indexing & Storage).
