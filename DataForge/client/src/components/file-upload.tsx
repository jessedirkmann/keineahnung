import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSVData {
  data: Record<string, any>[];
  columns: string[];
  totalRows: number;
  fullData: Record<string, any>[];
}

interface FileUploadProps {
  onFileUploaded: (data: CSVData) => void;
  csvData: CSVData | null;
  currentStep: number;
}

export function FileUpload({ onFileUploaded, csvData, currentStep }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to parse CSV');
      }

      const data = await response.json();
      onFileUploaded(data);
      
      toast({
        title: "File uploaded successfully",
        description: `Parsed ${data.totalRows} rows with ${data.columns.length} columns.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload CSV File</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            Step 1
          </span>
        </div>

        {!csvData ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleClick}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                ) : (
                  <FileText className="w-8 h-8 text-primary-500" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isUploading ? "Processing..." : "Drop your CSV file here"}
                </p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              {!isUploading && (
                <div className="flex justify-center">
                  <Button className="bg-primary-500 hover:bg-primary-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-400">Supports CSV files up to 50MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-success-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">File uploaded successfully</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">File Preview</h4>
                <div className="text-sm text-gray-500">
                  {csvData.totalRows.toLocaleString()} rows • {csvData.columns.length} columns
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {csvData.columns.slice(0, 5).map((column) => (
                        <th key={column} className="text-left py-2 px-3 font-medium text-gray-700">
                          {column}
                        </th>
                      ))}
                      {csvData.columns.length > 5 && (
                        <th className="text-left py-2 px-3 font-medium text-gray-700">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.data.slice(0, 3).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        {csvData.columns.slice(0, 5).map((column) => (
                          <td key={column} className="py-2 px-3 text-gray-600">
                            {String(row[column] || '').substring(0, 30)}
                            {String(row[column] || '').length > 30 && '...'}
                          </td>
                        ))}
                        {csvData.columns.length > 5 && (
                          <td className="py-2 px-3 text-gray-600">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
