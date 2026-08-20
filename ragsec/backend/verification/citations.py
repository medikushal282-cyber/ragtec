"""
ragsec.backend.verification.citations
Application-bound citation verification:
- Extracts [C#] citation tags from generated answer text
- Validates that every citation points to a valid retrieved Evidence item
- Detects fake or hallucinated citation tags
- Assembles structured CitationInfo objects
"""
import re
from typing import List, Tuple, Dict
from models import Evidence, CitationInfo

CITATION_TAG_REGEX = re.compile(r'\[C(\d+)\]')

def verify_and_bind_citations(
    answer_text: str,
    evidence: List[Evidence]
) -> Tuple[List[CitationInfo], List[str], List[str]]:
    """
    Validates citation tags found in answer_text against provided Evidence list.
    Returns:
    - valid_citations: List[CitationInfo]
    - verified_tags: List[str] (e.g. ["[C1]"])
    - unsupported_tags: List[str] (e.g. ["[C99]"])
    """
    found_numbers = CITATION_TAG_REGEX.findall(answer_text)
    
    valid_citations: List[CitationInfo] = []
    verified_tags: List[str] = []
    unsupported_tags: List[str] = []
    
    # Map index 1..len(evidence) to Evidence
    evidence_map: Dict[int, Evidence] = {i + 1: e for i, e in enumerate(evidence)}
    
    seen_tags = set()
    for num_str in found_numbers:
        tag_int = int(num_str)
        tag_str = f"[C{tag_int}]"
        if tag_str in seen_tags:
            continue
        seen_tags.add(tag_str)
        
        if tag_int in evidence_map:
            e = evidence_map[tag_int]
            valid_citations.append(CitationInfo(
                tag=tag_str,
                chunk_id=e.chunk_id,
                document_id=e.document_id,
                source_name=e.source_name,
                similarity_score=e.adjusted_similarity,
                snippet=e.text[:250]
            ))
            verified_tags.append(tag_str)
        else:
            unsupported_tags.append(tag_str)
            
    return valid_citations, verified_tags, unsupported_tags
