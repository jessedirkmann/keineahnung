import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Download, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EnrichmentJob } from "@shared/schema";

export function RecentActivity() {
  const [jobs, setJobs] = useState<EnrichmentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const response = await fetch('/api/enrichment-jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case "processing":
        return <Clock className="w-4 h-4 text-warning-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-error-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-100";
      case "processing":
        return "bg-warning-100";
      case "failed":
        return "bg-error-100";
      default:
        return "bg-gray-100";
    }
  };

  const downloadResults = async (jobId: string, filename: string) => {
    try {
      const response = await fetch(`/api/enrichment-jobs/${jobId}/export?format=csv`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_enriched.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your enriched data is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((dateObj.getTime() - Date.now()) / (1000 * 60 * 60)),
      'hour'
    );
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className={`flex items-center space-x-3 p-3 ${getStatusColor(job.status)} rounded-lg`}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{job.filename}</p>
                    <p className="text-xs text-gray-500">
                      {job.status === "completed" && `Completed ${formatDate(job.completedAt)} • ${job.totalRows} rows • $${job.totalCost}`}
                      {job.status === "processing" && `Processing • ${Math.round(((job.processedRows || 0) / job.totalRows) * 100)}% complete • ${job.processedRows || 0}/${job.totalRows} rows`}
                      {job.status === "failed" && `Failed ${formatDate(job.completedAt)} • ${job.processedRows}/${job.totalRows} rows processed`}
                      {job.status === "pending" && `Starting • ${job.totalRows} rows`}
                    </p>
                  </div>
                  {job.status === "completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadResults(job.id, job.filename)}
                      className="text-primary-500 hover:text-primary-600"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {job.status === "processing" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error-500 hover:text-error-600"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
