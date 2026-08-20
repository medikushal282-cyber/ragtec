import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = (role: "user" | "admin" = "user"): TrpcContext => ({
  user: { id: 42, openId: "soc-test", name: "SOC Test", email: "soc@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("SOC procedures", () => {
  it("rejects invalid alert severity values at the contract boundary", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.soc.ingestAlert({ alertKey: "ALT-X", title: "Bad", host: "host", severity: "Informational" as never })).rejects.toThrow();
  });

  it("rejects empty RAG questions before retrieval", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.soc.askRag({ query: "" })).rejects.toThrow();
  });

  it("accepts the analyst assignment payload shape", () => {
    const parsed = { alertId: 12, analystId: 42 };
    expect(parsed.alertId).toBeTypeOf("number");
    expect(parsed.analystId).toBeTypeOf("number");
  });

  it("keeps high-impact approval behind the admin procedure", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.soc.approveMitigation({ actionId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
