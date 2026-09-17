import os
import hashlib
import uuid
import datetime
import json
from domain.soc_models import SecurityEvent, ProvenanceMetadata, CanonicalFields, Incident, IncidentStatus, ThreatClassification, ThreatCategory, ClassificationState, MitigationAction, MitigationStatus
from db.database import save_record, get_all_records, get_record
from domain.audit import audit_service
from pipeline.threat_analyzer import threat_analyzer, safe_read_snippet

def get_file_hash(filepath: str) -> str:
    if not os.path.exists(filepath) or os.path.isdir(filepath):
        return ''
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return ''

def generate_fim_event(filepath: str, action: str, file_hash: str = '') -> SecurityEvent:
    if not file_hash and os.path.exists(filepath) and not os.path.isdir(filepath):
        file_hash = get_file_hash(filepath)

    snippet = safe_read_snippet(filepath)
    analysis = threat_analyzer.analyze(filepath, action, file_hash, snippet)

    event_id = f'evt_{uuid.uuid4().hex[:8]}'
    is_suspicious = analysis['is_threat']
    risk_score = 95 if is_suspicious else 10

    cls_name = analysis["classification"]
    sev_name = analysis["severity"]
    raw_message = f"FIM: File {action.upper()} detected at {filepath} (Risk: {risk_score}, Category: {cls_name})"

    event = SecurityEvent(
        id=event_id,
        network_id='net_workspace',
        device_id='dev_local',
        source_type='FIM',
        event_type=f"file_{action.lower()}",
        raw_message=raw_message,
        is_suspicious=is_suspicious,
        provenance=ProvenanceMetadata(
            source_id='workspace_scanner',
            sensor_type='FIM',
            sensitivity_level='internal',
            retention_policy='90d',
            immutable_hash=hashlib.sha256(raw_message.encode()).hexdigest()
        ),
        canonical=CanonicalFields(
            event_kind='event',
            event_category='file',
            event_type=action.lower(),
            file_path=filepath,
            file_hash_sha256=file_hash,
            action=action.upper()
        )
    )

    # Attach analysis details into event model dict
    event_dict = event.model_dump()
    event_dict['canonical']['risk_score'] = risk_score
    event_dict['threat_analysis'] = analysis

    # Save to SQLite events table
    save_record('events', event_id, event_dict)

    # If suspicious, automatically generate an Incident and Mitigation Actions in SQLite
    if is_suspicious:
        inc_id = f"INC-2026-{uuid.uuid4().hex[:4].upper()}"
        mit_actions = []
        for s in analysis.get('mitigation_steps', []):
            mit_id = f"MIT-{uuid.uuid4().hex[:6].upper()}"
            mit_action = MitigationAction(
                id=mit_id,
                incident_id=inc_id,
                action_type=s['action'],
                target_device_id='dev_local',
                description=s['description'],
                status=MitigationStatus.RECOMMENDED
            )
            mit_actions.append(mit_action)
            save_record('mitigations', mit_id, mit_action.model_dump(), 'incident_id', inc_id)

        inc = Incident(
            id=inc_id,
            network_id='net_workspace',
            affected_device_ids=['dev_local'],
            title=f"{cls_name} detected via FIM: {os.path.basename(filepath)}",
            status=IncidentStatus.DETECTED,
            threat_classification=ThreatClassification(
                state=ClassificationState.THREAT,
                category=ThreatCategory(cls_name) if cls_name in [c.value for c in ThreatCategory] else ThreatCategory.MALWARE,
                confidence=analysis['confidence'],
                severity=sev_name.lower(),
                rationale=analysis['rationale']
            ),
            mitigation_actions=mit_actions,
            events=[event]
        )
        save_record('incidents', inc_id, inc.model_dump())
        audit_service.log_event("SYSTEM", "CREATE_INCIDENT", inc_id, f"Created incident for {cls_name}")

    # Log to audit_logs
    audit_service.log_event(
        actor="FIM_AGENT",
        action=f"FILE_{action.upper()}",
        target=filepath,
        result="Generated event"
    )

    return event

def scan_workspace(directory: str):
    print(f'Scanning workspace: {directory}')
    scanned_count = 0
    threats_count = 0
    
    existing_events = get_all_records('events')
    existing_map = {}
    for e in existing_events:
        if isinstance(e, dict):
            c = e.get('canonical') or {}
            fp = c.get('file_path', '').lower()
            h = c.get('file_hash_sha256', '')
            if fp:
                existing_map[fp] = (e.get('id'), h, e.get('status'))

    for root, dirs, files in os.walk(directory):
        if '.git' in root or 'node_modules' in root or '__pycache__' in root or '.gemini' in root or '.quarantine' in root or 'quarantine' in root:
            continue
        for file in files:
            if file.startswith('.') or file.startswith('~') or file.endswith('.tmp') or file == 'desktop.ini':
                continue
            filepath = os.path.join(root, file)
            file_hash = get_file_hash(filepath)
            
            # Check if this exact file with same hash is already recorded
            prev = existing_map.get(filepath.lower())
            if prev and prev[1] == file_hash and prev[2] != "QUARANTINED":
                scanned_count += 1
                continue

            evt = generate_fim_event(filepath, 'scan', file_hash)
            scanned_count += 1
            if evt.is_suspicious:
                threats_count += 1

    print(f'Scan complete: {scanned_count} files scanned, {threats_count} threats flagged.')
    return {'files_scanned': scanned_count, 'threats_flagged': threats_count}
