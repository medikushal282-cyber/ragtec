import time
import math
from collections import defaultdict
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import IngestedDocument
from chunking import route_and_chunk
from embedding import EmbeddingEngine
from vectorstore import VectorStore

def main():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    # Initialize components
    print("Initializing Embedding Engine (may take a moment to load the model)...")
    embedder = EmbeddingEngine(model_name="BAAI/bge-small-en-v1.5")
    
    print("Initializing Vector Store...")
    vector_store = VectorStore()
    
    # Query unchunked documents
    print("Querying unchunked documents...")
    unprocessed_docs = db.query(IngestedDocument).filter(IngestedDocument.chunked == False).all()
    
    if not unprocessed_docs:
        print("No new documents to process. Exiting.")
        return
        
    print(f"Found {len(unprocessed_docs)} documents to process.")
    
    start_time = time.time()
    
    all_chunks = []
    doc_count = 0
    chunk_counts_by_source = defaultdict(int)
    
    # 1. Chunk all documents
    for doc in unprocessed_docs:
        chunks = route_and_chunk(doc)
        all_chunks.extend(chunks)
        doc_count += 1
        chunk_counts_by_source[doc.source_type] += len(chunks)
        
    print(f"Generated {len(all_chunks)} total chunks.")
    
    # 2. Embed in batches
    batch_size = 64
    num_batches = math.ceil(len(all_chunks) / batch_size)
    
    print(f"Embedding chunks in {num_batches} batches...")
    all_embeddings = []
    
    for i in range(num_batches):
        batch = all_chunks[i * batch_size : (i + 1) * batch_size]
        texts = [chunk.text for chunk in batch]
        embeddings = embedder.embed(texts, batch_size=batch_size)
        all_embeddings.extend(embeddings)
        print(f"  Processed batch {i+1}/{num_batches}")
        
    # 3. Store in VectorDB
    print("Writing chunks and embeddings to Chroma...")
    vector_store.add_chunks(all_chunks, all_embeddings)
    
    # 4. Mark as chunked in DB
    print("Updating SQLite records...")
    for doc in unprocessed_docs:
        doc.chunked = True
    db.commit()
    db.close()
    
    end_time = time.time()
    elapsed = end_time - start_time
    
    # 5. Summary
    print("\n--- Chunking and Embedding Complete ---")
    print(f"Total documents processed: {doc_count}")
    print(f"Total chunks created: {len(all_chunks)}")
    print("Chunks per source:")
    for source, count in chunk_counts_by_source.items():
        print(f"  {source}: {count}")
    
    if doc_count > 0:
        print(f"Average chunks per document: {len(all_chunks) / doc_count:.2f}")
    print(f"Elapsed time: {elapsed:.2f} seconds")

if __name__ == "__main__":
    main()
