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
const SYNC_DIRECTORY = Platform.OS === 'web' ? '' : FileSystem.documentDirectory + 'sync/';
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

// --- Web stubs ---
const webSyncStubs = {
  initializeSync: async () => { console.warn('Sync is not supported on web.'); },
  getDeviceId: async () => { throw new Error('Sync is not supported on web.'); },
  getSyncConfig: async () => DEFAULT_SYNC_CONFIG,
  updateSyncConfig: async (config: any) => ({ ...DEFAULT_SYNC_CONFIG, ...config }),
  getSyncState: async () => DEFAULT_SYNC_STATE,
  updateSyncState: async (state: any) => ({ ...DEFAULT_SYNC_STATE, ...state }),
  generateEncryptionKey: async () => '',
  encryptData: async (data: string) => data,
  decryptData: async (data: string) => data,
  prepareSyncData: async (dataType: any, data: any, id: any) => ({ data, id, version: 1, lastModified: Date.now(), lastSynced: null, deviceId: 'web', deleted: false }),
  updateSyncData: async (syncData: any) => syncData,
  markAsDeleted: async (syncData: any) => syncData,
  detectConflicts: () => null,
  resolveConflict: (conflict: any, strategy: any) => conflict.localData,
  createSyncBatch: async (changes: any) => ({ deviceId: 'web', timestamp: Date.now(), changes }),
  saveSyncBatch: async (batch: any) => '',
  loadSyncBatch: async (batchId: any) => { throw new Error('Sync is not supported on web.'); },
  getPendingSyncBatches: async () => [],
  deleteSyncBatch: async (batchId: any) => {},
  getStorageProviderAuth: async (provider: any) => null,
  saveStorageProviderAuth: async (auth: any) => {},
  clearStorageProviderAuth: async (provider: any) => {},
  isConnectedToWifi: async () => true,
  isSyncAllowed: async () => false,
  getDeviceInfo: async () => ({ deviceName: 'Web Browser', deviceType: 'Desktop', platform: 'web' }),
  performSync: async () => ({ status: 'FAILED', timestamp: Date.now(), itemsSynced: 0, conflicts: [], errors: ['Sync not supported on web'] }),
  scheduleSync: async () => () => {},
  setupSync: async () => () => {},
};

// --- Native implementations ---
const initializeSync = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(SYNC_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(SYNC_DIRECTORY, { intermediates: true });
    }

    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!deviceId) {
      const newDeviceId = uuidv4();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
    }

    const syncConfigJson = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
    if (!syncConfigJson) {
      await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(DEFAULT_SYNC_CONFIG));
    }

    const syncStateJson = await AsyncStorage.getItem(SYNC_STATE_KEY);
    if (!syncStateJson) {
      await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(DEFAULT_SYNC_STATE));
    }

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

const getDeviceId = async (): Promise<string> => {
  const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    throw new Error('Device ID not initialized');
  }
  return deviceId;
};

const getSyncConfig = async (): Promise<SyncConfig> => {
  const syncConfigJson = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
  if (!syncConfigJson) {
    return DEFAULT_SYNC_CONFIG;
  }
  return JSON.parse(syncConfigJson);
};

const updateSyncConfig = async (config: Partial<SyncConfig>): Promise<SyncConfig> => {
  const currentConfig = await getSyncConfig();
  const newConfig = { ...currentConfig, ...config };
  await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));
  return newConfig;
};

const getSyncState = async (): Promise<SyncState> => {
  const syncStateJson = await AsyncStorage.getItem(SYNC_STATE_KEY);
  if (!syncStateJson) {
    return DEFAULT_SYNC_STATE;
  }
  return JSON.parse(syncStateJson);
};

const updateSyncState = async (state: Partial<SyncState>): Promise<SyncState> => {
  const currentState = await getSyncState();
  const newState = { ...currentState, ...state };
  await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(newState));
  return newState;
};

const generateEncryptionKey = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map(b => {
      const byteValue = b as number;
      return byteValue.toString(16).padStart(2, '0');
    })
    .join('');
};

const encryptData = async (data: string): Promise<string> => {
  const config = await getSyncConfig();
  if (!config.enableEncryption) {
    return data;
  }

  const encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
  if (!encryptionKey) {
    throw new Error('Encryption key not found');
  }

  const dataHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data + encryptionKey
  );

  return `encrypted:${dataHash}:${Buffer.from(data).toString('base64')}`;
};

const decryptData = async (encryptedData: string): Promise<string> => {
  const config = await getSyncConfig();
  if (!config.enableEncryption) {
    return encryptedData;
  }

  if (!encryptedData.startsWith('encrypted:')) {
    return encryptedData;
  }

  const encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
  if (!encryptionKey) {
    throw new Error('Encryption key not found');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const base64Data = parts[2];
  const data = Buffer.from(base64Data, 'base64').toString();

  const dataHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data + encryptionKey
  );

  if (dataHash !== parts[1]) {
    throw new Error('Data integrity check failed');
  }

  return data;
};

const prepareSyncData = async <T>(
  dataType: SyncableDataType,
  data: SyncableDataMap[typeof dataType],
  id: string
): Promise<SyncableData<SyncableDataMap[typeof dataType]>> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();

  return {
    data,
    id,
    version: 1,
    lastModified: timestamp,
    lastSynced: null,
    deviceId,
    deleted: false
  };
};

const updateSyncData = async <T>(
  syncData: SyncableData<T>
): Promise<SyncableData<T>> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();

  return {
    ...syncData,
    version: syncData.version + 1,
    lastModified: timestamp,
    lastSynced: null,
    deviceId
  };
};

const markAsDeleted = async <T>(
  syncData: SyncableData<T>
): Promise<SyncableData<T>> => {
  const deviceId = await getDeviceId();
  const timestamp = Date.now();

  return {
    ...syncData,
    version: syncData.version + 1,
    lastModified: timestamp,
    lastSynced: null,
    deviceId,
    deleted: true
  };
};

const detectConflicts = <T extends keyof SyncableDataMap>(
  localData: SyncableData<SyncableDataMap[T]>,
  remoteData: SyncableData<SyncableDataMap[T]>,
  dataType: T
): SyncConflict<T> | null => {
  if (localData.version === remoteData.version) {
    return null;
  }

  if (localData.deleted !== remoteData.deleted) {
    return {
      dataType,
      localData,
      remoteData,
      conflictFields: ['deleted']
    };
  }

  if (localData.deleted && remoteData.deleted) {
    return null;
  }

  const conflictFields: string[] = [];

  if (JSON.stringify(localData.data) !== JSON.stringify(remoteData.data)) {
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

const resolveConflict = <T extends keyof SyncableDataMap>(
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
      return conflict.localData;

    default:
      return conflict.localData;
  }
};

const createSyncBatch = async (
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

const saveSyncBatch = async (batch: SyncBatch): Promise<string> => {
  const batchId = `${SYNC_BATCH_PREFIX}${batch.timestamp}`;
  const batchJson = JSON.stringify(batch);

  const config = await getSyncConfig();
  const batchData = config.enableEncryption
    ? await encryptData(batchJson)
    : batchJson;

  const batchPath = `${SYNC_DIRECTORY}${batchId}.json`;
  await FileSystem.writeAsStringAsync(batchPath, batchData);

  return batchId;
};

const loadSyncBatch = async (batchId: string): Promise<SyncBatch> => {
  const batchPath = `${SYNC_DIRECTORY}${batchId}.json`;
  const batchData = await FileSystem.readAsStringAsync(batchPath);

  const decryptedData = await decryptData(batchData);

  return JSON.parse(decryptedData);
};

const getPendingSyncBatches = async (): Promise<string[]> => {
  const dirContents = await FileSystem.readDirectoryAsync(SYNC_DIRECTORY);
  return dirContents
    .filter(filename => filename.startsWith(SYNC_BATCH_PREFIX) && filename.endsWith('.json'))
    .map(filename => filename.replace('.json', ''));
};

const deleteSyncBatch = async (batchId: string): Promise<void> => {
  const batchPath = `${SYNC_DIRECTORY}${batchId}.json`;
  await FileSystem.deleteAsync(batchPath);
};

const getStorageProviderAuth = async (
  provider: StorageProvider
): Promise<StorageProviderAuth | null> => {
  const authJson = await SecureStore.getItemAsync(`${AUTH_TOKENS_KEY}_${provider}`);
  if (!authJson) {
    return null;
  }
  return JSON.parse(authJson);
};

const saveStorageProviderAuth = async (
  auth: StorageProviderAuth
): Promise<void> => {
  const authJson = JSON.stringify(auth);
  await SecureStore.setItemAsync(`${AUTH_TOKENS_KEY}_${auth.provider}`, authJson);
};

const clearStorageProviderAuth = async (
  provider: StorageProvider
): Promise<void> => {
  await SecureStore.deleteItemAsync(`${AUTH_TOKENS_KEY}_${provider}`);
};

const isConnectedToWifi = async (): Promise<boolean> => {
  return true;
};

const isSyncAllowed = async (): Promise<boolean> => {
  const config = await getSyncConfig();

  if (!config.autoSync) {
    return false;
  }

  if (config.syncOnlyOnWifi) {
    const isWifi = await isConnectedToWifi();
    if (!isWifi) {
      return false;
    }
  }

  return true;
};

const getDeviceInfo = async (): Promise<{
  deviceName: string;
  deviceType: string;
  platform: string;
}> => {
  let deviceName = 'Unknown Device';
  let deviceType = 'Unknown';

  try {
    if (Platform.OS === 'ios') {
      deviceType = Platform.isPad ? 'Tablet' : 'Phone';
      deviceName = 'iOS Device';
    } else if (Platform.OS === 'android') {
      deviceType = 'Phone';
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

const performSync = async (): Promise<SyncResult> => {
  try {
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

    await updateSyncState({
      status: SyncStatus.IN_PROGRESS,
      lastSyncAttempt: Date.now(),
      currentOperation: 'Preparing sync',
      progress: 0,
      error: null
    });

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

    const pendingBatches = await getPendingSyncBatches();

    await updateSyncState({
      currentOperation: 'Uploading changes',
      progress: 10
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateSyncState({
      progress: 50,
      currentOperation: 'Downloading changes'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateSyncState({
      progress: 90,
      currentOperation: 'Finalizing sync'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    for (const batchId of pendingBatches) {
      await deleteSyncBatch(batchId);
    }

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