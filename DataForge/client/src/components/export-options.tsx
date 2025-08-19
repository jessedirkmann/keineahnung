import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportOptionsProps {
  jobId: string;
}

export function ExportOptions({ jobId }: ExportOptionsProps) {
  const { toast } = useToast();

  const exportResults = async (format: string) => {
    try {
      const response = await fetch(`/api/enrichment-jobs/${jobId}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enriched_data.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export results. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Results</h3>

        <div className="space-y-4">
          <div className="text-center py-4 text-gray-600">
            <Download className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Ready to export enriched data</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => exportResults('csv')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </Button>
            <Button
              onClick={() => exportResults('xlsx')}
              variant="outline"
              className="flex items-center justify-center space-x-2"
              disabled
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Excel export coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
