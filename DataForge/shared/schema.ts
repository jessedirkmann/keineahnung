import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const enrichmentJobs = pgTable("enrichment_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  totalRows: integer("total_rows").notNull(),
  processedRows: integer("processed_rows").default(0),
  successfulRows: integer("successful_rows").default(0),
  failedRows: integer("failed_rows").default(0),
  tokensUsed: integer("tokens_used").default(0),
  totalCost: text("total_cost").default("0.00"),
  prompt: text("prompt").notNull(),
  targetColumns: json("target_columns").$type<string[]>().notNull(),
  selectedColumns: json("selected_columns").$type<string[]>().notNull(),
  csvData: json("csv_data").$type<Record<string, any>[]>().notNull(),
  results: json("results").$type<Record<string, any>[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEnrichmentJobSchema = createInsertSchema(enrichmentJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  apiKey: z.string().min(1),
  model: z.string().default("gpt-4o-mini"),
  concurrency: z.number().default(5),
});

export const enrichmentConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().default("gpt-4o-mini"),
  concurrency: z.number().min(1).max(20).default(5),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EnrichmentJob = typeof enrichmentJobs.$inferSelect;
export type InsertEnrichmentJob = z.infer<typeof insertEnrichmentJobSchema>;
export type EnrichmentConfig = z.infer<typeof enrichmentConfigSchema>;
