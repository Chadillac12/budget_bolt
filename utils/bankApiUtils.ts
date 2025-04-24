import { 
  BankConnection, 
  BankInstitution, 
  ConnectionStatus, 
  ConnectionError, 
  OAuthTokens,
  BankSyncSession,
  BankApiConfig
} from '@/types/bankConnection';
import { Transaction } from '@/types/transaction';
import { Account } from '@/types/account';
import { storeData, getData } from '@/utils/storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Storage keys
const STORAGE_KEYS = {
  BANK_CONNECTIONS: 'budget_tracker_bank_connections',
  BANK_INSTITUTIONS: 'budget_tracker_bank_institutions',
  BANK_SYNC_SESSIONS: 'budget_tracker_bank_sync_sessions',
  BANK_API_CONFIG: 'budget_tracker_bank_api_config',
};

// Default API configuration
const DEFAULT_API_CONFIG: BankApiConfig = {
  baseUrl: 'https://api.budgetbolt.com/banking',
  apiVersion: 'v1',
  clientId: 'budget_bolt_app',
  clientSecret: '', // Should be securely stored and not hardcoded
  redirectUri: 'budgetbolt://auth/callback',
  scopes: ['accounts', 'transactions', 'balances'],
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  encryptionEnabled: true,
};

/**
 * Initializes the bank API configuration
 */
export const initializeBankApi = async (): Promise<BankApiConfig> => {
  try {
    // Try to load existing config
    const storedConfig = await getData(STORAGE_KEYS.BANK_API_CONFIG);
    
    if (storedConfig) {
      return storedConfig as BankApiConfig;
    }
    
    // If no config exists, store and return the default
    await storeData(STORAGE_KEYS.BANK_API_CONFIG, DEFAULT_API_CONFIG);
    return DEFAULT_API_CONFIG;
  } catch (error) {
    console.error('Failed to initialize bank API config:', error);
    return DEFAULT_API_CONFIG;
  }
};

/**
 * Fetches available bank institutions from the API
 */
export const fetchBankInstitutions = async (): Promise<BankInstitution[]> => {
  try {
    const config = await initializeBankApi();
    
    // In a real app, this would make an API call to fetch institutions
    // For now, we'll return mock data
    const mockInstitutions: BankInstitution[] = [
      {
        id: 'chase',
        name: 'Chase Bank',
        logo: 'https://logo.clearbit.com/chase.com',
        domain: 'chase.com',
        connectionType: 'oauth',
        supportsAccountSync: true,
        supportsTransactionSync: true,
        supportsPendingTransactions: true,
        supportsBalanceCheck: true,
        country: 'US',
        status: 'active',
      },
      {
        id: 'bankofamerica',
        name: 'Bank of America',
        logo: 'https://logo.clearbit.com/bankofamerica.com',
        domain: 'bankofamerica.com',
        connectionType: 'oauth',
        supportsAccountSync: true,
        supportsTransactionSync: true,
        supportsPendingTransactions: true,
        supportsBalanceCheck: true,
        country: 'US',
        status: 'active',
      },
      {
        id: 'wellsfargo',
        name: 'Wells Fargo',
        logo: 'https://logo.clearbit.com/wellsfargo.com',
        domain: 'wellsfargo.com',
        connectionType: 'credentials',
        supportsAccountSync: true,
        supportsTransactionSync: true,
        supportsPendingTransactions: false,
        supportsBalanceCheck: true,
        country: 'US',
        status: 'active',
      },
    ];
    
    // Store institutions for offline access
    await storeData(STORAGE_KEYS.BANK_INSTITUTIONS, mockInstitutions);
    
    return mockInstitutions;
  } catch (error) {
    console.error('Failed to fetch bank institutions:', error);
    
    // Try to return cached institutions if available
    const cachedInstitutions = await getData(STORAGE_KEYS.BANK_INSTITUTIONS);
    return cachedInstitutions || [];
  }
};

/**
 * Initiates OAuth connection flow for a bank
 */
export const initiateOAuthConnection = async (
  institutionId: string
): Promise<{ success: boolean; connectionId?: string; error?: string }> => {
  try {
    const config = await initializeBankApi();
    const institutions = await fetchBankInstitutions();
    const institution = institutions.find(inst => inst.id === institutionId);
    
    if (!institution) {
      throw new Error(`Institution with ID ${institutionId} not found`);
    }
    
    if (institution.connectionType !== 'oauth') {
      throw new Error(`Institution ${institution.name} does not support OAuth`);
    }
    
    // Generate state parameter for security
    const state = Crypto.randomUUID();
    
    // Store state temporarily for verification
    await SecureStore.setItemAsync('oauth_state', state);
    
    // Construct OAuth URL
    const oauthUrl = `${config.baseUrl}/oauth/authorize?` +
      `client_id=${encodeURIComponent(config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(config.scopes.join(' '))}` +
      `&state=${encodeURIComponent(state)}` +
      `&institution_id=${encodeURIComponent(institutionId)}`;
    
    // Open browser for OAuth flow
    const result = await WebBrowser.openAuthSessionAsync(
      oauthUrl,
      config.redirectUri
    );
    
    if (result.type === 'success' && result.url) {
      // Parse URL parameters
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const storedState = await SecureStore.getItemAsync('oauth_state');
      
      // Clear stored state
      await SecureStore.deleteItemAsync('oauth_state');
      
      // Verify state parameter to prevent CSRF attacks
      if (returnedState !== storedState) {
        throw new Error('OAuth state mismatch, possible CSRF attack');
      }
      
      if (!code) {
        throw new Error('No authorization code received');
      }
      
      // Exchange code for tokens
      // In a real app, this would make an API call
      // For now, we'll simulate a successful token exchange
      const tokens: OAuthTokens = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        scope: config.scopes,
      };
      
      // Create a new connection
      const connectionId = Crypto.randomUUID();
      const connection: BankConnection = {
        id: connectionId,
        userId: 'current_user', // In a real app, this would be the actual user ID
        institutionId: institution.id,
        institutionName: institution.name,
        status: 'connected',
        lastSynced: null,
        lastSuccessfulSync: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        oauthTokens: tokens,
        autoSync: true,
        syncFrequency: 'daily',
        consecutiveFailures: 0,
        connectedAccountIds: [],
        consentGranted: true,
        dataAccessPermissions: {
          accountDetails: true,
          transactions: true,
          balances: true,
          statements: false,
        },
      };
      
      // Save the connection
      await saveBankConnection(connection);
      
      // Initiate first sync
      await syncBankConnection(connectionId);
      
      return { success: true, connectionId };
    }
    
    return { success: false, error: 'OAuth flow was cancelled or failed' };
  } catch (error) {
    console.error('OAuth connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during OAuth connection' 
    };
  }
};

/**
 * Initiates credential-based connection flow for a bank
 */
export const initiateCredentialConnection = async (
  institutionId: string,
  username: string,
  password: string
): Promise<{ success: boolean; connectionId?: string; error?: string }> => {
  try {
    const institutions = await fetchBankInstitutions();
    const institution = institutions.find(inst => inst.id === institutionId);
    
    if (!institution) {
      throw new Error(`Institution with ID ${institutionId} not found`);
    }
    
    if (institution.connectionType !== 'credentials') {
      throw new Error(`Institution ${institution.name} does not support credential-based authentication`);
    }
    
    // In a real app, this would make an API call to authenticate with the bank
    // For now, we'll simulate a successful authentication
    
    // Create a new connection
    const connectionId = Crypto.randomUUID();
    const connection: BankConnection = {
      id: connectionId,
      userId: 'current_user', // In a real app, this would be the actual user ID
      institutionId: institution.id,
      institutionName: institution.name,
      status: 'connected',
      lastSynced: null,
      lastSuccessfulSync: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      credentials: {
        username,
        password: await encryptSensitiveData(password), // In reality, we'd never store the actual password
      },
      autoSync: true,
      syncFrequency: 'daily',
      consecutiveFailures: 0,
      connectedAccountIds: [],
      consentGranted: true,
      dataAccessPermissions: {
        accountDetails: true,
        transactions: true,
        balances: true,
        statements: false,
      },
    };
    
    // Save the connection
    await saveBankConnection(connection);
    
    // Initiate first sync
    await syncBankConnection(connectionId);
    
    return { success: true, connectionId };
  } catch (error) {
    console.error('Credential connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during credential connection' 
    };
  }
};

/**
 * Saves a bank connection to storage
 */
export const saveBankConnection = async (connection: BankConnection): Promise<void> => {
  try {
    // Get existing connections
    const connections = await getBankConnections();
    
    // Find if this connection already exists
    const existingIndex = connections.findIndex(conn => conn.id === connection.id);
    
    if (existingIndex >= 0) {
      // Update existing connection
      connections[existingIndex] = {
        ...connection,
        updatedAt: new Date(),
      };
    } else {
      // Add new connection
      connections.push(connection);
    }
    
    // Save to storage
    await storeData(STORAGE_KEYS.BANK_CONNECTIONS, connections);
  } catch (error) {
    console.error('Failed to save bank connection:', error);
    throw error;
  }
};

/**
 * Gets all bank connections from storage
 */
export const getBankConnections = async (): Promise<BankConnection[]> => {
  try {
    const connections = await getData(STORAGE_KEYS.BANK_CONNECTIONS);
    return connections || [];
  } catch (error) {
    console.error('Failed to get bank connections:', error);
    return [];
  }
};

/**
 * Gets a specific bank connection by ID
 */
export const getBankConnection = async (connectionId: string): Promise<BankConnection | null> => {
  try {
    const connections = await getBankConnections();
    return connections.find(conn => conn.id === connectionId) || null;
  } catch (error) {
    console.error(`Failed to get bank connection with ID ${connectionId}:`, error);
    return null;
  }
};

/**
 * Deletes a bank connection
 */
export const deleteBankConnection = async (connectionId: string): Promise<boolean> => {
  try {
    const connections = await getBankConnections();
    const filteredConnections = connections.filter(conn => conn.id !== connectionId);
    
    if (filteredConnections.length === connections.length) {
      // Connection not found
      return false;
    }
    
    // Save updated connections
    await storeData(STORAGE_KEYS.BANK_CONNECTIONS, filteredConnections);
    return true;
  } catch (error) {
    console.error(`Failed to delete bank connection with ID ${connectionId}:`, error);
    return false;
  }
};

/**
 * Syncs a bank connection to fetch latest accounts and transactions
 */
export const syncBankConnection = async (connectionId: string): Promise<BankSyncSession> => {
  try {
    // Get the connection
    const connection = await getBankConnection(connectionId);
    
    if (!connection) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }
    
    // Create a sync session
    const syncSession: BankSyncSession = {
      id: Crypto.randomUUID(),
      connectionId,
      startTime: new Date(),
      status: 'in_progress',
      accountsSynced: 0,
      transactionsAdded: 0,
      transactionsUpdated: 0,
    };
    
    // Save the sync session
    await saveSyncSession(syncSession);
    
    // In a real app, this would make API calls to fetch accounts and transactions
    // For now, we'll simulate a successful sync with mock data
    
    // Update connection status
    connection.status = 'connected';
    connection.lastSynced = new Date();
    connection.lastSuccessfulSync = new Date();
    connection.error = undefined;
    connection.consecutiveFailures = 0;
    
    // Save updated connection
    await saveBankConnection(connection);
    
    // Update sync session
    syncSession.endTime = new Date();
    syncSession.status = 'completed';
    syncSession.accountsSynced = 2; // Mock data
    syncSession.transactionsAdded = 10; // Mock data
    
    // Save updated sync session
    await saveSyncSession(syncSession);
    
    return syncSession;
  } catch (error) {
    console.error(`Failed to sync bank connection with ID ${connectionId}:`, error);
    
    // Get the connection
    const connection = await getBankConnection(connectionId);
    
    if (connection) {
      // Update connection status
      connection.status = 'error';
      connection.error = {
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Unknown error during sync',
        timestamp: new Date(),
        retryable: true,
      };
      connection.consecutiveFailures += 1;
      
      // Save updated connection
      await saveBankConnection(connection);
    }
    
    // Create a failed sync session
    const syncSession: BankSyncSession = {
      id: Crypto.randomUUID(),
      connectionId,
      startTime: new Date(),
      endTime: new Date(),
      status: 'failed',
      accountsSynced: 0,
      transactionsAdded: 0,
      transactionsUpdated: 0,
      error: {
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Unknown error during sync',
        timestamp: new Date(),
        retryable: true,
      },
    };
    
    // Save the sync session
    await saveSyncSession(syncSession);
    
    return syncSession;
  }
};

/**
 * Saves a sync session to storage
 */
export const saveSyncSession = async (session: BankSyncSession): Promise<void> => {
  try {
    // Get existing sessions
    const sessions = await getSyncSessions();
    
    // Find if this session already exists
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      // Update existing session
      sessions[existingIndex] = session;
    } else {
      // Add new session
      sessions.push(session);
    }
    
    // Save to storage
    await storeData(STORAGE_KEYS.BANK_SYNC_SESSIONS, sessions);
  } catch (error) {
    console.error('Failed to save sync session:', error);
    throw error;
  }
};

/**
 * Gets all sync sessions from storage
 */
export const getSyncSessions = async (): Promise<BankSyncSession[]> => {
  try {
    const sessions = await getData(STORAGE_KEYS.BANK_SYNC_SESSIONS);
    return sessions || [];
  } catch (error) {
    console.error('Failed to get sync sessions:', error);
    return [];
  }
};

/**
 * Gets sync sessions for a specific connection
 */
export const getConnectionSyncSessions = async (connectionId: string): Promise<BankSyncSession[]> => {
  try {
    const sessions = await getSyncSessions();
    return sessions.filter(session => session.connectionId === connectionId);
  } catch (error) {
    console.error(`Failed to get sync sessions for connection ${connectionId}:`, error);
    return [];
  }
};

/**
 * Refreshes OAuth tokens for a connection
 */
export const refreshOAuthTokens = async (connectionId: string): Promise<boolean> => {
  try {
    const connection = await getBankConnection(connectionId);
    
    if (!connection || !connection.oauthTokens) {
      throw new Error(`Connection with ID ${connectionId} not found or is not OAuth-based`);
    }
    
    // In a real app, this would make an API call to refresh the tokens
    // For now, we'll simulate a successful token refresh
    const newTokens: OAuthTokens = {
      accessToken: 'new_mock_access_token',
      refreshToken: 'new_mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      scope: connection.oauthTokens.scope,
    };
    
    // Update connection
    connection.oauthTokens = newTokens;
    connection.status = 'connected';
    connection.updatedAt = new Date();
    
    // Save updated connection
    await saveBankConnection(connection);
    
    return true;
  } catch (error) {
    console.error(`Failed to refresh OAuth tokens for connection ${connectionId}:`, error);
    return false;
  }
};

/**
 * Encrypts sensitive data before storing
 */
export const encryptSensitiveData = async (data: string): Promise<string> => {
  // In a real app, this would use proper encryption
  // For now, we'll just return a base64 encoded string to simulate encryption
  return btoa(`encrypted:${data}`);
};

/**
 * Decrypts sensitive data
 */
export const decryptSensitiveData = async (encryptedData: string): Promise<string> => {
  // In a real app, this would use proper decryption
  // For now, we'll just decode the base64 string and remove the prefix
  const decoded = atob(encryptedData);
  return decoded.replace('encrypted:', '');
};

/**
 * Imports transactions from a bank connection
 */
export const importBankTransactions = async (
  connectionId: string,
  accountId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ added: Transaction[]; updated: Transaction[]; errors: string[] }> => {
  try {
    // In a real app, this would make API calls to fetch transactions
    // For now, we'll return mock data
    
    // Generate some mock transactions
    const mockTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `bank-tx-${Crypto.randomUUID()}`,
      accountId,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Last 10 days
      payee: `Bank Payee ${i + 1}`,
      amount: Math.random() * 100 * (Math.random() > 0.7 ? -1 : 1), // Some negative amounts
      type: Math.random() > 0.7 ? 'income' : 'expense',
      categoryId: '', // Would be mapped based on payee or rules
      description: `Bank transaction ${i + 1}`,
      isReconciled: false,
      isCleared: true,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSplit: false,
    }));
    
    return {
      added: mockTransactions,
      updated: [],
      errors: [],
    };
  } catch (error) {
    console.error(`Failed to import transactions for connection ${connectionId}:`, error);
    return {
      added: [],
      updated: [],
      errors: [error instanceof Error ? error.message : 'Unknown error during transaction import'],
    };
  }
};

/**
 * Detects duplicate transactions
 */
export const detectDuplicateTransactions = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): { duplicates: Transaction[]; unique: Transaction[] } => {
  const unique: Transaction[] = [];
  const duplicates: Transaction[] = [];
  
  // Helper function to safely get timestamp from a date (which might be a string or Date object)
  const getTimestamp = (date: Date | string): number => {
    if (date instanceof Date) {
      return date.getTime();
    } else if (typeof date === 'string') {
      return new Date(date).getTime();
    }
    // If for some reason date is invalid, return current timestamp as fallback
    return Date.now();
  };
  
  for (const newTx of newTransactions) {
    try {
      // Make sure new transaction date is a valid date
      const newTxTime = getTimestamp(newTx.date);
      
      // Check for potential duplicates based on date, amount, and payee
      const potentialDuplicates = existingTransactions.filter(existingTx => {
        try {
          const existingTxTime = getTimestamp(existingTx.date);
          return (
            Math.abs((existingTxTime - newTxTime) / (1000 * 60 * 60 * 24)) <= 3 && // Within 3 days
            Math.abs(existingTx.amount - newTx.amount) < 0.01 && // Same amount (accounting for floating point errors)
            existingTx.payee === newTx.payee // Same payee
          );
        } catch (err) {
          console.error('[DEBUG] Error comparing transaction:', err, existingTx);
          return false; // Skip this transaction if there's an error
        }
      });
      
      if (potentialDuplicates.length > 0) {
        duplicates.push(newTx);
      } else {
        unique.push(newTx);
      }
    } catch (err) {
      console.error('[DEBUG] Error processing new transaction:', err, newTx);
      // If there's an error with this transaction, consider it unique to avoid data loss
      unique.push(newTx);
    }
  }
  
  return { duplicates, unique };
};

/**
 * Categorizes transactions based on rules and payee history
 */
export const categorizeTransactions = (
  transactions: Transaction[],
  rules: any[], // Would use the Rule type from your application
  payeeCategories: Record<string, string> // Map of payee to categoryId
): Transaction[] => {
  return transactions.map(transaction => {
    // Skip if already categorized
    if (transaction.categoryId) {
      return transaction;
    }
    
    // Check if we have a category for this payee
    if (transaction.payee && payeeCategories[transaction.payee]) {
      return {
        ...transaction,
        categoryId: payeeCategories[transaction.payee],
      };
    }
    
    // Apply rules (simplified version)
    for (const rule of rules) {
      // In a real app, this would be more sophisticated
      if (rule.conditions.some((condition: any) => 
        condition.field === 'payee' && 
        transaction.payee.toLowerCase().includes(condition.value.toLowerCase())
      )) {
        return {
          ...transaction,
          categoryId: rule.actions.categoryId,
        };
      }
    }
    
    // No category found
    return transaction;
  });
};