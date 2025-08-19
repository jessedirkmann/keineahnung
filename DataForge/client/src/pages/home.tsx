import { useState, useEffect } from "react";
import { FileUpload } from "@/components/file-upload";
import { ColumnSelection } from "@/components/column-selection";
import { PromptEditor } from "@/components/prompt-editor";
import { ApiConfiguration } from "@/components/api-configuration";
import { CostEstimation } from "@/components/cost-estimation";
import { ProcessingStatus } from "@/components/processing-status";
import { ExportOptions } from "@/components/export-options";
import { ProgressSteps } from "@/components/progress-steps";
import { RecentActivity } from "@/components/recent-activity";
import { Settings, Table } from "lucide-react";

interface CSVData {
  data: Record<string, any>[];
  columns: string[];
  totalRows: number;
  fullData: Record<string, any>[];
}

interface EnrichmentConfig {
  apiKey: string;
  model: string;
  concurrency: number;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("Basierend auf den Geschäftsinformationen für {Website}, extrahiere und ergänze die Kontaktdaten.");
  const [targetColumns, setTargetColumns] = useState<string[]>([]);
  const [config, setConfig] = useState<EnrichmentConfig>({
    apiKey: "",
    model: "gpt-4o-mini",
    concurrency: 5,
  });
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleFileUploaded = (data: CSVData) => {
    setCsvData(data);
    setCurrentStep(2);
  };

  const handleConfigurationComplete = () => {
    setCurrentStep(3);
  };

  // Auto-advance steps based on completion
  useEffect(() => {
    if (csvData && currentStep === 2 && selectedColumns.length > 0) {
      setCurrentStep(3);
    }
  }, [csvData, selectedColumns, currentStep]);

  useEffect(() => {
    if (csvData && selectedColumns.length > 0 && prompt && targetColumns.length > 0 && config.apiKey && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [csvData, selectedColumns, prompt, targetColumns, config.apiKey, currentStep]);

  const handleProcessingStart = (jobId: string) => {
    setCurrentJobId(jobId);
  };

  const handleProcessingComplete = () => {
    setCurrentStep(4);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-500 text-white p-2 rounded-lg">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">CSV AI Enrichment</h1>
                <p className="text-sm text-gray-500">Lead enrichment powered by OpenAI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">user@company.com</p>
                <p className="text-xs text-gray-500">Pro Plan</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressSteps currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <FileUpload
              onFileUploaded={handleFileUploaded}
              csvData={csvData}
              currentStep={currentStep}
            />

            {csvData && (
              <>
                <ColumnSelection
                  columns={csvData.columns}
                  selectedColumns={selectedColumns}
                  onSelectionChange={setSelectedColumns}
                  currentStep={currentStep}
                />

                <PromptEditor
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  targetColumns={targetColumns}
                  onTargetColumnsChange={setTargetColumns}
                  selectedColumns={selectedColumns}
                  sampleData={csvData.data[0]}
                  availableColumns={csvData.columns}
                  currentStep={currentStep}
                />
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ApiConfiguration
              config={config}
              onConfigChange={setConfig}
            />

            {csvData && selectedColumns.length > 0 && prompt && (
              <CostEstimation
                config={config}
                prompt={prompt}
                selectedColumns={selectedColumns}
                sampleData={csvData.data[0]}
                totalRows={csvData.totalRows}
              />
            )}

            {currentJobId ? (
              <ProcessingStatus
                jobId={currentJobId}
                onComplete={handleProcessingComplete}
              />
            ) : (
              csvData && selectedColumns.length > 0 && prompt && targetColumns.length > 0 && config.apiKey && (
                <ProcessingStatus
                  csvData={csvData}
                  selectedColumns={selectedColumns}
                  prompt={prompt}
                  targetColumns={targetColumns}
                  config={config}
                  onStart={handleProcessingStart}
                />
              )
            )}

            {currentStep >= 4 && currentJobId && (
              <ExportOptions jobId={currentJobId} />
            )}
          </div>
        </div>

        <RecentActivity />
      </main>
    </div>
  );
}
