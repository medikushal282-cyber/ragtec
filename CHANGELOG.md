# RAGSec Project Changelog

## [Unreleased]
### Added
- **Phase 3 / Runtime Recovery**: Fully integrated the `ragsec-soc` full-stack Node.js + tRPC + React application to serve as the unified presentation and API layer.
- **SQLite Persistence**: Migrated the `ragsec-soc` Drizzle ORM schema from MySQL to SQLite (using `@libsql/client`) to seamlessly connect with `ragsec.db` and preserve the persistent SOC dataset.
- **Seeded Dataset**: Created a database initialization script to populate `ragsec.db` with realistic FIM, IDS, and SOC alerts for visual verification.
- **Phase 2 (Hybrid Chunking)**: Implemented format-aware chunking for Narrative text (paragraph-level), Rule artifacts (atomic blocks), and Structured CSVs (relational grouping).
- **Phase 2 (Entity Extraction)**: Wired deterministic regex extraction for IPs, CVEs, Hashes, Domains, and MITRE IDs directly into the chunking pipeline.
- **Phase 1 (Data Ingestion)**: Created the `IngestionNormalizer` and canonical models to handle multi-source telemetry parsing with cryptographic provenance hashes.
- **P0 Persistence Fix**: Refactored the core Python FastAPI backend to use SQLite instead of an in-memory dictionary.

### Changed
- Replaced the initial mock HTML/Vanilla JS frontend with a professional, high-contrast cyberpunk React application featuring fleet management, active incident tracking, and threat mitigation workspaces.

### Removed
- Deprecated the temporary `frontend/index.html` wireframe.
