import json
from models import CanonicalDocument, SensitivityTier
from retrieval.chunker import chunk_document

print("--- TESTING PHASE 2: HYBRID CHUNKING & ENTITIES ---")

def print_chunks(doc_type, chunks):
    print(f"\n[{doc_type.upper()}] Generated {len(chunks)} chunks.")
    for i, c in enumerate(chunks):
        print(f"  Chunk {i} ID: {c.chunk_id}")
        print(f"  Provenance - DocID: {c.document_id}, Source: {c.source_name}, Type: {c.source_type}")
        print(f"  Text: {c.text[:60]}...")
        print(f"  Entities: {json.dumps(c.extracted_entities.model_dump())}")
        print("  ---")

# 1. Narrative Threat Report
narrative_text = """
The threat actor TA0001 (Initial Access) was observed exploiting CVE-2023-12345 to gain access to WS-CORP-DESKTOP.
The IP 192.168.1.50 was used to download a payload with SHA256 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92.

After initial access, they established C2 using the domain malicious-c2.com.
This relates to T1071.001 Web Protocol.
"""

doc_narrative = CanonicalDocument(
    document_id="DOC-NAR-01",
    source_name="CTI_Report_2023",
    source_type="narrative",
    title="TA0001 Activity",
    content=narrative_text,
    sensitivity_tier=SensitivityTier.INTERNAL
)
chunks_narrative = chunk_document(doc_narrative)
print_chunks("narrative", chunks_narrative)

# 2. Sigma/YARA Rule Block
yara_text = """
rule MaliciousPayload {
    meta:
        description = "Detects the specific payload"
        author = "SOC Team"
        reference = "CVE-2023-12345"
    strings:
        $a = "evil_string"
        $ip = "10.0.0.5"
    condition:
        $a and $ip
}

rule SecondaryPayload {
    meta:
        description = "Detects another payload dropping from malicious-c2.com"
    strings:
        $b = "C2_beacon"
    condition:
        $b
}
"""

doc_rule = CanonicalDocument(
    document_id="DOC-YARA-01",
    source_name="Yara_Repo",
    source_type="rule",
    title="Malware Rules",
    content=yara_text,
    sensitivity_tier=SensitivityTier.INTERNAL
)
chunks_rule = chunk_document(doc_rule)
print_chunks("rule", chunks_rule)

# 3. Structured IOC CSV
csv_text = """ip_address,domain,hash,description
192.168.5.5,bad.com,11111111111111111111111111111111,First bad IOC
10.0.0.99,evil.net,22222222222222222222222222222222,Second bad IOC
"""

doc_csv = CanonicalDocument(
    document_id="DOC-CSV-01",
    source_name="IOC_Feed",
    source_type="csv",
    title="Daily IOCs",
    content=csv_text,
    sensitivity_tier=SensitivityTier.RESTRICTED
)
chunks_csv = chunk_document(doc_csv)
print_chunks("csv", chunks_csv)

# 4. Malformed CSV / Fallback Test
malformed_csv_text = "this is just a bad csv string that doesn't really parse correctly 192.168.1.100"
doc_malformed = CanonicalDocument(
    document_id="DOC-MAL-01",
    source_name="Bad_Feed",
    source_type="csv",
    title="Bad CSV",
    content=malformed_csv_text,
    sensitivity_tier=SensitivityTier.PUBLIC
)
chunks_malformed = chunk_document(doc_malformed)
print_chunks("malformed csv fallback", chunks_malformed)
