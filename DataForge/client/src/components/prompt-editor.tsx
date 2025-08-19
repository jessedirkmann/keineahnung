import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  targetColumns: string[];
  onTargetColumnsChange: (columns: string[]) => void;
  selectedColumns: string[];
  sampleData: Record<string, any>;
  availableColumns: string[];
  currentStep: number;
}

export function PromptEditor({
  prompt,
  onPromptChange,
  targetColumns,
  onTargetColumnsChange,
  selectedColumns,
  sampleData,
  availableColumns,
  currentStep
}: PromptEditorProps) {
  const generatePreview = () => {
    if (!sampleData || selectedColumns.length === 0) return prompt;
    
    let preview = prompt;
    selectedColumns.forEach(column => {
      const placeholder = `{${column}}`;
      const value = sampleData[column] || '';
      preview = preview.replaceAll(placeholder, `<span class="bg-yellow-100 px-1 rounded">${value}</span>`);
    });
    return preview;
  };

  const handleAddTargetColumn = (value: string) => {
    if (value === "new-column") {
      // Handle new column creation
      const newColumnName = window.prompt("Neue Spalte erstellen:");
      if (newColumnName && newColumnName.trim() && !targetColumns.includes(newColumnName.trim())) {
        onTargetColumnsChange([...targetColumns, newColumnName.trim()]);
      }
    } else if (!targetColumns.includes(value)) {
      onTargetColumnsChange([...targetColumns, value]);
    }
  };

  const handleRemoveTargetColumn = (columnToRemove: string) => {
    onTargetColumnsChange(targetColumns.filter(col => col !== columnToRemove));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enrichment Prompt</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Step 2b
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Ziel-Spalten (werden ausgefüllt)
            </Label>
            <Select onValueChange={handleAddTargetColumn}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Spalte zum Ausfüllen hinzufügen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-column">Neue Spalte erstellen...</SelectItem>
                {availableColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {targetColumns.length > 0 && (
              <div className="mt-3 space-y-2">
                {targetColumns.map((column) => (
                  <div key={column} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-green-800">{column}</span>
                    <button
                      onClick={() => handleRemoveTargetColumn(column)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Template
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="h-32 font-mono text-sm"
              placeholder="Beispiel: Basierend auf den Geschäftsinformationen für {Website}, extrahiere und ergänze die Kontaktdaten."
            />
            <p className="text-xs text-gray-500 mt-1">
              Verwenden Sie geschweifte Klammern für Platzhalter, z.B. {'{Firmenname}'} oder {'{Webseite}'}
            </p>
          </div>

          {selectedColumns.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Verfügbare Platzhalter</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedColumns.map((column) => (
                      <span
                        key={column}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-blue-100 text-blue-800"
                      >
                        {`{${column}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {prompt && sampleData && selectedColumns.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Vorschau mit Beispieldaten</h4>
              <div
                className="bg-white border border-gray-200 rounded p-3 text-sm font-mono text-gray-700"
                dangerouslySetInnerHTML={{ __html: generatePreview() }}
              />
              {targetColumns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Auszufüllende Spalten:</p>
                  <div className="flex flex-wrap gap-1">
                    {targetColumns.map((column) => (
                      <span key={column} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
