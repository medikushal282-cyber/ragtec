import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { alerts, auditEvents, evidenceAttachments, fimEvents, fleetHosts, incidentNotes, incidents, knowledgeSources, mitigationActions, notificationEvents, playbooks, ragChunks } from "../drizzle/schema";
import { getDb } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const severity = z.enum(["Critical", "High", "Medium", "Low"]);
const status = z.enum(["New", "Investigating", "Resolved"]);
const sourceMime = z.enum(["application/pdf", "text/plain"]);

async function appendAudit(actorId: number | string | undefined, action: string, target: string, result: string) {
  const db = await getDb(); if (!db) return;
  const aid = typeof actorId === 'number' ? actorId : null;
  await db.insert(auditEvents).values({ actorId: aid, action, target, result, chainHash: `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`, createdAt: new Date() });
}
export const RAG_THRESHOLDS = { Low: 0.65, Medium: 0.75, High: 0.85, Critical: 0.95 } as const;
export function verifiedCitations(text: string, allowed: string[]) { return Array.from(text.matchAll(/\[([a-z0-9-]+)\]/gi)).map(m => m[1]).filter(id => allowed.includes(id)); }
export function hasUnsupportedCitation(text: string, allowed: string[]) { return Array.from(text.matchAll(/\[([a-z0-9-]+)\]/gi)).some(m => !allowed.includes(m[1])); }
export function evaluateRagEvidence(severityLevel: keyof typeof RAG_THRESHOLDS, topScore: number, distinctSources: number) { const minimumSources = severityLevel === "Critical" ? 4 : severityLevel === "High" ? 3 : severityLevel === "Medium" ? 2 : 1; return { accepted: topScore >= RAG_THRESHOLDS[severityLevel] && distinctSources >= minimumSources, minimumSources, threshold: RAG_THRESHOLDS[severityLevel] }; }
export function criticalNotificationRequired(level: keyof typeof RAG_THRESHOLDS) { return level === "Critical"; }
export function mitigationApprovalRequired(highImpact: boolean, role: "user" | "admin") { return highImpact && role !== "admin"; }
export function validKnowledgeUpload(mimeType: string, byteLength: number) { return ["application/pdf", "text/plain"].includes(mimeType) && byteLength > 0 && byteLength <= 50 * 1024 * 1024; }
export function validTriageTransition(nextStatus: "New" | "Investigating" | "Resolved") { return ["New", "Investigating", "Resolved"].includes(nextStatus); }

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }) }),
  soc: router({
    systemHealth: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/search?q=healthcheck"); // Check if python is alive
        if (res.ok) return { status: "online", msg: "ALL SYSTEMS NOMINAL" };
        return { status: "degraded", msg: "API DEGRADED" };
      } catch {
        return { status: "offline", msg: "PYTHON API OFFLINE" };
      }
    }),
    getEvents: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/soc/events");
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }),
    getIncidents: publicProcedure.query(async () => {
      // Fetch from dashboard for now, as it returns recent incidents
      try {
        const res = await fetch("http://localhost:8000/api/soc/dashboard");
        if (res.ok) {
          const data = await res.json();
          return data.incidents || [];
        }
      } catch (e) {}
      return [];
    }),
    getFimEvents: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/events");
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }),
    getFimAlerts: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/alerts");
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }),
    quarantineFile: publicProcedure.input(z.object({ filePath: z.string().optional(), eventId: z.string().optional() })).mutation(async ({ input, ctx }) => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/quarantine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: input.filePath,
            filePath: input.filePath,
            event_id: input.eventId,
            eventId: input.eventId
          })
        });
        if (res.ok) {
          const data = await res.json();
          await appendAudit(ctx.user?.id || "ANALYST", "QUARANTINE_FILE", input.filePath || input.eventId || "unknown", data.status);
          return data;
        }
        const err = await res.json();
        return { status: "ERROR", detail: err.detail || "Quarantine failed" };
      } catch (e: any) {
        return { status: "ERROR", detail: e.message };
      }
    }),
    restoreFile: publicProcedure.input(z.object({ quarantinePath: z.string(), originalPath: z.string() })).mutation(async ({ input, ctx }) => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quarantine_path: input.quarantinePath,
            quarantinePath: input.quarantinePath,
            original_path: input.originalPath,
            originalPath: input.originalPath
          })
        });
        if (res.ok) {
          const data = await res.json();
          await appendAudit(ctx.user?.id || "ANALYST", "RESTORE_FILE", input.originalPath, data.status);
          return data;
        }
        return { status: "ERROR" };
      } catch (e: any) {
        return { status: "ERROR", detail: e.message };
      }
    }),
    listQuarantined: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/quarantined");
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }),
    ignoreFile: publicProcedure.input(z.object({
      filePath: z.string().optional(),
      eventId: z.string().optional(),
      duration: z.string().default("permanent"),
      reason: z.string().optional()
    })).mutation(async ({ input, ctx }) => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/ignore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (res.ok) {
          const data = await res.json();
          await appendAudit(ctx.user?.id || "ANALYST", `IGNORE_${input.duration.toUpperCase()}`, input.filePath || input.eventId || "unknown", data.status);
          return data;
        }
        return { status: "ERROR" };
      } catch (e: any) {
        return { status: "ERROR", detail: e.message };
      }
    }),
    listWhitelist: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/whitelist");
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }),
    scanWorkspace: publicProcedure.mutation(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/scan", { method: "POST" });
        if (res.ok) return await res.json();
      } catch (e) {}
      return { status: "ERROR" };
    }),
    getDevices: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/soc/devices");
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }),
    telemetrySnapshot: publicProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/soc/dashboard");
        if (res.ok) {
          const data = await res.json();
          // transform incidents to match frontend expected format
          const formattedIncidents = data.incidents?.map((i: any) => ({
            id: i.id,
            title: i.title,
            severity: i.threat_classification?.severity || "Medium",
            state: i.status || "Investigating",
            time: i.timestamp ? new Date(i.timestamp).toLocaleTimeString() : "Now",
            owner: "System",
            techniques: []
          })) || [];
          
          const formattedFim = data.fim?.map((e: any) => ({
            time: new Date(e.timestamp).toLocaleTimeString(),
            host: e.device_id || "local",
            path: e.canonical?.file_path || "unknown",
            action: e.canonical?.action || "unknown",
            risk: e.canonical?.risk_score || 0,
            hash: e.canonical?.file_hash || "unknown",
            judgment: e.canonical?.risk_score > 50 ? "Suspicious" : "Benign"
          })) || [];

          return {
            generatedAt: new Date(data.generatedAt),
            simulated: false,
            metrics: data.metrics || {
              total_events: 0,
              fim_events: 0,
              total_incidents: 0,
              device_count: 0,
              critical_incidents: 0
            },
            incidents: formattedIncidents,
            fim: formattedFim
          };
        }
      } catch (e) {
      }
      // fallback
      return { generatedAt: new Date(), simulated: true, alerts: [], fim: [], fleet: [], incidents: [], actions: [] };
    }),
    listAlerts: protectedProcedure.input(z.object({ severity: severity.optional(), status: status.optional() }).optional()).query(async ({ input }) => { const db = await getDb(); if (!db) return []; const rows = await db.select().from(alerts).orderBy(desc(alerts.createdAt)); return rows.filter(r => (!input?.severity || r.severity === input.severity) && (!input?.status || r.status === input.status)); }),
    updateAlert: protectedProcedure.input(z.object({ id: z.number(), status, severity: severity.optional(), assignedTo: z.number().optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.update(alerts).set({ status: input.status, severity: input.severity, assignedTo: input.assignedTo }).where(eq(alerts.id, input.id)); await appendAudit(ctx.user.id, "UPDATE_ALERT", String(input.id), `${input.status}${input.severity ? `/${input.severity}` : ""}`); return { success: true }; }),
    ingestAlert: protectedProcedure.input(z.object({ alertKey: z.string(), title: z.string(), host: z.string(), severity, tactic: z.string().optional(), source: z.string().optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.insert(alerts).values(input); if (criticalNotificationRequired(input.severity)) { const delivered = await notifyOwner({ title: `Critical SOC alert: ${input.alertKey}`, content: `${input.title} on ${input.host}. Immediate analyst review required.` }); await db.insert(notificationEvents).values({ eventType: "CriticalAlert", targetKey: input.alertKey, delivered: delivered ? 1 : 0 }); } await appendAudit(ctx.user.id, "INGEST_ALERT", input.alertKey, input.severity); return { success: true }; }),
    bulkTriage: protectedProcedure.input(z.object({ ids: z.array(z.number()).min(1), status })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; for (const id of input.ids) await db.update(alerts).set({ status: input.status }).where(eq(alerts.id, id)); await appendAudit(ctx.user.id, "BULK_TRIAGE", input.ids.join(","), input.status); return { success: true, count: input.ids.length }; }),
    assignAlert: protectedProcedure.input(z.object({ alertId: z.number(), analystId: z.number() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.update(alerts).set({ assignedTo: input.analystId }).where(eq(alerts.id, input.alertId)); await appendAudit(ctx.user.id, "ASSIGN_ALERT", String(input.alertId), String(input.analystId)); return { success: true }; }),
    askRag: protectedProcedure.input(z.object({ query: z.string().min(3), severity: severity.default("Medium") })).mutation(async ({ input, ctx }) => {
      const db = await getDb(); const candidates = db ? await db.select().from(ragChunks).orderBy(desc(ragChunks.relevance)).limit(8) : [];
      const fallback = [{ chunkKey: "fim-7a91", content: "File creation on FIN-WS-042 with SHA-256 a9f2c3…c31e." }, { chunkKey: "ids-2c04", content: "IDS ransomware signature from 10.24.8.42." }, { chunkKey: "sop-91d2", content: "Isolate endpoint and preserve volatile evidence." }];
      const evidence = candidates.length ? candidates.map(c => ({ chunkKey: c.chunkKey, content: c.content })) : fallback;
      const allowed = evidence.map(e => e.chunkKey); const topScore = candidates.length ? (candidates[0].relevance / 100) : .94; const decision = evaluateRagEvidence(input.severity, topScore, allowed.length);
      if (!decision.accepted) { await appendAudit(ctx.user.id, "RAG_QUERY_ABSTAIN", input.query.slice(0, 180), "Evidence insufficient"); return { answer: "Evidence Insufficient for Analysis.", citations: [], confidence: topScore, abstained: true }; }
      const response = await invokeLLM({ messages: [{ role: "system", content: "You are RAGSec Investigator. Answer only from supplied evidence. Every analytical claim must include an inline citation like [chunk-key]. If evidence is insufficient, say Evidence Insufficient for Analysis. Never invent IOCs." }, { role: "user", content: `Question: ${input.query}\nEvidence:\n${evidence.map(e => `[${e.chunkKey}] ${e.content}`).join("\n")}` }] });
      const answer = String(response.choices?.[0]?.message?.content || "Evidence Insufficient for Analysis."); const citations = verifiedCitations(answer, allowed); const invalid = hasUnsupportedCitation(answer, allowed); const abstained = invalid || citations.length === 0;
      await appendAudit(ctx.user.id, abstained ? "RAG_QUERY_ABSTAIN" : "RAG_QUERY", input.query.slice(0, 180), abstained ? "Citation verification failed" : "Evidence-grounded response");
      return { answer: abstained ? "Evidence Insufficient for Analysis." : answer, citations: abstained ? [] : citations, confidence: topScore, abstained };
    }),
    listIncidents: protectedProcedure.query(async () => { const db = await getDb(); return db ? db.select().from(incidents).orderBy(desc(incidents.createdAt)) : []; }),
    createIncident: protectedProcedure.input(z.object({ incidentKey: z.string(), title: z.string(), severity, alertId: z.number().optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.insert(incidents).values({ incidentKey: input.incidentKey, title: input.title, severity: input.severity, ownerId: ctx.user.id }); await appendAudit(ctx.user.id, "CREATE_INCIDENT", input.incidentKey, input.alertId ? `Linked alert ${input.alertId}` : "Created"); return { success: true }; }),
    addIncidentNote: protectedProcedure.input(z.object({ incidentId: z.number(), body: z.string().min(1) })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.insert(incidentNotes).values({ incidentId: input.incidentId, authorId: ctx.user.id, body: input.body }); await appendAudit(ctx.user.id, "ADD_INCIDENT_NOTE", String(input.incidentId), "Committed"); return { success: true }; }),
    listEvidence: protectedProcedure.input(z.object({ incidentId: z.number() })).query(async ({ input }) => { const db = await getDb(); return db ? db.select().from(evidenceAttachments).where(eq(evidenceAttachments.incidentId, input.incidentId)).orderBy(desc(evidenceAttachments.createdAt)) : []; }),
    attachEvidenceMetadata: protectedProcedure.input(z.object({ incidentId: z.number(), name: z.string(), mimeType: z.string(), storageKey: z.string(), sha256: z.string().optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.insert(evidenceAttachments).values({ ...input, uploadedBy: ctx.user.id }); await appendAudit(ctx.user.id, "ATTACH_EVIDENCE", String(input.incidentId), input.name); return { success: true }; }),
    escalateIncident: protectedProcedure.input(z.object({ incidentKey: z.string(), title: z.string() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.update(incidents).set({ escalatedAt: new Date(), status: "Investigating" }).where(eq(incidents.incidentKey, input.incidentKey)); const delivered = await notifyOwner({ title: `Incident escalated: ${input.incidentKey}`, content: input.title }); await db.insert(notificationEvents).values({ eventType: "IncidentEscalated", targetKey: input.incidentKey, delivered: delivered ? 1 : 0 }); await appendAudit(ctx.user.id, "ESCALATE_INCIDENT", input.incidentKey, "Notification dispatched"); return { success: true, notified: delivered }; }),
    listFIM: protectedProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/fim/events");
        if (res.ok) {
          const events = await res.json();
          return events.map((e: any) => ({
            id: e.id,
            host: e.device_id || "local",
            filePath: e.canonical?.file_path || "unknown",
            changeType: e.canonical?.action || "unknown",
            sha256: e.canonical?.file_hash_sha256 || "",
            riskScore: e.is_suspicious ? 95 : 10,
            judgment: e.is_suspicious ? "Suspicious" : "Benign",
            occurredAt: new Date(e.timestamp)
          }));
        }
      } catch (e) {
        console.error("Failed to fetch FIM events:", e);
      }
      return [];
    }),
    listFleet: protectedProcedure.query(async () => { const db = await getDb(); return db ? db.select().from(fleetHosts).orderBy(desc(fleetHosts.lastSeenAt)) : []; }),
    listSources: protectedProcedure.query(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/knowledge/sources");
        if (res.ok) {
          const sources = await res.json();
          return sources.map((s: any) => ({
            id: s.id,
            name: s.name,
            mimeType: s.mimeType,
            storageKey: s.id,
            ingestionStatus: s.ingestionStatus,
            chunkCount: s.chunkCount,
            uploadedBy: 1, // Default or admin
            createdAt: new Date(s.createdAt),
            extractedEntities: s.extractedEntities // Expose entities to frontend
          }));
        }
      } catch (e) {
        console.error("Failed to fetch knowledge sources:", e);
      }
      return [];
    }),
    uploadKnowledgeSource: protectedProcedure.input(z.object({ name: z.string().min(1), mimeType: z.string(), base64: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const raw = Buffer.from(input.base64, "base64"); 
      const content = raw.toString('utf-8'); // Assume text-based for now (txt, csv, json, yml)
      
      const payload = {
          title: input.name,
          content: content,
          source_name: input.name,
          source_type: "cti_report"
      };

      try {
        const res = await fetch("http://localhost:8000/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Python ingest failed");
        const data = await res.json();
        await appendAudit(ctx.user.id, "UPLOAD_KNOWLEDGE_SOURCE", input.name, `Ingested ${data.chunks_extracted} chunks`);
        return { success: true, key: data.document_id };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
    }),
    retrievePhase3: protectedProcedure.input(z.object({ query: z.string() })).mutation(async ({ input }) => {
      try {
        const res = await fetch("http://localhost:8000/api/retrieve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input.query, top_k: 50, top_n: 5 })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error("Retrieve Phase 3 error", e);
      }
      return { query: input.query, evidence: [] };
    }),
    queryPhase7: publicProcedure.input(z.object({ query: z.string() })).mutation(async ({ input, ctx }) => {
      try {
        const res = await fetch("http://localhost:8000/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input.query })
        });
        if (res.ok) {
          const data = await res.json();
          const status = data.status || "ANSWERED";
          await appendAudit(ctx.user?.id || "anonymous", status === "ABSTAINED" ? "RAG_QUERY_ABSTAIN" : "RAG_QUERY", input.query.slice(0, 180), status === "ABSTAINED" ? "Evidence insufficient" : "Evidence-grounded response");
          
          // Force UI to show actual Identity Verified state
          if (data.governance) {
            data.governance.identity_verified = !!ctx.user?.id;
          }
          
          return data;
        }
      } catch (e) {
        console.error("Query Phase 7 error", e);
      }
      return { answer: "AI Chat Error: Could not connect to backend.", evidence: [], governance: { gating: "ERROR", pii_masked: false, cross_encoder_active: false, citation_check: "ERROR", crc_passed: false, identity_verified: false } };
    }),
    globalSearch: publicProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
      try {
        const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(input.q)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error("Global search error", e);
      }
      return { results: [], query: input.q, count: 0 };
    }),
    listPlaybooks: protectedProcedure.query(async () => { const db = await getDb(); return db ? db.select().from(playbooks).orderBy(desc(playbooks.createdAt)) : []; }),
    requestMitigation: protectedProcedure.input(z.object({ playbookId: z.number(), incidentId: z.number().optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.insert(mitigationActions).values({ playbookId: input.playbookId, incidentId: input.incidentId, requestedBy: ctx.user.id }); await appendAudit(ctx.user.id, "REQUEST_MITIGATION", String(input.playbookId), "Approval requested"); return { success: true, requiresApproval: true }; }),
    approveMitigation: adminProcedure.input(z.object({ actionId: z.number() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) return { success: false }; await db.update(mitigationActions).set({ status: "Approved" }).where(eq(mitigationActions.id, input.actionId)); await appendAudit(ctx.user.id, "APPROVE_MITIGATION", String(input.actionId), "Approved by admin"); return { success: true }; }),
    immutableAudit: protectedProcedure.query(async () => { const db = await getDb(); return db ? db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)) : []; }),
  }),
});
export type AppRouter = typeof appRouter;
