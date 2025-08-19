import { type User, type InsertUser, type EnrichmentJob, type InsertEnrichmentJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createEnrichmentJob(job: InsertEnrichmentJob): Promise<EnrichmentJob>;
  getEnrichmentJob(id: string): Promise<EnrichmentJob | undefined>;
  getRecentEnrichmentJobs(limit?: number): Promise<EnrichmentJob[]>;
  updateEnrichmentJobStatus(id: string, status: string): Promise<void>;
  updateEnrichmentJobProgress(id: string, progress: {
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    tokensUsed: number;
    totalCost: string;
    results?: Record<string, any>[];
  }): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private enrichmentJobs: Map<string, EnrichmentJob>;

  constructor() {
    this.users = new Map();
    this.enrichmentJobs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createEnrichmentJob(insertJob: InsertEnrichmentJob): Promise<EnrichmentJob> {
    const id = randomUUID();
    const { apiKey, model, concurrency, ...jobData } = insertJob;
    const job: EnrichmentJob = {
      id,
      userId: null,
      filename: jobData.filename,
      status: "pending",
      totalRows: jobData.totalRows,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      tokensUsed: 0,
      totalCost: "0.00",
      prompt: jobData.prompt,
      targetColumns: jobData.targetColumns as string[],
      selectedColumns: jobData.selectedColumns as string[],
      csvData: jobData.csvData as Record<string, any>[],
      results: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.enrichmentJobs.set(id, job);
    return job;
  }

  async getEnrichmentJob(id: string): Promise<EnrichmentJob | undefined> {
    return this.enrichmentJobs.get(id);
  }

  async getRecentEnrichmentJobs(limit: number = 10): Promise<EnrichmentJob[]> {
    const jobs = Array.from(this.enrichmentJobs.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    return jobs;
  }

  async updateEnrichmentJobStatus(id: string, status: string): Promise<void> {
    const job = this.enrichmentJobs.get(id);
    if (job) {
      job.status = status;
      if (status === "completed" || status === "failed") {
        job.completedAt = new Date();
      }
      this.enrichmentJobs.set(id, job);
    }
  }

  async updateEnrichmentJobProgress(id: string, progress: {
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    tokensUsed: number;
    totalCost: string;
    results?: Record<string, any>[];
  }): Promise<void> {
    const job = this.enrichmentJobs.get(id);
    if (job) {
      job.processedRows = progress.processedRows;
      job.successfulRows = progress.successfulRows;
      job.failedRows = progress.failedRows;
      job.tokensUsed = progress.tokensUsed;
      job.totalCost = progress.totalCost;
      if (progress.results) {
        job.results = progress.results;
      }
      this.enrichmentJobs.set(id, job);
    }
  }
}

export const storage = new MemStorage();
