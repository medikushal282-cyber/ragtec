import hashlib
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import IngestedDocument
from sources import CVENVDAdapter, MitreAttackAdapter, SyntheticIncidentAdapter, SOPLoaderAdapter

def compute_hash(source_type: str, title: str, body: str) -> str:
    hash_input = f"{source_type}|{title}|{body}"
    return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

def main():
    print("Initializing Database tables...")
    # This will create ingested_documents if it doesn't exist
    Base.metadata.create_all(bind=engine)
    
    adapters = [
        CVENVDAdapter(limit=50),
        MitreAttackAdapter(),
        SyntheticIncidentAdapter(),
        SOPLoaderAdapter()
    ]
    
    db: Session = SessionLocal()
    
    summary_counts = {
        "cve": 0,
        "mitre": 0,
        "synthetic": 0,
        "sop": 0,
        "skipped_duplicates": 0,
        "rejected": 0
    }
    
    try:
        for adapter in adapters:
            docs = adapter.fetch()
            
            for doc_dict in docs:
                # Add 1a validation gate
                if not adapter.validate(doc_dict):
                    summary_counts["rejected"] += 1
                    continue
                    
                content_hash = compute_hash(
                    doc_dict.get("source_type", ""), 
                    doc_dict.get("title", ""), 
                    doc_dict.get("body", "")
                )
                
                # Check for duplicate
                existing_doc = db.query(IngestedDocument).filter(IngestedDocument.content_hash == content_hash).first()
                if existing_doc:
                    summary_counts["skipped_duplicates"] += 1
                    continue
                
                new_doc = IngestedDocument(
                    id=doc_dict.get("id"),
                    source_type=doc_dict.get("source_type"),
                    title=doc_dict.get("title"),
                    body=doc_dict.get("body"),
                    published_date=doc_dict.get("published_date"),
                    sensitivity_tier=doc_dict.get("sensitivity_tier"),
                    url=doc_dict.get("url"),
                    content_hash=content_hash
                )
                db.add(new_doc)
                
                src_type = doc_dict.get("source_type")
                if src_type in summary_counts:
                    summary_counts[src_type] += 1
                else:
                    summary_counts[src_type] = 1
                    
        db.commit()
        print("\n--- Ingestion Complete ---")
        for k, v in summary_counts.items():
            print(f"{k}: {v}")
            
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
