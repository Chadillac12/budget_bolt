/**
 * Type definitions for sync operations in Budget Bolt
 */

import { Transaction } from './transaction';
import { Budget } from './budget';
import { Account } from './account';
import { Payee } from './payee';
import { Rule } from './rule';
import { ReconciliationSession } from './reconciliation';

/**
 * Represents the types of data that can be synchronized
 */
export type SyncableDataType = 
  | 'transaction'
  | 'budget'
  | 'account'
  | 'payee'
  | 'rule'
  | 'reconciliation';

/**
 * Maps data types to their respective data structures
 */
export interface SyncableDataMap {
  'transaction': Transaction;
  'budget': Budget;
  'account': Account;
  'payee': Payee;
  'rule': Rule;
  'reconciliation': ReconciliationSession;
}

/**
 * Represents the status of a sync operation
 */
export enum SyncStatus {
  IDLE = 'idle',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

/**
 * Represents a version-controlled data object with sync metadata
 */
export interface SyncableData<T> {
  data: T;
  id: string;
  version: number;
  lastModified: number; // timestamp
  lastSynced: number | null; // timestamp
  deviceId: string;
  deleted: boolean;
}

/**
 * Represents a conflict between local and remote data
 */
export interface SyncConflict<T extends keyof SyncableDataMap> {
  dataType: T;
  localData: SyncableData<SyncableDataMap[T]>;
  remoteData: SyncableData<SyncableDataMap[T]>;
  conflictFields: string[];
}

/**
 * Available conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  USE_LOCAL = 'use_local',
  USE_REMOTE = 'use_remote',
  MERGE = 'merge',
  MANUAL = 'manual'
}

/**
 * Configuration for the sync service
 */
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in minutes
  syncOnStartup: boolean;
  syncOnlyOnWifi: boolean;
  enableEncryption: boolean;
  storageProvider: StorageProvider;
  conflictStrategy: ConflictResolutionStrategy;
  maxSyncRetries: number;
}

/**
 * Supported cloud storage providers
 */
export enum StorageProvider {
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
  ONEDRIVE = 'onedrive',
  ICLOUD = 'icloud',
  CUSTOM = 'custom'
}

/**
 * Represents the overall sync state
 */
export interface SyncState {
  status: SyncStatus;
  lastSyncAttempt: number | null; // timestamp
  lastSuccessfulSync: number | null; // timestamp
  currentOperation: string | null;
  progress: number; // 0-100
  conflicts: SyncConflict<any>[];
  error: string | null;
  pendingChanges: number;
}

/**
 * Represents a batch of changes to be synchronized
 */
export interface SyncBatch {
  deviceId: string;
  timestamp: number;
  changes: SyncableData<any>[];
}

/**
 * Authentication credentials for storage providers
 */
export interface StorageProviderAuth {
  provider: StorageProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  userId?: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  status: SyncStatus;
  timestamp: number;
  itemsSynced: number;
  conflicts: SyncConflict<any>[];
  errors: string[];
}