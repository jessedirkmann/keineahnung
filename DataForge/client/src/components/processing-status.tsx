import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Square, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EnrichmentJob } from "@shared/schema";

interface EnrichmentConfig {
  apiKey: string;
  model: string;
  concurrency: number;
}

interface CSVData {
  data: Record<string, any>[];
  columns: string[];
  totalRows: number;
  fullData: Record<string, any>[];
}

interface ProcessingStatusProps {
  jobId?: string;
  csvData?: CSVData;
  selectedColumns?: string[];
  prompt?: string;
  targetColumns?: string[];
  config?: EnrichmentConfig;
  onStart?: (jobId: string) => void;
  onComplete?: () => void;
}

export function ProcessingStatus({
  jobId,
  csvData,
  selectedColumns,
  prompt,
  targetColumns,
  config,
  onStart,
  onComplete
}: ProcessingStatusProps) {
  const [job, setJob] = useState<EnrichmentJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  // Poll for job status if jobId is provided
  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/enrichment-jobs/${jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setJob(jobData);

          if (jobData.status === "completed" || jobData.status === "failed") {
            clearInterval(pollInterval);
            if (jobData.status === "completed" && onComplete) {
              onComplete();
            }
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [jobId, onComplete]);

  const startProcessing = async () => {
    if (!csvData || !selectedColumns || !prompt || !targetColumns || !config) return;

    setIsStarting(true);

    try {
      const response = await fetch('/api/enrichment-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'uploaded.csv',
          totalRows: csvData.totalRows,
          prompt,
          targetColumns,
          selectedColumns,
          csvData: csvData.fullData,
          apiKey: config.apiKey,
          model: config.model,
          concurrency: config.concurrency,
        }),
      });

      if (response.ok) {
        const newJob = await response.json();
        setJob(newJob);
        if (onStart) {
          onStart(newJob.id);
        }
        toast({
          title: "Processing Started",
          description: "Your CSV enrichment job has been started.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      toast({
        title: "Failed to Start Processing",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!job || job.totalRows === 0) return 0;
    return ((job.processedRows || 0) / job.totalRows) * 100;
  };

  const getStatusIcon = () => {
    if (!job) return null;
    
    switch (job.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-error-500" />;
      case "processing":
        return <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!job) return "Ready to process";
    
    switch (job.status) {
      case "pending":
        return "Starting...";
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed successfully";
      case "failed":
        return "Processing failed";
      default:
        return job.status;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
          </div>

          {job && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progress:</span>
                <span className="font-medium text-primary-600">
                  {job.processedRows} / {job.totalRows}
                </span>
              </div>

              <Progress value={getProgressPercentage()} className="w-full" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Success:</div>
                  <div className="font-medium text-success-600">{job.successfulRows}</div>
                </div>
                <div>
                  <div className="text-gray-600">Failed:</div>
                  <div className="font-medium text-error-600">{job.failedRows}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tokens used:</span>
                  <span className="font-medium">{(job.tokensUsed || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost so far:</span>
                  <span className="font-medium text-primary-600">${job.totalCost}</span>
                </div>
              </div>
            </>
          )}

          {!jobId && (
            <Button
              onClick={startProcessing}
              disabled={isStarting || !csvData || !selectedColumns || !prompt || !targetColumns || !config?.apiKey}
              className="w-full"
            >
              {isStarting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isStarting ? "Starting..." : "Start Processing"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
