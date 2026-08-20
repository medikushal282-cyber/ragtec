import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp' }).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: 'timestamp' }).notNull(),
});

export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  alertKey: text("alertKey").notNull().unique(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  severity: text("severity").notNull(),
  status: text("status").default("New").notNull(),
  tactic: text("tactic"),
  source: text("source"),
  assignedTo: integer("assignedTo"),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp' }).notNull(),
});

export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentKey: text("incidentKey").notNull().unique(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").default("Investigating").notNull(),
  ownerId: integer("ownerId"),
  escalatedAt: integer("escalatedAt", { mode: 'timestamp' }),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp' }).notNull(),
});

export const incidentNotes = sqliteTable("incident_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incidentId").notNull(),
  authorId: integer("authorId").notNull(),
  body: text("body").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const evidenceAttachments = sqliteTable("evidence_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incidentId").notNull(),
  name: text("name").notNull(),
  mimeType: text("mimeType").notNull(),
  storageKey: text("storageKey").notNull(),
  sha256: text("sha256"),
  uploadedBy: integer("uploadedBy").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const fimEvents = sqliteTable("fim_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  host: text("host").notNull(),
  filePath: text("filePath").notNull(),
  changeType: text("changeType").notNull(),
  sha256: text("sha256"),
  riskScore: integer("riskScore").default(0).notNull(),
  judgment: text("judgment").default("Benign").notNull(),
  occurredAt: integer("occurredAt", { mode: 'timestamp' }).notNull(),
});

export const fleetHosts = sqliteTable("fleet_hosts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hostname: text("hostname").notNull().unique(),
  os: text("os"),
  ip: text("ip"),
  agentStatus: text("agentStatus").default("Healthy").notNull(),
  lastSeenAt: integer("lastSeenAt", { mode: 'timestamp' }),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const playbooks = sqliteTable("playbooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  requiresApproval: integer("requiresApproval").default(1).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const mitigationActions = sqliteTable("mitigation_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playbookId: integer("playbookId").notNull(),
  incidentId: integer("incidentId"),
  requestedBy: integer("requestedBy").notNull(),
  status: text("status").default("Requested").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const knowledgeSources = sqliteTable("knowledge_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mimeType: text("mimeType").notNull(),
  storageKey: text("storageKey").notNull(),
  ingestionStatus: text("ingestionStatus").default("Queued").notNull(),
  chunkCount: integer("chunkCount").default(0).notNull(),
  uploadedBy: integer("uploadedBy").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const ragChunks = sqliteTable("rag_chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("sourceId").notNull(),
  chunkKey: text("chunkKey").notNull().unique(),
  content: text("content").notNull(),
  entities: text("entities"),
  relevance: integer("relevance").default(0).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actorId"),
  action: text("action").notNull(),
  target: text("target"),
  result: text("result"),
  chainHash: text("chainHash").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export const notificationEvents = sqliteTable("notification_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("eventType").notNull(),
  targetKey: text("targetKey").notNull(),
  delivered: integer("delivered").default(0).notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp' }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
