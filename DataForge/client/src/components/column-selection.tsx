import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface ColumnSelectionProps {
  columns: string[];
  selectedColumns: string[];
  onSelectionChange: (columns: string[]) => void;
  currentStep: number;
}

export function ColumnSelection({ 
  columns, 
  selectedColumns, 
  onSelectionChange, 
  currentStep 
}: ColumnSelectionProps) {
  const handleColumnToggle = (column: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedColumns, column]);
    } else {
      onSelectionChange(selectedColumns.filter(c => c !== column));
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Column Selection</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Step 2a
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Select the columns you want to use in your enrichment prompt:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {columns.map((column) => (
            <label
              key={column}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                checked={selectedColumns.includes(column)}
                onCheckedChange={(checked) => handleColumnToggle(column, checked as boolean)}
                className="mr-3"
              />
              <span className="text-sm font-medium text-gray-900">{column}</span>
            </label>
          ))}
        </div>

        {selectedColumns.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div>
                <h4 className="text-sm font-medium text-blue-900">Selected Columns</h4>
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
      </CardContent>
    </Card>
  );
}
