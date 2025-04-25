import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { readFileAsString, detectDelimiter, parseCSV, detectTransactionFormat } from '@/utils/csvUtils';

export default function CSVParserTest() {
  const [log, setLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const clearLog = () => {
    setLog([]);
  };

  const testFile = async () => {
    try {
      setIsLoading(true);
      addLog('Opening file picker...');
      
      // Select file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        addLog('File selection cancelled');
        setIsLoading(false);
        return;
      }
      
      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;
      const fileSize = result.assets[0].size;
      
      addLog(`File selected: ${fileName} (${fileSize} bytes)`);
      
      // Read file content
      addLog('Reading file content...');
      const content = await readFileAsString(fileUri);
      addLog(`File content loaded: ${content.length} characters`);
      
      // Test delimiter detection
      addLog('Testing delimiter detection...');
      const delimiter = detectDelimiter(content);
      addLog(`Detected delimiter: "${delimiter === ',' ? 'comma' : delimiter === ';' ? 'semicolon' : delimiter === '\t' ? 'tab' : delimiter}"`);
      
      // Parse CSV headers and data
      addLog('Parsing CSV...');
      const { headers, rows } = parseCSV(content, delimiter);
      addLog(`Parsed ${headers.length} headers and ${rows.length} data rows`);
      addLog(`Headers: ${JSON.stringify(headers)}`);
      
      // Test first few rows
      addLog('Sample data:');
      rows.slice(0, 3).forEach((row, i) => {
        addLog(`Row ${i + 1}: ${JSON.stringify(row)}`);
      });
      
      // Test column mapping
      addLog('Testing column mapping detection...');
      const mapping = detectTransactionFormat(headers);
      addLog(`Detected mapping: ${JSON.stringify(mapping)}`);
      
      addLog('CSV parsing test completed successfully!');
    } catch (error) {
      console.error('Error in CSV test:', error);
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInternalFile = async () => {
    try {
      setIsLoading(true);
      
      // Use direct path to the file in the project root
      const fileName = 'transactions(2).csv';
      addLog(`Testing file: ${fileName}`);
      
      // Read file content
      addLog('Reading file content...');
      const content = await readFileAsString(fileName);
      addLog(`File content loaded: ${content.length} characters`);
      
      // Test delimiter detection
      addLog('Testing delimiter detection...');
      const delimiter = detectDelimiter(content);
      addLog(`Detected delimiter: "${delimiter === ',' ? 'comma' : delimiter === ';' ? 'semicolon' : delimiter === '\t' ? 'tab' : delimiter}"`);
      
      // Parse CSV headers and data
      addLog('Parsing CSV...');
      const { headers, rows } = parseCSV(content, delimiter);
      addLog(`Parsed ${headers.length} headers and ${rows.length} data rows`);
      addLog(`Headers: ${JSON.stringify(headers)}`);
      
      // Test first few rows
      addLog('Sample data:');
      rows.slice(0, 3).forEach((row, i) => {
        addLog(`Row ${i + 1}: ${JSON.stringify(row)}`);
      });
      
      // Test column mapping
      addLog('Testing column mapping detection...');
      const mapping = detectTransactionFormat(headers);
      addLog(`Detected mapping: ${JSON.stringify(mapping)}`);
      
      addLog('CSV parsing test completed successfully!');
    } catch (error) {
      console.error('Error in CSV test:', error);
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CSV Parser Test</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Select CSV File" onPress={testFile} disabled={isLoading} />
        <Button title="Test Built-in File" onPress={testInternalFile} disabled={isLoading} />
        <Button title="Clear Log" onPress={clearLog} disabled={isLoading} />
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text>Processing...</Text>
        </View>
      )}
      
      <ScrollView style={styles.logContainer}>
        {log.map((entry, index) => (
          <Text key={index} style={styles.logEntry}>{entry}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logEntry: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
}); 