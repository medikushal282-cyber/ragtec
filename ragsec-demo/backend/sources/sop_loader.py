import os
import uuid
import datetime
from typing import List, Dict, Any
from .base import BaseAdapter

class SOPLoaderAdapter(BaseAdapter):
    update_frequency = "manual"

    def __init__(self, sops_dir: str = "data/sops"):
        # Resolve path relative to backend root
        self.sops_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), sops_dir)

    def fetch(self) -> List[Dict[str, Any]]:
        print(f"Loading SOPs from {self.sops_dir}...")
        documents = []
        
        if not os.path.exists(self.sops_dir):
            print(f"SOPs directory not found: {self.sops_dir}")
            return documents

        for filename in os.listdir(self.sops_dir):
            if not filename.endswith(".md"):
                continue
                
            filepath = os.path.join(self.sops_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                # Basic title extraction: Use first line if it's a header, else filename
                title = filename.replace(".md", "").replace("_", " ").title()
                first_line = content.split('\n')[0].strip()
                if first_line.startswith("# "):
                    title = first_line[2:]

                doc_id = f"sop-{uuid.uuid4().hex[:8]}"
                doc = {
                    "id": doc_id,
                    "source_type": "sop",
                    "title": title,
                    "body": content,
                    "published_date": datetime.datetime.fromtimestamp(os.path.getmtime(filepath)),
                    "sensitivity_tier": "internal",
                    "url": None
                }
                documents.append(doc)
            except Exception as e:
                print(f"Failed to load SOP {filename}: {e}")

        return documents
