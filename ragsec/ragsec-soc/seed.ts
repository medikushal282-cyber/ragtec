import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./drizzle/schema";
import path from "path";

const dbPath = path.resolve(process.cwd(), "ragsec.db");
const sqlite = createClient({ url: "file:" + dbPath });
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");
  await db.insert(schema.fleetHosts).values([
    { hostname: "WS-CORP-DESKTOP", os: "Windows 11", ip: "192.168.1.50", agentStatus: "At risk", createdAt: new Date() },
    { hostname: "SRV-FILE-01", os: "Windows Server 2022", ip: "10.0.0.5", agentStatus: "Healthy", createdAt: new Date() },
  ]);

  await db.insert(schema.alerts).values([
    { alertKey: "ALT-100", title: "Potential SSH Scan Detected", host: "SRV-FILE-01", severity: "High", status: "Investigating", tactic: "Reconnaissance", source: "IDS", createdAt: new Date(), updatedAt: new Date() },
    { alertKey: "ALT-101", title: "Malicious Payload execution", host: "WS-CORP-DESKTOP", severity: "Critical", status: "Investigating", tactic: "Execution", source: "EDR", createdAt: new Date(), updatedAt: new Date() },
    { alertKey: "ALT-102", title: "Outbound HTTPS to Cloud Provider", host: "WS-CORP-DESKTOP", severity: "Low", status: "New", tactic: "Exfiltration", source: "Firewall", createdAt: new Date(), updatedAt: new Date() },
  ]);

  await db.insert(schema.incidents).values([
    { incidentKey: "INC-200", title: "Initial Access via Exploit", severity: "Critical", status: "Investigating", createdAt: new Date(), updatedAt: new Date() },
  ]);

  await db.insert(schema.fimEvents).values([
    { host: "WS-CORP-DESKTOP", filePath: "C:\\Windows\\System32\\svchost.exe", changeType: "Modified", riskScore: 85, judgment: "Suspicious", occurredAt: new Date() },
  ]);

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
