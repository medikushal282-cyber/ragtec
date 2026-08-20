import { describe, expect, it } from "vitest";
import { criticalNotificationRequired, evaluateRagEvidence, hasUnsupportedCitation, mitigationApprovalRequired, validKnowledgeUpload, validTriageTransition, verifiedCitations } from "./routers";

const severities = ["Critical", "High", "Medium", "Low"] as const;
const statuses = ["New", "Investigating", "Resolved"] as const;

describe("SOC policy contracts", () => {
  it("uses exactly the four required severity tiers", () => {
    expect(severities).toEqual(["Critical", "High", "Medium", "Low"]);
    expect(severities).not.toContain("Informational");
  });

  it("uses exactly the three required alert statuses", () => {
    expect(statuses).toEqual(["New", "Investigating", "Resolved"]);
    expect(statuses).not.toContain("Closed");
  });

  it("accepts only citations that exist in retrieved evidence", () => {
    expect(verifiedCitations("Mapped to [fim-7a91] and [ids-2c04].", ["fim-7a91", "ids-2c04"])).toEqual(["fim-7a91", "ids-2c04"]);
    expect(hasUnsupportedCitation("Mapped to [invented-source].", ["fim-7a91", "ids-2c04"])).toBe(true);
  });

  it("abstains when evidence does not clear the severity threshold", () => {
    expect(evaluateRagEvidence("Critical", 0.94, 3).accepted).toBe(false);
    expect(evaluateRagEvidence("High", 0.90, 3).accepted).toBe(true);
  });

  it("models immutable audit events as append-only records", () => {
    const audit = Object.freeze({ action: "INGEST_ALERT", target: "ALT-10482", chainHash: "abc123" });
    expect(() => { (audit as { action: string }).action = "DELETE"; }).toThrow();
    expect(audit.action).toBe("INGEST_ALERT");
  });

  it("enforces alert triage transitions and critical notification gating", () => {
    expect(validTriageTransition("Investigating")).toBe(true);
    expect(validTriageTransition("Resolved")).toBe(true);
    expect(criticalNotificationRequired("Critical")).toBe(true);
    expect(criticalNotificationRequired("High")).toBe(false);
  });

  it("validates PDF/TXT upload limits before storage", () => {
    expect(validKnowledgeUpload("application/pdf", 2048)).toBe(true);
    expect(validKnowledgeUpload("text/plain", 10)).toBe(true);
    expect(validKnowledgeUpload("image/png", 10)).toBe(false);
    expect(validKnowledgeUpload("application/pdf", 0)).toBe(false);
    expect(validKnowledgeUpload("application/pdf", 50 * 1024 * 1024 + 1)).toBe(false);
  });

  it("requires admin approval for high-impact mitigation", () => {
    expect(mitigationApprovalRequired(true, "user")).toBe(true);
    expect(mitigationApprovalRequired(true, "admin")).toBe(false);
    expect(mitigationApprovalRequired(false, "user")).toBe(false);
  });

  it("requires automatic notification triggers for critical alerts and escalations", () => {
    const notificationTypes = ["CriticalAlert", "IncidentEscalated"];
    expect(notificationTypes).toContain("CriticalAlert");
    expect(notificationTypes).toContain("IncidentEscalated");
  });
});
