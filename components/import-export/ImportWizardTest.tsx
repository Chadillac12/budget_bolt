import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { readFileAsString, parseCSV, detectDelimiter, detectTransactionFormat } from '../../utils/csvUtils';
import { importFromCSV } from '../../utils/csvUtils';

/**
 * A test component to isolate and debug CSV import functionality
 * This helps us validate the import steps outside the main wizard
 */
export default function ImportWizardTest() {
  const [log, setLog] = useState<string[]>([]);
  const [csvContent, setCsvContent] = useState<string | null>(null);

  // Helper to add log messages
  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  // Handle file picker
  const handlePickFile = async () => {
    try {
      addLog('Starting file picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        addLog('File selection cancelled');
        return;
      }
      
      const file = result.assets[0];
      addLog(`File selected: ${file.name} (${file.size} bytes)`);
      
      // Test file reading
      await testFileReading(file.uri);
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Test reading file content
  const testFileReading = async (uri: string) => {
    try {
      addLog('Starting file reading test...');
      
      // Step 1: Read file content
      addLog('Reading file...');
      const content = await readFileAsString(uri);
      addLog(`File read successfully. Content length: ${content.length} chars`);
      setCsvContent(content);
      
      // Step 2: Detect delimiter
      addLog('Detecting delimiter...');
      const delimiter = detectDelimiter(content);
      addLog(`Detected delimiter: "${delimiter}"`);
      
      // Step 3: Parse CSV
      addLog('Parsing CSV...');
      const { headers, rows } = parseCSV(content, delimiter);
      addLog(`Parsed ${headers.length} headers and ${rows.length} data rows`);
      addLog(`Headers: ${JSON.stringify(headers)}`);
      
      // Step 4: Auto-detect column mapping
      addLog('Auto-detecting column mappings...');
      const mapping = detectTransactionFormat(headers) || {};
      addLog(`Detected ${Object.keys(mapping).length} column mappings:`);
      Object.entries(mapping).forEach(([field, header]) => {
        addLog(`  ${field} -> "${header}"`);
      });
      
      // Step 5: Full import test
      addLog('Testing full import...');
      const importData = await importFromCSV(uri, undefined, true);
      addLog(`Import successful! Preview contains ${importData.preview.length} rows`);
      
      addLog('All tests completed successfully! ✅');
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Clear logs
  const clearLogs = () => {
    setLog([]);
    setCsvContent(null);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Import Wizard Test</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Pick CSV File" onPress={handlePickFile} />
        <Button title="Clear Logs" onPress={clearLogs} color="#666" />
      </View>
      
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Log:</Text>
        {log.map((entry, index) => (
          <Text key={index} style={styles.logEntry}>{entry}</Text>
        ))}
      </View>
      
      {csvContent && csvContent.length > 0 && (
        <View style={styles.contentPreviewContainer}>
          <Text style={styles.logTitle}>Content Preview:</Text>
          <ScrollView style={styles.csvPreview} horizontal={false}>
            <Text style={styles.csvContent}>
              {csvContent.substring(0, 500)}
              {csvContent.length > 500 ? '\n[...truncated...]' : ''}
            </Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  logContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logEntry: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
  contentPreviewContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
  },
  csvPreview: {
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  csvContent: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  }
});