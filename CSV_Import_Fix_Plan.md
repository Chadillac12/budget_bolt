# CSV Import Functionality Fix Plan

## Problem Description

The CSV import functionality in Budget Bolt is not working as expected. When the user clicks import and selects a file, the process closes after file selection without proceeding to the column mapping step.

## Root Cause Analysis

After analyzing the code, several potential issues have been identified:

1. **Error Handling Issues**: In the ImportWizard.tsx file, errors during file reading or parsing might be caught but not properly handled, causing the wizard to silently fail.

2. **File Reading Problems**: The `readFileAsString` function in csvUtils.ts might be failing, especially on specific platforms or with certain file formats.

3. **CSV Parsing Issues**: The `parseCSV` function might encounter errors with the specific CSV format being imported.

4. **State Management Problems**: After file selection, the state might not be properly updated to advance to the column mapping step.

5. **Platform-Specific Issues**: There might be platform-specific issues (web vs. native) affecting the file reading process.

## Implementation Plan

### 1. Enhance Error Handling in csvUtils.ts

Improve the error handling in the `readFileAsString` function:

```typescript
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
        return text;
      } catch (error) {
        console.error('[DEBUG] Error reading file on web:', error);
        throw new Error(`Failed to read file on web: ${error.message}`);
      }
    } else {
      // For native platforms, use Expo's FileSystem
      try {
        // Check if the file exists
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          // If using Expo Go, may need to copy file to app's document directory first
          const destUri = `${FileSystem.documentDirectory}temp_import_file`;
          await FileSystem.copyAsync({ from: uri, to: destUri });
          uri = destUri;
          
          // Verify the file was copied successfully
          const copiedFileInfo = await FileSystem.getInfoAsync(uri);
          if (!copiedFileInfo.exists) {
            throw new Error('Failed to copy file to local directory');
          }
        }
        
        const content = await FileSystem.readAsStringAsync(uri);
        if (!content || content.length === 0) {
          throw new Error('File is empty');
        }
        console.log('[DEBUG] Native file reading successful, content length:', content.length);
        return content;
      } catch (error) {
        console.error('[DEBUG] Error reading file on native:', error);
        throw new Error(`Failed to read file on native: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('[DEBUG] Fatal error in readFileAsString:', error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};
```

### 2. Improve CSV Parsing in csvUtils.ts

Enhance the `parseCSV` function to be more robust:

```typescript
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
    console.log('[DEBUG] Header line:', headerLine);
    
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
    
    console.log('[DEBUG] Parsed headers:', headers);
    
    // Parse data rows
    const rows: Record<string, string>[] = [];
    
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
      
      // Skip rows with different column count (possibly parsing errors)
      if (values.length !== headers.length) {
        console.log(`[DEBUG] Skipping row ${i+1} - column count mismatch: ${values.length} vs ${headers.length}`);
        continue;
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
    
    if (rows.length === 0) {
      console.warn('[DEBUG] No data rows were parsed from CSV');
    }
    
    console.log(`[DEBUG] Parsed ${rows.length} data rows`);
    return { headers, rows };
  } catch (error) {
    console.error('[DEBUG] Error parsing CSV:', error);
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
};
```

### 3. Enhance the ImportWizard.tsx Component

Improve error handling and state management in the ImportWizard component:

```typescript
// Inside handleFileSelect function
const handleFileSelect = async (result: DocumentPicker.DocumentResult) => {
  if (result.type !== 'success') {
    console.log('[DEBUG] File selection cancelled or failed');
    return;
  }
  
  try {
    setLoading(true);
    console.log('[DEBUG] Import: File selected successfully', { fileName: result.name, fileSize: result.size });
    
    // Read file content to detect format
    const fileUri = result.uri;
    setCurrentFileUri(fileUri); // Store the file URI for later use
    console.log('[DEBUG] Import: About to read file content from URI', { fileUri });
    
    try {
      console.log('[DEBUG] Import: Platform is', Platform.OS);
      // Use the cross-platform file reading utility
      const fileContent = await readFileAsString(fileUri);
      console.log('[DEBUG] Import: File content read successfully', { contentLength: fileContent.length });
      
      let importData: ImportData;
      
      // Detect if it's an OFX/QFX file
      if (isOFXFile(fileContent)) {
        console.log('[DEBUG] Import: OFX file detected');
        importData = await importFromOFX(fileUri);
        setFileFormat('ofx');
      } else {
        console.log('[DEBUG] Import: CSV file detected');
        // Assume CSV if not OFX/QFX
        importData = await importFromCSV(fileUri, undefined, true); // true for preview only
        setFileFormat('csv');
      }
      
      console.log('[DEBUG] Import: Setting fileData state with', { 
        headers: importData.headers, 
        previewRowCount: importData.preview.length 
      });
      
      setFileData(importData);
      
      // Explicitly set step to 3 (column mapping for CSV, confirmation for OFX/QFX)
      console.log('[DEBUG] Import: Setting step to 3');
      setStep(3);
    } catch (readError) {
      console.error('[DEBUG] Import: Error reading file content', readError);
      Alert.alert(
        'Import Error', 
        `Failed to read file: ${readError.message}. Please check the file format and try again.`,
        [{ text: 'OK' }]
      );
      throw readError;
    }
  } catch (error) {
    console.error('[DEBUG] Import: Import error:', error);
    Alert.alert(
      'Import Error', 
      `Failed to import file: ${error.message}. Please check the file format.`,
      [{ text: 'OK' }]
    );
  } finally {
    setLoading(false);
  }
};
```

### 4. Fix the importFromCSV Function in csvUtils.ts

Enhance the main import function:

```typescript
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
    let mapping = columnMapping;
    if (!mapping) {
      mapping = detectTransactionFormat(headers) || {};
      console.log('[DEBUG] Auto-detected column mapping:', mapping);
    }
    
    // For preview, return only a subset of rows
    let previewRows = previewOnly ? rows.slice(0, 10) : rows;
    
    return {
      headers,
      preview: previewRows,
      mapping,
      format: 'csv'
    };
  } catch (error) {
    console.error('[DEBUG] Import CSV error:', error);
    throw new Error(`Import CSV error: ${error.message}`);
  }
};
```

### 5. Testing Strategy

After implementing these changes, test the CSV import functionality with:

1. The provided transactions(2).csv file
2. Different CSV formats with various delimiters
3. Different platforms (web and native)

## Next Steps

After implementing these changes, if the issue persists, we should:

1. Add more detailed logging to identify the exact point of failure
2. Check for any platform-specific issues
3. Consider adding a fallback mechanism for file reading
4. Implement a more robust error handling system with user-friendly error messages

## Switching to Code Mode

To implement these changes, we need to switch to Code mode since Architect mode can only edit Markdown files.