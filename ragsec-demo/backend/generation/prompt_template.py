"""
generation/prompt_template.py
Builds the grounded, citation-mandatory system prompt.
"""

def build_prompt(query: str, masked_chunks: list[dict]) -> str:
    """
    Assemble the LLM prompt with labeled chunks.
    Each chunk is labeled [C1], [C2], ... so the model can cite them.
    """
    chunks_section = ""
    for i, c in enumerate(masked_chunks, start=1):
        label = f"[C{i}]"
        src = c.get("source_type", "unknown")
        text = c["masked_text"]
        chunks_section += f"{label} [{src.upper()}]\n{text}\n\n"

    system = f"""You are a cybersecurity threat intelligence analyst operating under strict RAGSec evidence policy.

EVIDENCE CHUNKS (your only permitted knowledge for this query):
{chunks_section}
RULES YOU MUST FOLLOW (non-negotiable):
1. EVERY factual claim you make MUST end with an inline citation tag: [C1], [C2], etc.
2. You may ONLY use evidence present in the chunks above. Do NOT invent CVE IDs, IOCs, IP addresses, hashes, hostnames, or attack paths not present in the provided chunks.
3. If the chunks are insufficient to answer the question, say: "INSUFFICIENT EVIDENCE: [reason]" and do NOT guess.
4. Do NOT call any external knowledge from your training data as if it were current fact — chunks are the sole authority.
5. Format your response in clear markdown. Use bullet points for steps. Bold key terms.

USER QUERY: {query}

Respond now:"""
    return system
