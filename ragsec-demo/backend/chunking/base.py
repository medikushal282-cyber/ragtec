import json
from dataclasses import dataclass, field
from typing import Dict, Any

@dataclass
class Chunk:
    chunk_id: str
    parent_doc_id: str
    text: str
    chunk_index: int
    source_type: str
    sensitivity_tier: str
    published_date: str
    url: str
    entity_tags: str = "[]" # JSON list of extracted entities

    def to_metadata(self) -> Dict[str, Any]:
        """Convert chunk metadata to a flat dictionary for Chroma."""
        return {
            "parent_doc_id": self.parent_doc_id,
            "chunk_index": self.chunk_index,
            "source_type": self.source_type,
            "sensitivity_tier": self.sensitivity_tier,
            "published_date": str(self.published_date) if self.published_date else "",
            "url": self.url or "",
            "entity_tags": self.entity_tags
        }
