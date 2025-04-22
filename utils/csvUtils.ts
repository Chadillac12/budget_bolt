import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';

interface CSVImportResult {
  preview: any[];
  headers: string[];
  format: 'csv';
}

interface CSVExportOptions {
  includeHeaders?: boolean;
  dateFormat?: string;
}

export const importFromCSV = async (
  fileUri: string,
  columnMapping?: Record<string, string>
): Promise<CSVImportResult> => {
  try {
    // Read CSV file
    const csvContent = await FileSystem.readAsStringAsync(fileUri);
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Process data rows
    const preview = [];
    for (let i = 1; i < Math.min(lines.length, 5); i++) { // Preview first 5 rows
      const values = lines[i].split(',');
      const row: Record<string, any> = { id: uuidv4() };
      
      headers.forEach((header, index) => {
        const key = columnMapping?.[header] || header;
        row[key] = values[index]?.trim();
      });
      
      preview.push(row);
    }
    
    return { preview, headers, format: 'csv' };
  } catch (error) {
    console.error('CSV import error:', error);
    throw error;
  }
};

export const exportToCSV = async (
  data: Transaction[],
  filename: string,
  options?: CSVExportOptions
): Promise<string> => {
  const includeHeaders = options?.includeHeaders ?? true;
  const headers = ['date', 'amount', 'payee', 'category', 'description'];
  
  // Convert data to CSV
  let csvContent = '';
  if (includeHeaders) {
    csvContent += headers.join(',') + '\n';
  }
  
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header as keyof Transaction];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvContent += row.join(',') + '\n';
  });
  
  // Save file
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent);
  return fileUri;
};

// Validation functions
export const validateTransaction = (tx: Partial<Transaction>): string[] => {
  const errors: string[] = [];
  if (!tx.date) errors.push('Missing date');
  if (!tx.amount) errors.push('Missing amount');
  if (!tx.payee) errors.push('Missing payee');
  return errors;
};