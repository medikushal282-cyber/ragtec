"""
ragsec.backend.retrieval.chunker
Cybersecurity-aware chunking preserving full document provenance:
- Splits narrative reports by semantic paragraph boundaries
- Groups related IOC records/blocks (CSV/JSON)
- Atomic rule-block chunking for YARA/Sigma
- Preserves document_id, source_name, timestamps, sensitivity_tier, and extracted entities
"""
import re
import csv
import io
import json
from typing import List
from models import CanonicalDocument, CanonicalChunk
from ingestion.entities import extract_entities_from_text

def chunk_narrative(doc: CanonicalDocument, max_chunk_chars: int = 600, overlap_chars: int = 80) -> List[CanonicalChunk]:
    """Splits a narrative canonical document into provenance-bound chunks."""
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', doc.content) if p.strip()]
    if not paragraphs:
        paragraphs = [doc.content] if doc.content else []
        
    chunks: List[CanonicalChunk] = []
    chunk_idx = 0
    
    for para in paragraphs:
        if len(para) > max_chunk_chars:
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', para) if s.strip()]
            buffer = ""
            for s in sentences:
                if len(buffer) + len(s) > max_chunk_chars and buffer:
                    chunk_text = buffer.strip()
                    c_id = f"{doc.document_id}-CHK-{chunk_idx:03d}"
                    chunks.append(CanonicalChunk(
                        chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
                        source_type=doc.source_type, chunk_index=chunk_idx, text=chunk_text,
                        sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
                        extracted_entities=extract_entities_from_text(chunk_text)
                    ))
                    chunk_idx += 1
                    buffer = (buffer[-overlap_chars:] + " " + s).strip()
                else:
                    buffer = (buffer + " " + s).strip()
            if buffer.strip():
                chunk_text = buffer.strip()
                c_id = f"{doc.document_id}-CHK-{chunk_idx:03d}"
                chunks.append(CanonicalChunk(
                    chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
                    source_type=doc.source_type, chunk_index=chunk_idx, text=chunk_text,
                    sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
                    extracted_entities=extract_entities_from_text(chunk_text)
                ))
                chunk_idx += 1
        else:
            chunk_text = para.strip()
            c_id = f"{doc.document_id}-CHK-{chunk_idx:03d}"
            chunks.append(CanonicalChunk(
                chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
                source_type=doc.source_type, chunk_index=chunk_idx, text=chunk_text,
                sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
                extracted_entities=extract_entities_from_text(chunk_text)
            ))
            chunk_idx += 1
    return chunks

def chunk_rule_block(doc: CanonicalDocument) -> List[CanonicalChunk]:
    """Atomic rule-block chunking for YARA/Sigma."""
    blocks = re.split(r'\n(?=rule\s+[a-zA-Z0-9_]+\s*\{|\s*title:\s*)', doc.content)
    chunks = []
    chunk_idx = 0
    for block in blocks:
        if not block.strip(): continue
        chunk_text = block.strip()
        c_id = f"{doc.document_id}-CHK-{chunk_idx:03d}"
        chunks.append(CanonicalChunk(
            chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
            source_type=doc.source_type, chunk_index=chunk_idx, text=chunk_text,
            sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
            extracted_entities=extract_entities_from_text(chunk_text)
        ))
        chunk_idx += 1
    return chunks

def chunk_ioc_csv(doc: CanonicalDocument, rows_per_chunk: int = 5) -> List[CanonicalChunk]:
    """Relational/table-row grouping for CSV/structured IOC data."""
    chunks = []
    chunk_idx = 0
    try:
        reader = csv.DictReader(io.StringIO(doc.content))
        buffer = []
        for row in reader:
            buffer.append(", ".join([f"{k}: {v}" for k, v in row.items() if v]))
            if len(buffer) >= rows_per_chunk:
                chunk_text = "\n".join(buffer)
                c_id = f"{doc.document_id}-CHK-{chunk_idx:03d}"
                chunks.append(CanonicalChunk(
                    chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
                    source_type=doc.source_type, chunk_index=chunk_idx, text=chunk_text,
                    sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
                    extracted_entities=extract_entities_from_text(chunk_text)
                ))
                chunk_idx += 1
                buffer = []
        if buffer:
            chunk_text = "\n".join(buffer)
            c_id = f"{doc.document_id}-CHK-{chunk_idx:03d}"
            chunks.append(CanonicalChunk(
                chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
                source_type=doc.source_type, chunk_index=chunk_idx, text=chunk_text,
                sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
                extracted_entities=extract_entities_from_text(chunk_text)
            ))
    except Exception:
        return chunk_narrative(doc)
    return chunks

def chunk_json(doc: CanonicalDocument) -> List[CanonicalChunk]:
    chunks = []
    try:
        data = json.loads(doc.content)
        if isinstance(data, list):
            for idx, item in enumerate(data):
                text = json.dumps(item)
                c_id = f"{doc.document_id}-CHK-{idx:03d}"
                chunks.append(CanonicalChunk(
                    chunk_id=c_id, document_id=doc.document_id, source_name=doc.source_name,
                    source_type=doc.source_type, chunk_index=idx, text=text,
                    sensitivity_tier=doc.sensitivity_tier, publication_timestamp=doc.publication_timestamp,
                    extracted_entities=extract_entities_from_text(text)
                ))
    except Exception:
        return chunk_narrative(doc)
    return chunks

def chunk_document(doc: CanonicalDocument) -> List[CanonicalChunk]:
    """Format-aware parsing/chunking orchestrator."""
    if doc.source_name.endswith('.csv') or doc.source_type == 'csv':
        return chunk_ioc_csv(doc)
    elif doc.source_name.endswith('.json') or doc.source_type == 'json':
        return chunk_json(doc)
    elif doc.source_name.endswith('.yml') or doc.source_name.endswith('.yar') or doc.source_type == 'rule':
        return chunk_rule_block(doc)
    else:
        return chunk_narrative(doc)
