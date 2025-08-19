import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EnrichmentConfig {
  apiKey: string;
  model: string;
  concurrency: number;
}

interface CostEstimationProps {
  config: EnrichmentConfig;
  prompt: string;
  selectedColumns: string[];
  sampleData: Record<string, any>;
  totalRows: number;
}

interface CostEstimate {
  tokensPerRequest: number;
  totalTokens: number;
  estimatedCost: string;
  formattedCost: string;
}

export function CostEstimation({
  config,
  prompt,
  selectedColumns,
  sampleData,
  totalRows
}: CostEstimationProps) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!config.apiKey || !prompt || selectedColumns.length === 0 || !sampleData) {
        setEstimate(null);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/estimate-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.apiKey,
            model: config.model,
            prompt,
            selectedColumns,
            sampleData,
            totalRows,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setEstimate(data);
        }
      } catch (error) {
        console.error('Error fetching cost estimate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstimate();
  }, [config.apiKey, config.model, prompt, selectedColumns, sampleData, totalRows]);

  if (!config.apiKey || !prompt || selectedColumns.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Estimation</h3>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            </div>
          </div>
        ) : estimate ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rows to process:</span>
              <span className="font-medium">{totalRows.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Est. tokens per request:</span>
              <span className="font-medium">~{estimate.tokensPerRequest}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total tokens:</span>
              <span className="font-medium">~{estimate.totalTokens.toLocaleString()}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Estimated cost:</span>
              <span className="text-lg font-bold text-primary-600">{estimate.formattedCost}</span>
            </div>
            <div className="text-xs text-gray-500">
              Based on {config.model} pricing
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Configure your prompt to see cost estimation
          </div>
        )}
      </CardContent>
    </Card>
  );
}
