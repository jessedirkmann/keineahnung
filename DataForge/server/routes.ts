import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { OpenAIService } from "./services/openai";
import { insertEnrichmentJobSchema, enrichmentConfigSchema } from "@shared/schema";
import multer from "multer";
import Papa from "papaparse";
import { z } from "zod";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate API key
  app.post("/api/validate-api-key", async (req, res) => {
    try {
      const { apiKey } = enrichmentConfigSchema.parse(req.body);
      const openaiService = new OpenAIService(apiKey);
      const isValid = await openaiService.validateApiKey();
      res.json({ valid: isValid });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Parse CSV file
  app.post("/api/parse-csv", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ 
          message: "CSV parsing error", 
          errors: parseResult.errors 
        });
      }

      const data = parseResult.data as Record<string, any>[];
      const columns = Object.keys(data[0] || {});
      
      res.json({
        data: data.slice(0, 10), // Return first 10 rows for preview
        columns,
        totalRows: data.length,
        fullData: data // Include full data for processing
      });
    } catch (error) {
      res.status(500).json({ message: "Error parsing CSV file" });
    }
  });

  // Web search via OpenAI tool
  app.post("/api/web-search", async (req, res) => {
    try {
      const { apiKey, query } = req.body;
      const openaiService = new OpenAIService(apiKey);
      const result = await openaiService.webSearch(query);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ message: "Error performing web search" });
    }
  });

  // Estimate cost
  app.post("/api/estimate-cost", async (req, res) => {
    try {
      const { apiKey, model, prompt, selectedColumns, sampleData, totalRows } = req.body;
      
      const openaiService = new OpenAIService(apiKey);
      const tokensPerRequest = openaiService.estimateTokens(prompt, selectedColumns, sampleData);
      const totalTokens = tokensPerRequest * totalRows;
      const estimatedCost = openaiService.calculateCost(totalTokens, model);

      res.json({
        tokensPerRequest,
        totalTokens,
        estimatedCost: estimatedCost.toFixed(4),
        formattedCost: `$${estimatedCost.toFixed(2)}`
      });
    } catch (error) {
      res.status(500).json({ message: "Error estimating cost" });
    }
  });

  // Create enrichment job
  app.post("/api/enrichment-jobs", async (req, res) => {
    try {
      const jobData = insertEnrichmentJobSchema.parse(req.body);
      const job = await storage.createEnrichmentJob(jobData);
      
      // Start processing in background
      processEnrichmentJob(job.id, jobData.apiKey, jobData.model, jobData.concurrency);
      
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid job data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating enrichment job" });
      }
    }
  });

  // Get enrichment job status
  app.get("/api/enrichment-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getEnrichmentJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Error fetching job status" });
    }
  });

  // Get recent jobs
  app.get("/api/enrichment-jobs", async (req, res) => {
    try {
      const jobs = await storage.getRecentEnrichmentJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent jobs" });
    }
  });

  // Export job results
  app.get("/api/enrichment-jobs/:id/export", async (req, res) => {
    try {
      const job = await storage.getEnrichmentJob(req.params.id);
      if (!job || !job.results) {
        return res.status(404).json({ message: "Job or results not found" });
      }

      const format = req.query.format as string || 'csv';
      
      if (format === 'csv') {
        const csv = Papa.unparse(job.results);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${job.filename}_enriched.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error exporting results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background job processing
async function processEnrichmentJob(
  jobId: string, 
  apiKey: string, 
  model: string, 
  concurrency: number
) {
  try {
    const job = await storage.getEnrichmentJob(jobId);
    if (!job) return;

    await storage.updateEnrichmentJobStatus(jobId, "processing");
    
    const openaiService = new OpenAIService(apiKey);
    const results = [...job.csvData];
    let processedRows = 0;
    let successfulRows = 0;
    let failedRows = 0;
    let totalTokensUsed = 0;

    // Process in batches with concurrency limit
    const batchSize = concurrency;
    for (let i = 0; i < job.csvData.length; i += batchSize) {
      const batch = job.csvData.slice(i, i + batchSize);
      const promises = batch.map(async (row, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const { results: enrichedData, tokensUsed } = await openaiService.enrichRow(
            row,
            job.prompt,
            job.selectedColumns,
            job.targetColumns,
            model
          );
          
          // Fill all target columns with enriched data
          console.log(`Enriched data for row ${globalIndex + 1}:`, enrichedData);
          Object.entries(enrichedData).forEach(([column, value]) => {
            console.log(`Setting ${column} = ${value} for row ${globalIndex}`);
            results[globalIndex][column] = value;
          });
          
          console.log(`Row ${globalIndex + 1} after enrichment:`, results[globalIndex]);
          
          totalTokensUsed += tokensUsed;
          successfulRows++;
          console.log(`Successfully processed row ${globalIndex + 1}/${job.csvData.length}`);
        } catch (error) {
          // Mark all target columns as failed
          job.targetColumns.forEach(column => {
            results[globalIndex][column] = `Error: ${error instanceof Error ? error.message : String(error)}`;
          });
          failedRows++;
          console.log(`Failed to process row ${globalIndex + 1}/${job.csvData.length}: ${error}`);
        }
        processedRows++;
      });

      await Promise.all(promises);

      // Update progress
      const totalCost = openaiService.calculateCost(totalTokensUsed, model);
      await storage.updateEnrichmentJobProgress(jobId, {
        processedRows,
        successfulRows,
        failedRows,
        tokensUsed: totalTokensUsed,
        totalCost: totalCost.toFixed(4),
        results: processedRows === job.totalRows ? results : undefined
      });
    }

    await storage.updateEnrichmentJobStatus(jobId, "completed");
  } catch (error) {
    await storage.updateEnrichmentJobStatus(jobId, "failed");
  }
}
