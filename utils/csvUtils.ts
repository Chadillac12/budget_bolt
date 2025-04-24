import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { ImportData, ImportFileFormat } from '@/types/import';

// Cross-platform file reading utility
export const readFileAsString = async (uri: string): Promise<string> => {
  console.log('[DEBUG] Reading file as string from URI:', uri);
  
  try {
    if (Platform.OS === 'web') {
      // For web, the uri is actually a File object from the file picker
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        console.log('[DEBUG] Web file reading successful, content length:', text.length);
        if (!text || text.trim().length === 0) {
          throw new Error('File is empty');
        }
        return text;
      } catch (error) {
        console.error('[DEBUG] Error reading file on web:', error);
        throw new Error(`Failed to read file on web: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // For native platforms, use Expo's FileSystem
      try {
        // Check if the file exists and handle different URI formats
        let fileUri = uri;
        
        // Verify file exists first
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
            // iOS might need file:// prefix
            fileUri = `file://${uri}`;
            const fixedPathInfo = await FileSystem.getInfoAsync(fileUri);
            
            if (!fixedPathInfo.exists) {
              // Try copying to app's document directory as fallback
              console.log('[DEBUG] File not found, copying to document directory');
              const destUri = `${FileSystem.documentDirectory}temp_import_file`;
              await FileSystem.copyAsync({ from: uri, to: destUri });
              fileUri = destUri;
              
              // Verify the file was copied successfully
              const copiedFileInfo = await FileSystem.getInfoAsync(fileUri);
              if (!copiedFileInfo.exists) {
                throw new Error('Failed to copy file to local directory');
              }
            }
          } else if (Platform.OS === 'android') {
            // Some Android file providers need special handling
            console.log('[DEBUG] File not found on Android, copying to document directory');
            const destUri = `${FileSystem.documentDirectory}temp_import_file`;
            await FileSystem.copyAsync({ from: uri, to: destUri });
            fileUri = destUri;
            
            // Verify the file was copied successfully
            const copiedFileInfo = await FileSystem.getInfoAsync(fileUri);
            if (!copiedFileInfo.exists) {
              throw new Error('Failed to copy file to local directory');
            }
          } else {
            throw new Error('File not found');
          }
        }
        
        console.log('[DEBUG] Reading file from URI:', fileUri);
        const content = await FileSystem.readAsStringAsync(fileUri);
        if (!content || content.trim().length === 0) {
          throw new Error('File is empty');
        }
        console.log('[DEBUG] Native file reading successful, content length:', content.length);
        return content;
      } catch (error) {
        console.error('[DEBUG] Error reading file on native:', error);
        throw new Error(`Failed to read file on native: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('[DEBUG] Fatal error in readFileAsString:', error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Add a helper function to detect CSV delimiter (comma, semicolon, tab, etc.)
export const detectDelimiter = (csvContent: string): string => {
  // Check a few lines to determine the most likely delimiter
  const firstFewLines = csvContent.split('\n').slice(0, 5).join('\n');
  
  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ','; // Default to comma
  let maxCount = 0;
  let maxConsistency = 0;
  
  // First check the file extension - if it ends with .csv, bias toward comma
  const isCSVFile = true; // Always assume CSV for our import wizard
  const commaBoost = isCSVFile ? 0.5 : 0; // Boost comma consistency for CSV files
  
  delimiters.forEach(delimiter => {
    // Count occurrences of this delimiter in the first few lines
    const count = (firstFewLines.match(new RegExp(delimiter, 'g')) || []).length;
    
    // Pre-process lines to normalize spacing around delimiters for more accurate detection
    // This helps with cases like "Date, Time, Amount" where spaces after commas affect detection
    const normalizedContent = delimiter === ',' 
      ? csvContent.replace(/,\s+/g, ',') // Remove spaces after commas for comma testing
      : csvContent;
    
    // Check consistency of field count across lines (more important than raw count)
    const lines = normalizedContent.split('\n').slice(0, Math.min(10, normalizedContent.split('\n').length));
    const fieldCounts = lines
      .filter(line => line.trim().length > 0)
      .map(line => (line.split(delimiter).length));
    
    // Count how many lines have the same field count (indicates consistency)
    const fieldCountMap: Record<number, number> = {};
    fieldCounts.forEach(count => {
      fieldCountMap[count] = (fieldCountMap[count] || 0) + 1;
    });
    
    // Get the most common field count
    let consistency = Math.max(...Object.values(fieldCountMap));
    
    // Add the comma boost if this is the comma delimiter and we're analyzing a CSV file
    if (delimiter === ',' && isCSVFile) {
      consistency += commaBoost;
    }
    
    // Skip delimiters that create only one field, unless we have no other choice
    // This prevents selecting a delimiter that doesn't actually split the data
    if (Object.keys(fieldCountMap).length === 1 && 
        Object.keys(fieldCountMap)[0] === '1' && 
        count > 0) {
      console.log(`[DEBUG] Skipping delimiter "${delimiter}" because it doesn't split the data`);
      return;
    }
    
    console.log(`[DEBUG] Delimiter "${delimiter}": count=${count}, consistency=${consistency}, fields=${Object.keys(fieldCountMap).join(',')}`);
    
    // Prefer consistency over raw count, but use count as tiebreaker
    if (consistency > maxConsistency || (consistency === maxConsistency && count > maxCount)) {
      maxConsistency = consistency;
      maxCount = count;
      bestDelimiter = delimiter;
    }
  });
  
  // For header-only detection - if header has "Date,Time,Amount" pattern with commas, use comma
  const firstLine = csvContent.split('\n')[0].trim();
  if (firstLine.match(/Date,\s*(Time|Transaction)/i)) {
    console.log('[DEBUG] Detected comma-separated date/time pattern in header, using comma delimiter');
    bestDelimiter = ',';
  }
  
  console.log('[DEBUG] Detected delimiter:', bestDelimiter, 'with consistency:', maxConsistency);
  return bestDelimiter;
};

// Helper to clean spaces from header names
const cleanHeaderName = (header: string): string => {
  return header.trim().replace(/^"(.*)"$/, '$1');
};

// Parse CSV content to JSON objects
export const parseCSV = (csvContent: string, delimiter: string = ','): { headers: string[], rows: Record<string, string>[] } => {
  console.log('[DEBUG] Parsing CSV with delimiter:', delimiter);
  
  try {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('CSV content is empty');
    }
    
    const lines = csvContent.split(/\r?\n/);
    if (!lines.length) {
      throw new Error('No lines found in CSV content');
    }
    
    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (!nonEmptyLines.length) {
      throw new Error('No non-empty lines found in CSV content');
    }
    
    // Parse headers (first line)
    let headerLine = nonEmptyLines[0];
    console.log('[DEBUG] Original header line:', headerLine);
    
    // Pre-process header line to handle common formatting issues
    // This helps with cases like "Date, Time, Amount" where spaces after commas affect parsing
    if (delimiter === ',') {
      headerLine = headerLine.replace(/,\s+/g, ',');
    }
    console.log('[DEBUG] Normalized header line:', headerLine);
    
    // Handle quoted values in headers
    const headers: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < headerLine.length; i++) {
      const char = headerLine[i];
      
      if (char === '"' && (i === 0 || headerLine[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        headers.push(cleanHeaderName(currentField));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field
    if (currentField) {
      headers.push(cleanHeaderName(currentField));
    }
    
    if (headers.length === 0) {
      throw new Error('Failed to parse headers from CSV');
    }
    
    // In case of a single header containing multiple fields, try to split it
    if (headers.length === 1 && headers[0].includes(',')) {
      console.log('[DEBUG] Attempting to split single header containing commas:', headers[0]);
      const splitHeaders = headers[0].split(',').map(h => h.trim());
      if (splitHeaders.length > 1) {
        console.log('[DEBUG] Split single header into multiple headers:', splitHeaders);
        headers.splice(0, 1, ...splitHeaders);
      }
    }
    
    console.log('[DEBUG] Final parsed headers:', headers);
    
    // Parse data rows with the same delimiter used for headers
    const rows: Record<string, string>[] = [];
    let rowsWithErrors = 0;
    
    for (let i = 1; i < nonEmptyLines.length; i++) {
      const line = nonEmptyLines[i];
      if (!line.trim()) continue;
      
      const values: string[] = [];
      let currentValue = '';
      inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      if (currentValue || values.length === headers.length - 1) {
        values.push(currentValue.trim());
      }
      
      // Handle rows with different column count
      if (values.length !== headers.length) {
        console.log(`[DEBUG] Row ${i+1} has column count mismatch: ${values.length} vs ${headers.length}`);
        rowsWithErrors++;
        
        // Try to fix rows with one missing value (often happens with trailing delimiter)
        if (values.length === headers.length - 1) {
          values.push('');
        } else if (values.length > headers.length) {
          // If there are too many columns, truncate to fit headers
          values.splice(headers.length);
        } else {
          // For significant mismatches, pad with empty values
          while (values.length < headers.length) {
            values.push('');
          }
        }
      }
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          // Clean quotes from values
          const value = values[index].replace(/^"(.*)"$/, '$1');
          row[header] = value;
        } else {
          row[header] = '';
        }
      });
      
      rows.push(row);
    }
    
    if (rowsWithErrors > 0) {
      console.warn(`[DEBUG] Found ${rowsWithErrors} rows with column count mismatches`);
    }
    
    if (rows.length === 0) {
      console.warn('[DEBUG] No data rows were parsed from CSV');
    }
    
    console.log(`[DEBUG] Parsed ${rows.length} data rows successfully`);
    return { headers, rows };
  } catch (error) {
    console.error('[DEBUG] Error parsing CSV:', error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Determine common transaction CSV formats
export const detectTransactionFormat = (headers: string[]): Record<string, string> | null => {
  console.log('[DEBUG] Detecting transaction format from headers:', headers);
  
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Check for common patterns
  const mapping: Record<string, string> = {};

  // Handle combined headers (e.g., "Date, Time")
  const combinedHeaderPattern = /^date.*time/i;
  const combinedHeader = headers.find(h => combinedHeaderPattern.test(h.toLowerCase()));
  if (combinedHeader) {
    console.log('[DEBUG] Found combined date/time header:', combinedHeader);
    mapping['date'] = combinedHeader;
  }
  // Regular date field detection
  else if (normalizedHeaders.includes('date')) {
    mapping['date'] = 'date';
  } else if (normalizedHeaders.includes('transaction date')) {
    mapping['date'] = 'transaction date';
  } else if (normalizedHeaders.some(h => h.includes('date'))) {
    const dateHeader = normalizedHeaders.find(h => h.includes('date'));
    if (dateHeader) mapping['date'] = headers[normalizedHeaders.indexOf(dateHeader)];
  }
  
  // Amount field detection
  if (normalizedHeaders.includes('amount')) {
    mapping['amount'] = 'amount';
  } else if (normalizedHeaders.includes('transaction amount')) {
    mapping['amount'] = 'transaction amount';
  } else if (normalizedHeaders.some(h => h.includes('amount'))) {
    const amountHeader = normalizedHeaders.find(h => h.includes('amount'));
    if (amountHeader) mapping['amount'] = headers[normalizedHeaders.indexOf(amountHeader)];
  }
  
  // Description/Payee field detection
  if (normalizedHeaders.includes('description')) {
    mapping['payee'] = 'description';
  } else if (normalizedHeaders.includes('merchant')) {
    mapping['payee'] = 'merchant';
  } else if (normalizedHeaders.includes('payee')) {
    mapping['payee'] = 'payee';
  } else if (normalizedHeaders.some(h => h.includes('description') || h.includes('memo'))) {
    const descHeader = normalizedHeaders.find(h => h.includes('description') || h.includes('memo'));
    if (descHeader) mapping['payee'] = headers[normalizedHeaders.indexOf(descHeader)];
  }
  
  // Transaction type detection
  if (normalizedHeaders.includes('type')) {
    mapping['type'] = 'type';
  } else if (normalizedHeaders.includes('transaction type')) {
    mapping['type'] = 'transaction type';
  } else if (normalizedHeaders.some(h => h.includes('type'))) {
    const typeHeader = normalizedHeaders.find(h => h.includes('type'));
    if (typeHeader) mapping['type'] = headers[normalizedHeaders.indexOf(typeHeader)];
  }
  
  // Category detection
  if (normalizedHeaders.includes('category')) {
    mapping['category'] = 'category';
  }

  // Special case for single-column CSVs where multiple fields are in one column
  if (headers.length === 1 && headers[0].toLowerCase().includes('date') && 
      headers[0].toLowerCase().includes('amount') && 
      headers[0].toLowerCase().includes('description')) {
    console.log('[DEBUG] Detected single-column CSV with multiple fields');
    mapping['date'] = headers[0];
    mapping['amount'] = headers[0];
    mapping['payee'] = headers[0];
    if (headers[0].toLowerCase().includes('type')) {
      mapping['type'] = headers[0];
    }
  }
  
  console.log('[DEBUG] Detected transaction format mapping:', mapping);
  return Object.keys(mapping).length > 0 ? mapping : null;
};

// Main import function
export const importFromCSV = async (
  fileUri: string,
  columnMapping?: Record<string, string>,
  previewOnly: boolean = false
): Promise<ImportData> => {
  try {
    console.log('[DEBUG] Starting CSV import process', { fileUri, previewOnly });
    
    // Read file content
    const fileContent = await readFileAsString(fileUri);
    if (!fileContent) {
      throw new Error('Failed to read file content');
    }
    
    // Detect delimiter
    const delimiter = detectDelimiter(fileContent);
    console.log('[DEBUG] Detected delimiter:', delimiter);
    
    // Parse CSV to get headers and data rows
    const { headers, rows } = parseCSV(fileContent, delimiter);
    if (!headers.length) {
      throw new Error('No headers found in CSV file');
    }
    if (!rows.length) {
      throw new Error('No data rows found in CSV file');
    }
    
    console.log(`[DEBUG] Parsed CSV with ${headers.length} headers and ${rows.length} rows`);
    
    // Auto-detect mapping if not provided
    let detectedMapping = columnMapping;
    if (!detectedMapping) {
      detectedMapping = detectTransactionFormat(headers) || {};
      console.log('[DEBUG] Auto-detected column mapping:', detectedMapping);
    }
    
    // For preview, return only a subset of rows
    let previewRows = previewOnly ? rows.slice(0, 10) : rows;
    
    return {
      headers,
      preview: previewRows,
      format: 'csv'
    };
  } catch (error) {
    console.error('[DEBUG] Import CSV error:', error);
    throw new Error(`Import CSV error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};