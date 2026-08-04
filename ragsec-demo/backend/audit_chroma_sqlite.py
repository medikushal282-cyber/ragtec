import sqlite3
conn = sqlite3.connect('./chroma_db/chroma.sqlite3')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cur.fetchall())
try:
    cur.execute("SELECT COUNT(*) FROM embeddings")
    print("Embeddings count:", cur.fetchone())
except Exception as e:
    print("embeddings table error:", e)
try:
    cur.execute("SELECT COUNT(*) FROM embedding_fulltext_search")
    print("Fulltext count:", cur.fetchone())
except Exception as e:
    print("fulltext error:", e)
try:
    cur.execute("SELECT name FROM collections")
    print("Collections:", cur.fetchall())
except Exception as e:
    print("collections error:", e)
conn.close()
