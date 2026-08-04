import requests
import datetime
from typing import List, Dict, Any
from .base import BaseAdapter

class MitreAttackAdapter(BaseAdapter):
    update_frequency = "manual"

    def __init__(self):
        # Master JSON bundle for MITRE Enterprise ATT&CK
        self.url = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"

    def fetch(self) -> List[Dict[str, Any]]:
        print("Fetching MITRE ATT&CK STIX data...")
        try:
            response = requests.get(self.url, timeout=30)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Failed to fetch MITRE data: {e}")
            return []

        objects = data.get("objects", [])
        documents = []

        for obj in objects:
            # We ONLY want attack-patterns (techniques and sub-techniques)
            if obj.get("type") != "attack-pattern":
                continue
                
            # Grab external references to find the T-code (e.g., T1059) and URL
            external_refs = obj.get("external_references", [])
            mitre_ref = next((ref for ref in external_refs if ref.get("source_name") == "mitre-attack"), None)
            
            if not mitre_ref:
                continue
                
            t_code = mitre_ref.get("external_id")
            url = mitre_ref.get("url")
            
            title = f"{t_code}: {obj.get('name')}"
            body = obj.get("description", "")
            
            # Parse STIX timestamps (e.g. "2020-03-10T16:21:40.540Z")
            created_str = obj.get("created")
            pub_date = None
            if created_str:
                try:
                    pub_date = datetime.datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                    pub_date = pub_date.replace(tzinfo=None)
                except ValueError:
                    pass

            doc = {
                "id": f"mitre-{t_code}",
                "source_type": "mitre",
                "title": title,
                "body": body,
                "published_date": pub_date,
                "sensitivity_tier": "public",
                "url": url
            }
            documents.append(doc)

        return documents
