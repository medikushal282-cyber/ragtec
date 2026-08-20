import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:ragsec.db",
  },
});
