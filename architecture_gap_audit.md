# Architecture Gap Audit

| Requirement | Actual File/Function | Status | Runtime Evidence | Next Action |
|---|---|---|---|---|
| Multi-Network | `domain/soc_models.py` | VERIFIED | Works in `api_test.py` via network boundaries | Move to persistent DB |
| Devices | `domain/soc_models.py` | VERIFIED | Mock list works | Database implementation |
| Events | `pipeline/event_pipeline.py` | VERIFIED | Verified via `POST /api/soc/events` | Stream live events |
| Suspiciousness | `pipeline/classifier.py` | VERIFIED | Requires `is_suspicious=true` to process | Integrate with anomaly detector |
| Threat Classification | `pipeline/classifier.py` | VERIFIED | 10 regex-based rules working | Enhance with ML / LLM fallback |
| Ten Threat Categories | `domain/soc_models.py` | VERIFIED | API generates incidents for them | None |
| Incidents | `pipeline/event_pipeline.py` | VERIFIED | Lifecycle (DETECTED -> INVESTIGATING) working | Frontend integration |
| CTI / RAG | `api/routes.py` | VERIFIED | `execute_query` pipeline complete | Vector storage / indexing |
| Chunking / Parsing | `retrieval/chunker.py` | VERIFIED | Format-aware orchestration (Narrative, Rule, CSV) | None |
| Entity Extraction | `ingestion/entities.py` | VERIFIED | IP, Hash, CVE, MITRE, Domains extracted | None |
| Confidence & Severity | `governance/policy.py` | VERIFIED | Severity thresholds applied dynamically | Tune thresholds |
| Investigation & Mitigation | `domain/mitigation.py` | VERIFIED | Simulation & Approval workflow active | Frontend UI buttons |
| Analyst Approval | `domain/mitigation.py` | VERIFIED | Approval endpoint working | Authentication layer |
| Verification | `verification/verifier.py` | VERIFIED | Entity/CRC checks applied post-LLM | Evaluation dataset |
| Audit Trail | `domain/mitigation.py` | VERIFIED | Transitions logged | Secure DB integration |
| Persistence | `db/database.py` | VERIFIED | SQLite DB `ragsec.db` survives restart | None |
| API | `api/soc_routes.py` | VERIFIED | `api_test.py` covers endpoints | None |
| Frontend | `frontend/index.html` | PARTIAL | Displays events and incidents, badge works | Add investigation UI |
| Paper RAG Controls | `governance/abstention.py` | VERIFIED | Abstained responses generated accurately | Scale index size |
