"""
ragsec.backend.verification.verifier
Two-stage verification engine:
Stage 1: Cybersecurity Entity Verification (IPs, hashes, CVEs, TTPs, domains)
Stage 2: Chain-of-Retrieval Consistency (CRC) sentence lexical overlap check
Applies response escalation/suppression for HIGH/CRITICAL incidents on verification failure.
"""
import re
from typing import List, Dict, Any, Tuple
from models import Evidence, VerificationResult, IncidentSeverity, ResponseStatus
from ingestion.entities import extract_entities_from_text
from verification.citations import verify_and_bind_citations, CITATION_TAG_REGEX

def check_crc_sentence_consistency(
    answer_text: str,
    evidence: List[Evidence]
) -> Tuple[List[str], List[Dict[str, str]]]:
    """
    Checks that sentences containing [C#] tags share key vocabulary tokens with the cited chunk.
    Returns (uncited_sentences, crc_failures).
    """
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', answer_text) if len(s.strip()) > 15]
    uncited_sentences = []
    crc_failures = []
    
    evidence_map = {i + 1: e.text.lower() for i, e in enumerate(evidence)}
    
    for s in sentences:
        tags = CITATION_TAG_REGEX.findall(s)
        if not tags:
            uncited_sentences.append(s)
            continue
            
        s_tokens = set(re.findall(r'\w{4,}', s.lower()))
        if not s_tokens:
            continue
            
        for tag_num in tags:
            idx = int(tag_num)
            if idx in evidence_map:
                chunk_tokens = set(re.findall(r'\w{4,}', evidence_map[idx]))
                overlap = s_tokens.intersection(chunk_tokens)
                if len(overlap) < 1:
                    crc_failures.append({
                        "sentence": s,
                        "tag": f"[C{idx}]",
                        "reason": f"No token overlap found between sentence and cited chunk [C{idx}]."
                    })
                    
    return uncited_sentences, crc_failures

def verify_response(
    answer_text: str,
    evidence: List[Evidence],
    severity: IncidentSeverity
) -> Tuple[VerificationResult, ResponseStatus]:
    """
    Runs entity grounding and CRC verification against generated answer.
    Determines final ResponseStatus: ANSWERED vs ESCALATED.
    """
    # 1. Citation Binding
    citations, verified_tags, unsupported_tags = verify_and_bind_citations(answer_text, evidence)
    
    # 2. Entity Grounding
    gen_entities = extract_entities_from_text(answer_text)
    
    corpus_entities = {
        "ips": set(), "domains": set(), "hostnames": set(),
        "hashes": set(), "cves": set(), "ttps": set()
    }
    entity_provenance = {}
    
    for i, e in enumerate(evidence):
        tag = f"[C{i+1}]"
        chunk_ents = extract_entities_from_text(e.text)
        for cat in ["ips", "domains", "hostnames", "hashes", "cves", "ttps"]:
            for item in getattr(chunk_ents, cat):
                corpus_entities[cat].add(item)
                if item not in entity_provenance:
                    entity_provenance[item] = []
                entity_provenance[item].append(tag)
                
    verified_entities = []
    unsupported_entities = []
    
    for cat in ["ips", "domains", "hostnames", "hashes", "cves", "ttps"]:
        for item in getattr(gen_entities, cat):
            if item in corpus_entities[cat]:
                verified_entities.append({
                    "type": cat[:-1].upper() if cat.endswith("s") else cat.upper(),
                    "value": item,
                    "supported_by": entity_provenance.get(item, [])
                })
            else:
                unsupported_entities.append({
                    "type": cat[:-1].upper() if cat.endswith("s") else cat.upper(),
                    "value": item,
                    "reason": f"Entity not present in retrieved evidence chunks."
                })
                
    # 3. CRC Lexical Overlap Check
    uncited_sentences, crc_failures = check_crc_sentence_consistency(answer_text, evidence)
    
    warnings = []
    if unsupported_tags:
        warnings.append(f"Model cited non-existent evidence tags: {', '.join(unsupported_tags)}")
    if unsupported_entities:
        warnings.append(f"Detected {len(unsupported_entities)} unsupported entity claim(s).")
    if crc_failures:
        warnings.append(f"Detected {len(crc_failures)} sentence-to-evidence lexical consistency failure(s).")
        
    has_critical_failures = len(unsupported_entities) > 0 or len(unsupported_tags) > 0 or len(crc_failures) > 0
    
    # 4. Determine Status
    if not has_critical_failures and len(uncited_sentences) <= 1:
        v_status = "VERIFIED"
        resp_status = ResponseStatus.ANSWERED
    elif not has_critical_failures:
        v_status = "PARTIAL"
        resp_status = ResponseStatus.ANSWERED
    else:
        v_status = "UNSUPPORTED"
        # For High / Critical incidents, escalate immediately
        if severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
            resp_status = ResponseStatus.ESCALATED
        else:
            resp_status = ResponseStatus.ANSWERED
            
    v_result = VerificationResult(
        passed=(v_status != "UNSUPPORTED"),
        status=v_status,
        verified_citations=verified_tags,
        unsupported_citations=unsupported_tags,
        verified_entities=verified_entities,
        unsupported_entities=unsupported_entities,
        warnings=warnings
    )
    
    return v_result, resp_status
