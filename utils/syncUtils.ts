/**
 * Utility functions for data synchronization between devices
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
// Using Platform.OS instead of expo-device since it's not in dependencies
import { v4 as uuidv4 } from 'uuid';

import {
  SyncableData,
  SyncStatus,
  SyncConflict,
  ConflictResolutionStrategy,
  SyncConfig,
  StorageProvider,
  SyncState,
  SyncBatch,
  SyncResult,
  SyncableDataType,
  SyncableDataMap,
  StorageProviderAuth
} from '../types/sync';

// Constants
const SYNC_CONFIG_KEY = 'budget_bolt_sync_config';
const SYNC_STATE_KEY = 'budget_bolt_sync_state';
const DEVICE_ID_KEY = 'budget_bolt_device_id';
const AUTH_TOKENS_KEY = 'budget_bolt_auth_tokens';
const SYNC_DIRECTORY = FileSystem.documentDirectory + 'sync/';
const SYNC_BATCH_PREFIX = 'sync_batch_';
const ENCRYPTION_KEY_KEY = 'budget_bolt_encryption_key';

// Default sync configuration
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 15, // 15 minutes
  syncOnStartup: true,
  syncOnlyOnWifi: true,
  enableEncryption: true,
  storageProvider: StorageProvider.GOOGLE_DRIVE,
  conflictStrategy: ConflictResolutionStrategy.MERGE,
  maxSyncRetries: 3
};

// Default sync state
const DEFAULT_SYNC_STATE: SyncState = {
  status: SyncStatus.IDLE,
  lastSyncAttempt: null,
  lastSuccessfulSync: null,
  currentOperation: null,
  progress: 0,
  conflicts: [],
  error: null,
  pendingChanges: 0
};

/**
 * Initialize the sync system
 * Creates necessary directories and initializes device ID if not already set
 */
export const initializeSync = async (): Promise<void> => {
  try {
    // Create sync directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(SYNC_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(SYNC_DIRECTORY, { intermediates: true });
    }

    // Initialize device ID if not already set
    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!deviceId) {
      const newDeviceId = uuidv4();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
    }

    // Initialize sync config if not already set
    const syncConfigJson = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
    if (!syncConfigJson) {
      await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(DEFAULT_SYNC_CONFIG));
    }

    // Initialize sync state if not already set
    const syncStateJson = await AsyncStorage.getItem(SYNC_STATE_KEY);
    if (!syncStateJson) {
      await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(DEFAULT_SYNC_STATE));
    }

    // Generate encryption key if enabled and not already set
    const config = await getSyncConfig();
    if (config.enableEncryption) {
      const encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
      if (!encryptionKey) {
        const newEncryptionKey = await generateEncryptionKey();
        await SecureStore.setItemAsync(ENCRYPTION_KEY_KEY, newEncryptionKey);
      }
    }
  } catch (error) {
    console.error('Failed to initialize sync:', error);
    throw new Error('Failed to initialize sync system');
  }
};

/**
 * Get the device ID
 */
export const getDeviceId = async (): Promise<string> => {
  const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    throw new Error('Device ID not initialized');
  }
  return deviceId;
};

/**
 * Get the current sync configuration
 */
export const getSyncConfig = async (): Promise<SyncConfig> => {
  const syncConfigJson = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
  if (!syncConfigJson) {
    return DEFAULT_SYNC_CONFIG;
  }
  return JSON.parse(syncConfigJson);
};

/**
 * Update the sync configuration
 */
export const updateSyncConfig = async (config: Partial<SyncConfig>): Promise<SyncConfig> => {
  const currentConfig = await getSyncConfig();
  const newConfig = { ...currentConfig, ...config };
  await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));
  return newConfig;
};

/**
 * Get the current sync state
 */
export const getSyncState = async (): Promise<SyncState> => {
  const syncStateJson = await AsyncStorage.getItem(SYNC_STATE_KEY);
  if (!syncStateJson) {
    return DEFAULT_SYNC_STATE;
  }
  return JSON.parse(syncStateJson);
};

/**
 * Update the sync state
 */
export const updateSyncState = async (state: Partial<SyncState>): Promise<SyncState> => {
  const currentState = await getSyncState();
  const newState = { ...currentState, ...state };
  await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(newState));
  return newState;
};

/**
 * Generate a random encryption key
 */
export const generateEncryptionKey = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map(b => {
      // Type assertion to convert unknown to number
      const byteValue = b as number;
      return byteValue.toString(16).padStart(2, '0');
    })
    .join('');
};

/**
 * Encrypt data using the stored encryption key
 */
export const encryptData = async (data: string): Promise<string> => {
  const config = await getSyncConfig();
  if (!config.enableEncryption) {
    return data;
  }

  const encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
  if (!encryptionKey) {
    throw new Error('Encryption key not found');
  }

  // In a real implementation, this would use a proper encryption algorithm
  // For this example, we'll use a simple hash-based approach
  const dataHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data + encryptionKey
  );
  
  // This is a placeholder for actual encryption
  // In a real app, you would use a proper encryption library
  return `encrypted:${dataHash}:${Buffer.from(data).toString('base64')}`;
};

/**
 * Decrypt data using the stored encryption key
 */
export const decryptData = async (encryptedData: string): Promise<string> => {
  const config = await getSyncConfig();
  if (!config.enableEncryption) {
    return encryptedData;
  }

  if (!encryptedData.startsWith('encrypted:')) {
    return encryptedData; // Not encrypted
  }

  const encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
  if (!encryptionKey) {
    throw new Error('Encryption key not found');
  }

  // This is a placeholder for actual decryption
  // In a real app, you would use a proper decryption library
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const base64Data = parts[2];
  const data = Buffer.from(base64Data, 'base64').toString();
  
  // Verify the hash to ensure data integrity
  const dataHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data + encryptionKey
  );
  
  if (dataHash !== parts[1]) {
    throw new Error('Data integrity check failed');
  }
  
  return data;
};

/**
 * Prepare data for synchronization by adding metadata
 */
export const prepareSyncData = async <T>(
  dataType: SyncableDataType,
  data: SyncableDataMap[typeof dataType],
  id: string
): Promise<SyncableData<SyncableDataMap[typeof dataType]>> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();
  
  return {
    data,
    id,
    version: 1, // Start with version 1 for new data
    lastModified: timestamp,
    lastSynced: null, // Not synced yet
    deviceId,
    deleted: false
  };
};

/**
 * Update existing syncable data
 */
export const updateSyncData = async <T>(
  syncData: SyncableData<T>
): Promise<SyncableData<T>> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();
  
  return {
    ...syncData,
    version: syncData.version + 1,
    lastModified: timestamp,
    lastSynced: null, // Reset sync status
    deviceId // Update device ID to current device
  };
};

/**
 * Mark data as deleted (soft delete)
 */
export const markAsDeleted = async <T>(
  syncData: SyncableData<T>
): Promise<SyncableData<T>> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();
  
  return {
    ...syncData,
    version: syncData.version + 1,
    lastModified: timestamp,
    lastSynced: null, // Reset sync status
    deviceId, // Update device ID to current device
    deleted: true
  };
};

/**
 * Detect conflicts between local and remote data
 */
export const detectConflicts = <T extends keyof SyncableDataMap>(
  localData: SyncableData<SyncableDataMap[T]>,
  remoteData: SyncableData<SyncableDataMap[T]>,
  dataType: T
): SyncConflict<T> | null => {
  // If versions are the same, there's no conflict
  if (localData.version === remoteData.version) {
    return null;
  }
  
  // If one is deleted and the other is modified, there's a conflict
  if (localData.deleted !== remoteData.deleted) {
    return {
      dataType,
      localData,
      remoteData,
      conflictFields: ['deleted']
    };
  }
  
  // If both are deleted, there's no conflict
  if (localData.deleted && remoteData.deleted) {
    return null;
  }
  
  // Compare data fields to find conflicts
  const conflictFields: string[] = [];
  
  // This is a simplified approach - in a real app, you would need
  // a more sophisticated field-by-field comparison
  if (JSON.stringify(localData.data) !== JSON.stringify(remoteData.data)) {
    // For simplicity, we're marking the entire object as conflicted
    // In a real app, you would identify specific fields with conflicts
    conflictFields.push('data');
  }
  
  if (conflictFields.length > 0) {
    return {
      dataType,
      localData,
      remoteData,
      conflictFields
    };
  }
  
  return null;
};

/**
 * Resolve conflicts based on the configured strategy
 */
export const resolveConflict = <T extends keyof SyncableDataMap>(
  conflict: SyncConflict<T>,
  strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.MERGE
): SyncableData<SyncableDataMap[T]> => {
  switch (strategy) {
    case ConflictResolutionStrategy.USE_LOCAL:
      return {
        ...conflict.localData,
        version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1,
        lastModified: Date.now()
      };
      
    case ConflictResolutionStrategy.USE_REMOTE:
      return {
        ...conflict.remoteData,
        version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1,
        lastModified: Date.now()
      };
      
    case ConflictResolutionStrategy.MERGE:
      // This is a simplified merge strategy
      // In a real app, you would need a more sophisticated field-by-field merge
      const mergedData = conflict.localData.lastModified > conflict.remoteData.lastModified
        ? { ...conflict.remoteData.data, ...conflict.localData.data }
        : { ...conflict.localData.data, ...conflict.remoteData.data };
        
      return {
        ...conflict.localData,
        data: mergedData as SyncableDataMap[T],
        version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1,
        lastModified: Date.now()
      };
      
    case ConflictResolutionStrategy.MANUAL:
      // For manual resolution, we default to the local version
      // The UI will need to handle presenting the conflict to the user
      return conflict.localData;
      
    default:
      return conflict.localData;
  }
};

/**
 * Create a sync batch for uploading to the cloud
 */
export const createSyncBatch = async (
  changes: SyncableData<any>[]
): Promise<SyncBatch> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();
  
  return {
    deviceId,
    timestamp,
    changes
  };
};

/**
 * Save a sync batch to local storage
 */
export const saveSyncBatch = async (batch: SyncBatch): Promise<string> => {
  const batchId = `${SYNC_BATCH_PREFIX}${batch.timestamp}`;
  const batchJson = JSON.stringify(batch);
  
  // Encrypt the batch if encryption is enabled
  const config = await getSyncConfig();
  const batchData = config.enableEncryption
    ? await encryptData(batchJson)
    : batchJson;
  
  const batchPath = `${SYNC_DIRECTORY}${batchId}.json`;
  await FileSystem.writeAsStringAsync(batchPath, batchData);
  
  return batchId;
};

/**
 * Load a sync batch from local storage
 */
export const loadSyncBatch = async (batchId: string): Promise<SyncBatch> => {
  const batchPath = `${SYNC_DIRECTORY}${batchId}.json`;
  const batchData = await FileSystem.readAsStringAsync(batchPath);
  
  // Decrypt the batch if encrypted
  const decryptedData = await decryptData(batchData);
  
  return JSON.parse(decryptedData);
};

/**
 * Get all pending sync batches
 */
export const getPendingSyncBatches = async (): Promise<string[]> => {
  const dirContents = await FileSystem.readDirectoryAsync(SYNC_DIRECTORY);
  return dirContents
    .filter(filename => filename.startsWith(SYNC_BATCH_PREFIX) && filename.endsWith('.json'))
    .map(filename => filename.replace('.json', ''));
};

/**
 * Delete a sync batch
 */
export const deleteSyncBatch = async (batchId: string): Promise<void> => {
  const batchPath = `${SYNC_DIRECTORY}${batchId}.json`;
  await FileSystem.deleteAsync(batchPath);
};

/**
 * Get authentication credentials for a storage provider
 */
export const getStorageProviderAuth = async (
  provider: StorageProvider
): Promise<StorageProviderAuth | null> => {
  const authJson = await SecureStore.getItemAsync(`${AUTH_TOKENS_KEY}_${provider}`);
  if (!authJson) {
    return null;
  }
  return JSON.parse(authJson);
};

/**
 * Save authentication credentials for a storage provider
 */
export const saveStorageProviderAuth = async (
  auth: StorageProviderAuth
): Promise<void> => {
  const authJson = JSON.stringify(auth);
  await SecureStore.setItemAsync(`${AUTH_TOKENS_KEY}_${auth.provider}`, authJson);
};

/**
 * Clear authentication credentials for a storage provider
 */
export const clearStorageProviderAuth = async (
  provider: StorageProvider
): Promise<void> => {
  await SecureStore.deleteItemAsync(`${AUTH_TOKENS_KEY}_${provider}`);
};

/**
 * Check if the device is connected to WiFi
 * Note: This is a placeholder. In a real app, you would use a library like @react-native-community/netinfo
 */
export const isConnectedToWifi = async (): Promise<boolean> => {
  // Placeholder implementation
  // In a real app, you would use NetInfo to check the connection type
  return true;
};

/**
 * Check if sync is allowed based on the current configuration and network state
 */
export const isSyncAllowed = async (): Promise<boolean> => {
  const config = await getSyncConfig();
  
  // If sync is disabled, don't sync
  if (!config.autoSync) {
    return false;
  }
  
  // If sync should only happen on WiFi, check the connection
  if (config.syncOnlyOnWifi) {
    const isWifi = await isConnectedToWifi();
    if (!isWifi) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get device information for sync metadata
 */
export const getDeviceInfo = async (): Promise<{
  deviceName: string;
  deviceType: string;
  platform: string;
}> => {
  // Simplified implementation without expo-device dependency
  let deviceName = 'Unknown Device';
  let deviceType = 'Unknown';
  
  try {
    // Use platform information instead of device-specific info
    if (Platform.OS === 'ios') {
      deviceType = Platform.isPad ? 'Tablet' : 'Phone';
      deviceName = 'iOS Device';
    } else if (Platform.OS === 'android') {
      deviceType = 'Phone'; // Simplified assumption
      deviceName = 'Android Device';
    } else if (Platform.OS === 'web') {
      deviceType = 'Desktop';
      deviceName = 'Web Browser';
    }
  } catch (error) {
    console.warn('Failed to get device info:', error);
  }
  
  return {
    deviceName,
    deviceType,
    platform: Platform.OS
  };
};

/**
 * Perform a sync operation
 * This is a placeholder implementation that would need to be connected to actual cloud storage APIs
 */
export const performSync = async (): Promise<SyncResult> => {
  try {
    // Check if sync is allowed
    const canSync = await isSyncAllowed();
    if (!canSync) {
      return {
        status: SyncStatus.FAILED,
        timestamp: Date.now(),
        itemsSynced: 0,
        conflicts: [],
        errors: ['Sync not allowed based on current settings']
      };
    }
    
    // Update sync state to in progress
    await updateSyncState({
      status: SyncStatus.IN_PROGRESS,
      lastSyncAttempt: Date.now(),
      currentOperation: 'Preparing sync',
      progress: 0,
      error: null
    });
    
    // Get the config and auth info
    const config = await getSyncConfig();
    const auth = await getStorageProviderAuth(config.storageProvider);
    
    if (!auth) {
      await updateSyncState({
        status: SyncStatus.FAILED,
        error: `Not authenticated with ${config.storageProvider}`
      });
      
      return {
        status: SyncStatus.FAILED,
        timestamp: Date.now(),
        itemsSynced: 0,
        conflicts: [],
        errors: [`Not authenticated with ${config.storageProvider}`]
      };
    }
    
    // Get pending batches
    const pendingBatches = await getPendingSyncBatches();
    
    // Update sync state
    await updateSyncState({
      currentOperation: 'Uploading changes',
      progress: 10
    });
    
    // This would be where you'd implement the actual sync with the cloud provider
    // For this example, we'll simulate a successful sync
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update progress
    await updateSyncState({
      progress: 50,
      currentOperation: 'Downloading changes'
    });
    
    // Simulate more processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update progress
    await updateSyncState({
      progress: 90,
      currentOperation: 'Finalizing sync'
    });
    
    // Simulate more processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up processed batches
    for (const batchId of pendingBatches) {
      await deleteSyncBatch(batchId);
    }
    
    // Update sync state to completed
    await updateSyncState({
      status: SyncStatus.COMPLETED,
      lastSuccessfulSync: Date.now(),
      currentOperation: null,
      progress: 100,
      pendingChanges: 0
    });
    
    return {
      status: SyncStatus.COMPLETED,
      timestamp: Date.now(),
      itemsSynced: pendingBatches.length,
      conflicts: [],
      errors: []
    };
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Update sync state to failed
    await updateSyncState({
      status: SyncStatus.FAILED,
      currentOperation: null,
      error: error instanceof Error ? error.message : 'Unknown error during sync'
    });
    
    return {
      status: SyncStatus.FAILED,
      timestamp: Date.now(),
      itemsSynced: 0,
      conflicts: [],
      errors: [error instanceof Error ? error.message : 'Unknown error during sync']
    };
  }
};

/**
 * Schedule a sync operation based on the configured interval
 * Returns a function to cancel the scheduled sync
 */
export const scheduleSync = async (): Promise<() => void> => {
  const config = await getSyncConfig();
  
  if (!config.autoSync) {
    return () => {}; // No-op if auto sync is disabled
  }
  
  const intervalMs = config.syncInterval * 60 * 1000; // Convert minutes to milliseconds
  
  const intervalId = setInterval(async () => {
    try {
      await performSync();
    } catch (error) {
      console.error('Scheduled sync failed:', error);
    }
  }, intervalMs);
  
  // Return a function to cancel the scheduled sync
  return () => clearInterval(intervalId);
};

/**
 * Initialize the sync system and schedule sync if configured
 */
export const setupSync = async (): Promise<() => void> => {
  await initializeSync();
  
  const config = await getSyncConfig();
  
  // Perform initial sync if configured
  if (config.syncOnStartup) {
    try {
      await performSync();
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  }
  
  // Schedule regular syncs
  return scheduleSync();
};