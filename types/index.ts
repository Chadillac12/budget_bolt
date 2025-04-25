/**
 * Account interface for financial accounts in the app
 */
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';
  balance: number;
  currency: string;
  isActive: boolean;
  isHidden?: boolean;
  institutionId?: string;
  accountNumber?: string;
  notes?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction interface for financial transactions in the app
 */
export interface Transaction {
  id: string;
  accountId: string;
  date: Date | string;
  amount: number;
  description: string;
  category?: string;
  type: 'income' | 'expense' | 'transfer';
  isReconciled?: boolean;
  payee?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction category interface
 */
export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  parentId?: string;
  isHidden?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Budget interface
 */
export interface Budget {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  categories: any[]; // This is a simplified version
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolloverSettings: {
    enabled: boolean;
    rolloverType: 'none' | 'all' | 'partial';
  };
}

/**
 * Rule interface for transaction categorization rules
 */
export interface Rule {
  id: string;
  name: string;
  conditions: any[]; // This is a simplified version
  actions: any[]; // This is a simplified version
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payee interface for recurring payment recipients
 */
export interface Payee {
  id: string;
  name: string;
  categoryId?: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payee category interface
 */
export interface PayeeCategory {
  id: string;
  name: string;
  color?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reconciliation session interface
 */
export interface ReconciliationSession {
  id: string;
  accountId: string;
  startDate: Date;
  endDate: Date;
  startingBalance: number;
  endingBalance: number;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reconciliation statement interface
 */
export interface ReconciliationStatement {
  id: string;
  sessionId: string;
  accountId: string;
  statementDate: Date;
  startingBalance: number;
  endingBalance: number;
  isReconciled: boolean;
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Net worth data point interface
 */
export interface NetWorthDataPoint {
  id: string;
  date: Date;
  assets: number;
  liabilities: number;
  netWorth: number;
  createdAt: Date;
}

/**
 * Net worth snapshot settings interface
 */
export interface NetWorthSnapshotSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  dayOfMonth?: number;
}

/**
 * Saved trend analysis interface
 */
export interface SavedTrendAnalysis {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'balance';
  timeframe: 'weekly' | 'monthly' | 'yearly';
  filters: any[]; // This is a simplified version
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report template interface
 */
export interface ReportTemplate {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'balance' | 'category' | 'custom';
  config: any; // This is a simplified version
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Saved report interface
 */
export interface SavedReport {
  id: string;
  name: string;
  templateId: string;
  data: any; // This is a simplified version
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bank connection interface
 */
export interface BankConnection {
  id: string;
  institutionId: string;
  status: 'active' | 'pending' | 'error' | 'disconnected';
  lastSynced?: Date;
  credentials?: any; // This should be securely stored
  accounts: string[]; // Array of account IDs
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bank institution interface
 */
export interface BankInstitution {
  id: string;
  name: string;
  logo?: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bank sync session interface
 */
export interface BankSyncSession {
  id: string;
  connectionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  results?: any; // This is a simplified version
  createdAt: Date;
  updatedAt: Date;
} 