import os
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAdapter(ABC):
    """
    Base class for all ingestion adapters.
    """
    update_frequency: str = "manual"

    def validate(self, doc: Dict[str, Any]) -> bool:
        """
        Validates the schema integrity of a fetched document.
        Logs and returns False if validation fails.
        """
        required_fields = ["source_type", "title", "body", "sensitivity_tier"]
        for field in required_fields:
            if not doc.get(field) or not isinstance(doc.get(field), str):
                self._log_rejection(doc, f"Missing or invalid required field: {field}")
                return False

        if doc["sensitivity_tier"] not in ["public", "internal", "restricted"]:
            self._log_rejection(doc, f"Invalid sensitivity_tier: {doc['sensitivity_tier']}")
            return False
            
        if len(doc["body"].strip()) == 0 or len(doc["body"]) > 204800: # 200KB limit
            self._log_rejection(doc, f"Body length out of bounds: {len(doc['body'])} chars")
            return False
            
        source_type = doc["source_type"]
        doc_id = str(doc.get("id", ""))
        title = doc.get("title", "")
        
        if source_type == "cve":
            if not re.search(r"CVE-\d{4}-\d+", doc_id) and not re.search(r"CVE-\d{4}-\d+", title):
                self._log_rejection(doc, f"Missing CVE pattern in ID/title: {doc_id} / {title}")
                return False
                
        if source_type == "mitre":
            if not re.search(r"mitre-T\d{4}(\.\d{3})?", doc_id) and not re.search(r"T\d{4}(\.\d{3})?", title):
                self._log_rejection(doc, f"Missing MITRE pattern in ID/title: {doc_id} / {title}")
                return False

        return True

    def _log_rejection(self, doc: Dict[str, Any], reason: str):
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "rejected_ingestion.log")
        
        doc_id = doc.get("id", "UNKNOWN_ID")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"REJECTED [{doc_id}]: {reason}\n")
    
    @abstractmethod
    def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch documents from the source.
        Must return a list of dictionaries conforming to the IngestedDocument schema:
        {
            "id": str,
            "source_type": str,
            "title": str,
            "body": str,
            "published_date": datetime (optional),
            "sensitivity_tier": str (public, internal, restricted),
            "url": str (optional)
        }
        """
        pass
