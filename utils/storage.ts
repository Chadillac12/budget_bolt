import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const KEYS = {
  ACCOUNTS: 'budget_tracker_accounts',
  TRANSACTIONS: 'budget_tracker_transactions',
  CATEGORIES: 'budget_tracker_categories',
  BUDGETS: 'budget_tracker_budgets',
  SETTINGS: 'budget_tracker_settings',
};

// Helper function to revive dates when parsing JSON
const reviveDates = (key: string, value: any): any => {
  // Check for date strings (ISO format: YYYY-MM-DDTHH:mm:ss.sssZ)
  if (typeof value === 'string' && 
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)) {
    return new Date(value);
  }
  
  // For transaction objects, ensure the date property is a Date object
  if (key === 'date' && typeof value === 'string') {
    return new Date(value);
  }
  
  // Return the unmodified value for everything else
  return value;
};

// Basic storage operations
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    console.log(`Storing data for key: ${key}`, value);
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Successfully stored data for key: ${key}`);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    console.log(`Retrieving data for key: ${key}`);
    const jsonValue = await AsyncStorage.getItem(key);
    
    // If no data found, return null
    if (jsonValue === null) {
      return null;
    }
    
    // Parse the JSON with the date reviver function
    const parsedValue = JSON.parse(jsonValue, reviveDates) as T;
    console.log(`Retrieved data for key: ${key}`, parsedValue);
    return parsedValue;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

// CSV import/export functions
export const exportToCSV = async (
  data: any[],
  filename: string
): Promise<string | null> => {
  try {
    if (data.length === 0) return null;

    // Convert data to CSV format
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item)
        .map(value => typeof value === 'string' ? `"${value}"` : value)
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    // Platform-specific file handling
    if (Platform.OS === 'web') {
      // Web platform: trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return url;
    } else {
      // Mobile/desktop platforms: save to file system
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return fileUri;
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return null;
  }
};

export const importFromCSV = async (
  fileUri: string,
  columnMapping: Record<string, string>
): Promise<any[] | null> => {
  try {
    let csvContent: string;
    
    if (Platform.OS === 'web') {
      // For web, fileUri would be the uploaded file content
      csvContent = fileUri;
    } else {
      // For mobile/desktop platforms
      csvContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Parse CSV content
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    // Process data rows
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const obj: Record<string, any> = {};
      
      // Apply column mapping
      for (const targetField in columnMapping) {
        const sourceIndex = headers.indexOf(columnMapping[targetField]);
        if (sourceIndex !== -1) {
          obj[targetField] = values[sourceIndex];
        }
      }
      
      // Add unique ID
      obj.id = uuidv4();
      result.push(obj);
    }
    
    return result;
  } catch (error) {
    console.error('Error importing CSV:', error);
    return null;
  }
};

export const generateUUID = (): string => {
  return uuidv4();
};