/**
 * Types for bank connections and API integration
 */

/**
 * Represents a banking institution that can be connected to
 */
export interface BankInstitution {
  id: string;
  name: string;
  logo: string;
  domain: string;
  connectionType: 'oauth' | 'credentials' | 'apiKey';
  supportsAccountSync: boolean;
  supportsTransactionSync: boolean;
  supportsPendingTransactions: boolean;
  supportsBalanceCheck: boolean;
  country: string;
  status: 'active' | 'maintenance' | 'deprecated';
}

/**
 * Status of a bank connection
 */
export type ConnectionStatus = 
  | 'connected'      // Successfully connected and authenticated
  | 'connecting'     // In the process of establishing connection
  | 'disconnected'   // Not connected (user disconnected)
  | 'error'          // Connection error
  | 'expired'        // Authentication expired
  | 'maintenance'    // Institution is under maintenance
  | 'reconnect_required'; // Needs to be reconnected (e.g., token expired)

/**
 * Error types that can occur with bank connections
 */
export type ConnectionErrorType =
  | 'authentication_error'  // Invalid credentials or token
  | 'api_error'            // Error from the bank's API
  | 'timeout_error'        // Connection timeout
  | 'rate_limit_error'     // API rate limit exceeded
  | 'maintenance_error'    // Bank system under maintenance
  | 'permission_error'     // Missing required permissions
  | 'unknown_error';       // Unspecified error

/**
 * Detailed error information for bank connections
 */
export interface ConnectionError {
  type: ConnectionErrorType;
  message: string;
  code?: string;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Credentials for bank connections that use username/password
 * Note: These should be encrypted when stored
 */
export interface BankCredentials {
  username: string;
  password: string;
  securityQuestions?: Record<string, string>;
  mfaType?: 'sms' | 'email' | 'app' | 'security_questions';
  mfaDeliveryMethod?: string;
  mfaPhoneNumber?: string;
  mfaEmail?: string;
}

/**
 * OAuth tokens for bank connections that use OAuth
 * Note: These should be encrypted when stored
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

/**
 * API key information for bank connections that use API keys
 * Note: These should be encrypted when stored
 */
export interface ApiKeyCredentials {
  apiKey: string;
  apiSecret?: string;
  expiresAt?: Date;
}

/**
 * Represents a connection to a bank account
 */
export interface BankConnection {
  id: string;
  userId: string;
  institutionId: string;
  institutionName: string;
  status: ConnectionStatus;
  lastSynced: Date | null;
  lastSuccessfulSync: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Authentication details (one of these will be used based on connectionType)
  credentials?: BankCredentials;
  oauthTokens?: OAuthTokens;
  apiKey?: ApiKeyCredentials;
  
  // Connection settings
  autoSync: boolean;
  syncFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  
  // Error tracking
  error?: ConnectionError;
  consecutiveFailures: number;
  
  // Connected accounts
  connectedAccountIds: string[];
  
  // Privacy and security settings
  consentGranted: boolean;
  consentExpiresAt?: Date;
  dataAccessPermissions: {
    accountDetails: boolean;
    transactions: boolean;
    balances: boolean;
    statements: boolean;
  };
  
  // Encryption information
  encryptionKeyId?: string;
}

/**
 * Represents a sync session for bank data
 */
export interface BankSyncSession {
  id: string;
  connectionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'failed';
  accountsSynced: number;
  transactionsAdded: number;
  transactionsUpdated: number;
  error?: ConnectionError;
}

/**
 * Configuration for bank API integration
 */
export interface BankApiConfig {
  baseUrl: string;
  apiVersion: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  timeout: number;
  retryAttempts: number;
  encryptionEnabled: boolean;
}