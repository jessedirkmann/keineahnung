export interface CSVParseResult {
  data: Record<string, any>[];
  columns: string[];
  totalRows: number;
  errors: string[];
}

export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    return {
      data: [],
      columns: [],
      totalRows: 0,
      errors: ['Empty CSV file']
    };
  }

  // Parse header
  const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
  const columns = header;
  
  // Parse data rows
  const data: Record<string, any>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(val => val.trim().replace(/"/g, ''));
    
    if (values.length !== columns.length) {
      errors.push(`Row ${i + 1}: Expected ${columns.length} columns, got ${values.length}`);
      continue;
    }

    const row: Record<string, any> = {};
    columns.forEach((column, index) => {
      row[column] = values[index] || '';
    });
    
    data.push(row);
  }

  return {
    data,
    columns,
    totalRows: data.length,
    errors
  };
}

export function validateCSVStructure(data: Record<string, any>[]): string[] {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('No data rows found');
    return errors;
  }

  // Check for consistent column structure
  const firstRowKeys = Object.keys(data[0]);
  
  for (let i = 1; i < data.length; i++) {
    const rowKeys = Object.keys(data[i]);
    
    if (rowKeys.length !== firstRowKeys.length) {
      errors.push(`Row ${i + 1}: Inconsistent number of columns`);
    }
    
    const missingKeys = firstRowKeys.filter(key => !rowKeys.includes(key));
    if (missingKeys.length > 0) {
      errors.push(`Row ${i + 1}: Missing columns: ${missingKeys.join(', ')}`);
    }
  }

  return errors;
}
