import os
import requests
import datetime
from typing import List, Dict, Any
from .base import BaseAdapter

class CVENVDAdapter(BaseAdapter):
    update_frequency = "daily"

    def __init__(self, limit: int = 50):
        self.limit = limit
        self.api_key = os.environ.get("NVD_API_KEY")
        self.base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"

    def fetch(self) -> List[Dict[str, Any]]:
        headers = {}
        if self.api_key:
            headers["apiKey"] = self.api_key
        
        # NVD API 2.0 date range cannot exceed 120 days. Let's use 90 days.
        end_date = datetime.datetime.utcnow()
        start_date = end_date - datetime.timedelta(days=90)
        
        # Format: 2023-01-01T00:00:00.000+00:00
        start_str = start_date.strftime("%Y-%m-%dT00:00:00.000") + "+00:00"
        end_str = end_date.strftime("%Y-%m-%dT00:00:00.000") + "+00:00"
        
        params = {
            "pubStartDate": start_str,
            "pubEndDate": end_str,
            "resultsPerPage": min(self.limit * 4, 500) # grab extra to filter for CVSS
        }
        
        print(f"Fetching CVEs from NVD (using api_key: {bool(self.api_key)})...")
        try:
            response = requests.get(self.base_url, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Failed to fetch NVD data: {e}")
            return []

        vulnerabilities = data.get("vulnerabilities", [])
        documents = []

        for item in vulnerabilities:
            if len(documents) >= self.limit:
                break
                
            cve = item.get("cve", {})
            cve_id = cve.get("id")
            
            # Extract description
            descriptions = cve.get("descriptions", [])
            en_desc = next((d["value"] for d in descriptions if d.get("lang") == "en"), "")
            
            if not en_desc:
                continue
                
            # Check for CVSS score to satisfy the "must have CVSS score" requirement
            metrics = cve.get("metrics", {})
            has_cvss = any(k.startswith("cvssMetric") for k in metrics.keys())
            if not has_cvss:
                continue

            # Parse published date
            pub_date_str = cve.get("published")
            pub_date = None
            if pub_date_str:
                try:
                    # e.g. 2024-02-12T15:15:08.570
                    pub_date = datetime.datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                    # Convert timezone-aware to naive for sqlite
                    pub_date = pub_date.replace(tzinfo=None)
                except ValueError:
                    pass

            doc = {
                "id": cve_id,
                "source_type": "cve",
                "title": cve_id,
                "body": en_desc,
                "published_date": pub_date,
                "sensitivity_tier": "public",
                "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}"
            }
            documents.append(doc)

        return documents
