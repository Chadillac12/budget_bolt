import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';

/**
 * Cross-platform utility to read file content as string
 * Handles the platform-specific differences between web and native
 */
export const readFileAsString = async (fileUri: string): Promise<string> => {
  console.log('[DEBUG] readFileAsString: Reading file', { fileUri, platform: Platform.OS });
  
  if (Platform.OS === 'web') {
    try {
      console.log('[DEBUG] readFileAsString: Using web File API approach');
      // On web, we need to use the Fetch API and FileReader
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          console.log('[DEBUG] readFileAsString: Web file read successful', { contentLength: content.length });
          resolve(content);
        };
        reader.onerror = () => {
          console.error('[DEBUG] readFileAsString: Web file read error', reader.error);
          reject(new Error('Failed to read file content'));
        };
        reader.readAsText(blob);
      });
    } catch (error) {
      console.error('[DEBUG] readFileAsString: Web file read error', error);
      throw error;
    }
  } else {
    // On native platforms, use expo-file-system
    console.log('[DEBUG] readFileAsString: Using expo-file-system approach');
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      console.log('[DEBUG] readFileAsString: Native file read successful', { contentLength: content.length });
      return content;
    } catch (error) {
      console.error('[DEBUG] readFileAsString: Native file read error', error);
      throw error;
    }
  }
};

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
  columnMapping?: Record<string, string>,
  previewOnly: boolean = true
): Promise<CSVImportResult> => {
  try {
    console.log('[DEBUG] CSV Import: Starting CSV import', { fileUri, previewOnly });
    console.log('[DEBUG] CSV Import: Platform is', Platform.OS);
    
    // Read CSV file using the cross-platform utility
    let csvContent: string;
    let lines: string[];
    let headers: string[];
    
    try {
      console.log('[DEBUG] CSV Import: About to read file content');
      csvContent = await readFileAsString(fileUri);
      console.log('[DEBUG] CSV Import: File content read successfully', { contentLength: csvContent.length });
      
      lines = csvContent.split('\n').filter(line => line.trim());
      console.log('[DEBUG] CSV Import: Parsed lines', { lineCount: lines.length });
      
      headers = lines[0].split(',').map((h: string) => h.trim());
      console.log('[DEBUG] CSV Import: Extracted headers', { headers });
    } catch (readError) {
      console.error('[DEBUG] CSV Import: Error reading file content', readError);
      Alert.alert('Import Error', 'Failed to read file. Please check the file format and try again.');
      throw readError;
    }
    
    // Process data rows
    const preview = [];
    // If previewOnly is true, only process the first 5 rows for preview
    // Otherwise, process all rows for actual import
    const rowsToProcess = previewOnly ? Math.min(lines.length, 6) : lines.length;
    
    for (let i = 1; i < rowsToProcess; i++) {
      // Handle potential quoted CSV values correctly
      let values = [];
      let currentValue = '';
      let inQuotes = false;
      const line = lines[i];
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue);
      
      // If simple split produces different number of values than headers, try fallback
      if (values.length !== headers.length) {
        values = lines[i].split(',').map(v => v.trim());
      }
      
      const row: Record<string, any> = { id: uuidv4() };
      
      headers.forEach((header, index) => {
        const key = columnMapping?.[header] || header;
        let value = values[index]?.trim() || '';
        
        // Remove quotes if they wrap the entire value
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        row[key] = value;
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
  
  // Save file - this still needs platform-specific handling
  if (Platform.OS === 'web') {
    // On web, we can't write to the file system directly
    // Instead, create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    return filename; // Return filename as URI not applicable on web
  } else {
    // On native platforms, use expo-file-system
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    return fileUri;
  }
};

// Validation functions
export const validateTransaction = (tx: Partial<Transaction>): string[] => {
  const errors: string[] = [];
  if (!tx.date) errors.push('Missing date');
  if (!tx.amount) errors.push('Missing amount');
  if (!tx.payee) errors.push('Missing payee');
  return errors;
};