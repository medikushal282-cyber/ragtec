function ThreatQuery({ query, setQuery, sentQuery, setSentQuery }: any) {
  const queryApi = trpc.soc.queryPhase7.useMutation();
  
  const send = () => {
    if (query.trim()) {
      setSentQuery(query);
      queryApi.mutate({ query });
      setQuery("");
    }
  };
  
  const evidence = queryApi.data?.evidence || [];
  const answer = queryApi.data?.answer || "";
  
  return <div className="page">
    <SectionTitle eyebrow="RAGSEC CO-PILOT / GROUNDED INTELLIGENCE" title="Ask the knowledge base" action={<div className="confidence-pill"><span className="pulse" /> EVIDENCE MODE · ON</div>} />
    <div className="query-grid">
      <section className="panel query-panel">
        <div className="query-top"><div className="ai-orb"><Sparkles size={23} /></div><div><b>RAGSec Investigator</b><span>Phase 7 LLM Generation & Retrieval</span></div><Badge>PRIVATE ENCLAVE</Badge></div>
        <div className="chat-area">
          {sentQuery && <div className="query-bubble"><span className="bubble-label">YOU</span>{sentQuery}</div>}
          
          <div className="answer-block">
            <div className="answer-head"><div className="ai-mini"><Bot size={15} /></div><span>RAGSEC · GENERATED ANSWER</span></div>
            
            {queryApi.isPending && <div style={{padding: "1rem"}} className="muted">Running retrieval, reranking, and grounding LLM generation...</div>}
            
            {!queryApi.isPending && !answer && <div style={{padding: "1rem"}} className="muted">Submit a query to generate an AI response grounded in the Phase 2 corpus.</div>}
            
            {!queryApi.isPending && answer && <div style={{padding: "1rem", whiteSpace: "pre-wrap", lineHeight: 1.6}}>{answer}</div>}
            
            {!queryApi.isPending && evidence.length > 0 && <div className="evidence-trace-ui" style={{marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem"}}>
              <h4 style={{fontSize: "0.75rem", letterSpacing: "1px", color: "var(--cyan)", marginBottom: "1rem"}}>CITATIONS / EVIDENCE TRACE</h4>
              {evidence.map((e: any, i: number) => (
                <div key={e.chunk_id || i} style={{padding: "1rem", border: "1px solid var(--border)", margin: "0.5rem 0", borderRadius: "4px", background: "rgba(0,0,0,0.2)"}}>
                  <div style={{display: "flex", justifyContent: "space-between", marginBottom: "0.5rem"}}>
                    <b><FileKey2 size={12} style={{display:"inline", marginRight:4}}/> [{e.citation_tag || "C"+(i+1)}] {e.source_name || e.source}</b>
                    <div style={{display:"flex", gap: "10px"}}>
                      {e.rerank_score && <span style={{fontSize: "0.75rem", color: "var(--pink)"}}>RERANK: {Number(e.rerank_score).toFixed(2)}</span>}
                      {e.dense_score && <span style={{fontSize: "0.75rem", color: "var(--text-muted)"}}>DENSE: {Number(e.dense_score).toFixed(2)}</span>}
                    </div>
                  </div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--mono)", marginBottom: "0.5rem"}}>
                    Entities: {e.entities ? e.entities.join(", ") : (e.extracted_entities || []).join(", ") || "None"}
                  </div>
                  <p style={{fontSize: "0.85rem", lineHeight: 1.5}}>{e.masked_text || e.text || e.chunk_text}</p>
                </div>
              ))}
            </div>}
          </div>
        </div>
        <div className="query-compose">
          <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}} placeholder="Ask about recent threats, IOCs, or affected hosts..." />
          <button className="pink-btn" onClick={send} disabled={queryApi.isPending}><Sparkles size={14} /> {queryApi.isPending ? "Generating..." : "Generate"}</button>
        </div>
      </section>
      <aside className="panel nav-panel">
        <div className="side-label">GOVERNANCE</div>
        <ul className="gov-list">
          <li><CheckCircle2 size={14} /> Identity verified</li>
          <li><CheckCircle2 size={14} /> PII masking active</li>
          <li><CheckCircle2 size={14} /> Cross-encoder alignment</li>
          <li><CheckCircle2 size={14} /> Citation check</li>
        </ul>
      </aside>
    </div>
  </div>;
}
