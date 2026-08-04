import uuid
from typing import List
from models import IngestedDocument
from .base import Chunk
from .entity_extraction import extract_entities

def chunk_narrative(doc: IngestedDocument, max_chars: int = 1500, overlap: int = 200) -> List[Chunk]:
    """
    Narrative splitter for SOPs and synthetic incidents.
    Splits by paragraph first. If a paragraph is too long, it could be split further, 
    but for this scope, a simple sliding window on characters (with word boundaries) works.
    """
    chunks = []
    text = doc.body
    
    # Simple sliding window chunker
    start = 0
    chunk_idx = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        
        # Adjust end to nearest paragraph or newline if not at the end of the text
        if end < len(text):
            # Try to find a paragraph break
            last_para = text.rfind('\n\n', start, end)
            if last_para != -1 and last_para > start + (max_chars // 2):
                end = last_para + 2
            else:
                # Try to find a sentence break
                last_period = text.rfind('. ', start, end)
                if last_period != -1 and last_period > start + (max_chars // 2):
                    end = last_period + 2
                else:
                    # Try to find a word boundary
                    last_space = text.rfind(' ', start, end)
                    if last_space != -1 and last_space > start:
                        end = last_space + 1
        
        chunk_text = f"{doc.title}\n{text[start:end].strip()}"
        
        chunks.append(Chunk(
            chunk_id=f"chk-{uuid.uuid4().hex[:8]}",
            parent_doc_id=doc.id,
            text=chunk_text,
            chunk_index=chunk_idx,
            source_type=doc.source_type,
            sensitivity_tier=doc.sensitivity_tier,
            published_date=doc.published_date,
            url=doc.url,
            entity_tags=extract_entities(chunk_text)
        ))
        
        chunk_idx += 1
        start = end - overlap
        if start >= len(text) or end == len(text):
            break
            
    return chunks

def chunk_row_grouped(doc: IngestedDocument) -> List[Chunk]:
    """
    Row-grouped splitter for CVE entries.
    One CVE = one chunk.
    """
    chunk_text = f"{doc.title}\n{doc.body}"
    return [Chunk(
        chunk_id=f"chk-{uuid.uuid4().hex[:8]}",
        parent_doc_id=doc.id,
        text=chunk_text,
        chunk_index=0,
        source_type=doc.source_type,
        sensitivity_tier=doc.sensitivity_tier,
        published_date=doc.published_date,
        url=doc.url,
        entity_tags=extract_entities(chunk_text)
    )]

def chunk_rule_block(doc: IngestedDocument) -> List[Chunk]:
    """
    Rule-block splitter for MITRE ATT&CK techniques.
    One technique = one chunk.
    """
    chunk_text = f"{doc.title}\n{doc.body}"
    return [Chunk(
        chunk_id=f"chk-{uuid.uuid4().hex[:8]}",
        parent_doc_id=doc.id,
        text=chunk_text,
        chunk_index=0,
        source_type=doc.source_type,
        sensitivity_tier=doc.sensitivity_tier,
        published_date=doc.published_date,
        url=doc.url,
        entity_tags=extract_entities(chunk_text)
    )]

def route_and_chunk(doc: IngestedDocument) -> List[Chunk]:
    if doc.source_type in ["synthetic", "sop"]:
        return chunk_narrative(doc)
    elif doc.source_type == "cve":
        return chunk_row_grouped(doc)
    elif doc.source_type == "mitre":
        return chunk_rule_block(doc)
    else:
        # Default fallback
        return chunk_narrative(doc)
