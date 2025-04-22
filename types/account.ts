export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'loan'
  | 'cash'
  | 'other';

// Classification of accounts for net worth calculations
export type AccountClassification = 'asset' | 'liability';

// Default classification mapping based on account type
export const DEFAULT_ACCOUNT_CLASSIFICATIONS: Record<AccountType, AccountClassification> = {
  checking: 'asset',
  savings: 'asset',
  investment: 'asset',
  cash: 'asset',
  credit: 'liability',
  loan: 'liability',
  other: 'asset'
};

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isHidden: boolean;
  isArchived: boolean;
  lastReconciled?: Date; // Date of last successful reconciliation
  classification: AccountClassification; // Asset or liability classification
  excludeFromNetWorth: boolean; // Whether to exclude from net worth calculations
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

// Net worth summary interface
export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetAccounts: Account[];
  liabilityAccounts: Account[];
  excludedAccounts: Account[];
}