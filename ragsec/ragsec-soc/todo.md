# Project TODO

- [x] Establish the high-contrast cyberpunk visual system with black surfaces, neon pink/cyan accents, geometric typography, HUD brackets, and accessible contrast.
- [x] Build the persistent SOC navigation shell with Dashboard, Threat Query, Alerts, Incidents, FIM, Fleet, Mitigation, Knowledge Base, Audit Log, and Settings areas.
- [x] Add authenticated analyst/admin access controls and role-aware UI visibility.
- [x] Add database schema and typed backend procedures for alerts, incidents, notes, evidence metadata, FIM events, fleet hosts, playbooks, mitigation actions, knowledge documents, RAG chunks, audit events, notification events, and analyst assignments.
- [x] Enforce exact severity tiers: Critical, High, Medium, Low.
- [x] Enforce exact alert status values: New, Investigating, Resolved.
- [x] Build SOC dashboard with active alert count, severity distribution chart, incident timeline, system health indicators, SPS-style metrics, and live activity updates.
- [x] Build RAG threat query interface with natural-language input, grounded answers, inline source citations, confidence/abstention state, and evidence panel.
- [x] Implement deterministic RAG retrieval/reranking and citation validation against enterprise knowledge-base chunks.
- [x] Implement secure knowledge-base upload pipeline for PDF and plain-text files using S3-backed storage and ingestion metadata.
- [x] Build alert ingestion, filtering, sorting, severity/status updates, analyst assignment, detail view, and bulk triage interactions.
- [x] Build incident creation and management linked to alerts, with threaded analyst notes, evidence attachment metadata, MITRE ATT&CK technique tags, escalation controls, and timeline.
- [x] Build FIM log viewer with host, file path, hash, change type, timestamp, anomaly flag, and risk score.
- [x] Build fleet/endpoint registry with OS, last-seen, agent status, open alert count, and per-host alert/FIM drill-down.
- [x] Build mitigation playbook engine with predefined actions, dry-run/approval flow, execution state, and action results.
- [x] Require explicit approval for high-impact mitigation actions and expose approval controls to authorized analysts.
- [x] Add immutable append-only audit log with no edit or delete operations exposed in the API or UI.
- [x] Add automatic owner notifications for Critical alert ingestion and incident escalation.
- [x] Add realtime-feeling stream updates for alerts, FIM events, incidents, audit actions, and system health with safe demo fixtures clearly labeled as simulated telemetry.
- [x] Add responsive behavior for desktop SOC workspaces and compact/mobile analyst review.
- [x] Add Vitest coverage for severity/status validation, immutable audit behavior, citation validation, notification triggers, and core backend procedures.
- [x] Run type checks, tests, build checks, visual screenshots, and interaction validation before delivery.
- [x] Save one final project checkpoint after all requested features are complete and verified.

- [x] Wire Threat Query UI to the backend RAG procedure and render backend-produced cited answers.
- [x] Add deterministic citation verification and abstention logic to the RAG procedure.
- [x] Add missing procedures for incidents, notes, evidence metadata, FIM, fleet, playbooks, mitigation actions, knowledge sources, and analyst assignments.
- [x] Replace core static data flows with tRPC-backed query/mutation paths where practical.
- [x] Add S3-backed PDF/TXT upload validation and knowledge-source ingestion metadata procedure.
- [x] Add role-based authorization for high-impact mitigation approvals.
- [x] Add substantive backend procedure tests and run the production build check.

- [x] Replace remaining static alert, incident, FIM, fleet, mitigation, and dashboard data with backend-backed or clearly labeled telemetry-backed flows.
- [x] Add persistent telemetry refresh plumbing to the core SOC screens.
- [x] Add substantive workflow tests for alert triage, incident escalation, mitigation approval, knowledge upload, and RAG abstention/citation behavior.
- [x] Save a final checkpoint after the remaining gaps are fixed and revalidated.

- [x] Wire Dashboard, Incidents, and Mitigation content to telemetry-backed or backend-backed data with refresh behavior.
- [x] Extend telemetry refresh coverage to all core SOC screens.
- [x] Add real policy-level workflow tests for alert triage, escalation, upload validation, mitigation approval, and RAG citation/abstention outcomes.
- [x] Save a new final checkpoint after the last remediation pass.
