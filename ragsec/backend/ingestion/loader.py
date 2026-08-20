"""
ragsec.backend.ingestion.loader
Loads raw text, markdown, or JSON and converts to CanonicalDocument.
"""
from typing import Dict, Any, Optional
import json
import datetime
from pathlib import Path

from models import CanonicalDocument, SensitivityTier
from ingestion.normalizer import normalize_text
from ingestion.entities import extract_entities_from_text

def create_canonical_document(
    content: str,
    source_name: str,
    source_type: str = "cti_report",
    title: Optional[str] = None,
    sensitivity_tier: SensitivityTier = SensitivityTier.INTERNAL,
    publication_timestamp: Optional[str] = None,
    url: Optional[str] = None,
    document_id: Optional[str] = None
) -> CanonicalDocument:
    """
    Constructs a CanonicalDocument with normalized content and extracted entities.
    """
    clean_text, content_hash = normalize_text(content)
    
    if not document_id:
        document_id = f"DOC-{content_hash[:12]}"
        
    if not title:
        first_line = clean_text.split("\n")[0].strip("# ").strip() if clean_text else "Untitled Advisory"
        title = first_line[:100]
        
    if not publication_timestamp:
        publication_timestamp = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d")
        
    extracted_entities = extract_entities_from_text(clean_text)
    
    return CanonicalDocument(
        document_id=document_id,
        source_name=source_name.strip(),
        source_type=source_type.lower().strip(),
        title=title,
        content=clean_text,
        sensitivity_tier=sensitivity_tier,
        publication_timestamp=publication_timestamp,
        url=url,
        content_hash=content_hash,
        extracted_entities=extracted_entities
    )

def load_from_json(json_str_or_dict: Any) -> CanonicalDocument:
    """Loads a structured advisory from JSON payload."""
    if isinstance(json_str_or_dict, str):
        data = json.loads(json_str_or_dict)
    else:
        data = json_str_or_dict
        
    return create_canonical_document(
        content=data.get("content", data.get("body", "")),
        source_name=data.get("source_name", "json_feed"),
        source_type=data.get("source_type", "cti_report"),
        title=data.get("title"),
        sensitivity_tier=SensitivityTier(data.get("sensitivity_tier", "internal")),
        publication_timestamp=data.get("publication_timestamp", data.get("published_date")),
        url=data.get("url"),
        document_id=data.get("document_id")
    )