import { Account } from './account';

/**
 * Represents a single data point in the net worth history
 */
export interface NetWorthDataPoint {
  id: string;
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
  accountSnapshots: AccountSnapshot[];
  createdAt: Date;
}

/**
 * Represents a snapshot of an account's balance at a specific point in time
 */
export interface AccountSnapshot {
  accountId: string;
  accountName: string;
  accountType: string;
  classification: 'asset' | 'liability';
  balance: number;
}

/**
 * Settings for automatic net worth snapshot creation
 */
export interface NetWorthSnapshotSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  dayOfWeek?: number; // 0-6, Sunday to Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  lastSnapshotDate?: Date; // Date of the last automatic snapshot
}

/**
 * Calculates the current net worth based on accounts
 * @param accounts List of all accounts
 * @returns NetWorthSummary object with calculated values
 */
export const calculateNetWorth = (accounts: Account[]) => {
  // Filter out accounts that are excluded from net worth
  const includedAccounts = accounts.filter(account => 
    !account.excludeFromNetWorth && !account.isArchived
  );
  
  // Separate assets and liabilities
  const assetAccounts = includedAccounts.filter(account => 
    account.classification === 'asset'
  );
  
  const liabilityAccounts = includedAccounts.filter(account => 
    account.classification === 'liability'
  );
  
  // Calculate totals
  const totalAssets = assetAccounts.reduce(
    (sum, account) => sum + account.balance, 
    0
  );
  
  const totalLiabilities = liabilityAccounts.reduce(
    (sum, account) => sum + account.balance, 
    0
  );
  
  // Calculate net worth (assets - liabilities)
  const netWorth = totalAssets - totalLiabilities;
  
  // Get excluded accounts
  const excludedAccounts = accounts.filter(account => 
    account.excludeFromNetWorth && !account.isArchived
  );
  
  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assetAccounts,
    liabilityAccounts,
    excludedAccounts
  };
};

/**
 * Creates a net worth snapshot from the current account data
 * @param accounts List of all accounts
 * @returns NetWorthDataPoint representing the current snapshot
 */
export const createNetWorthSnapshot = (
  accounts: Account[],
  id: string,
  date: Date = new Date()
): NetWorthDataPoint => {
  // Calculate net worth
  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts);
  
  // Create account snapshots
  const accountSnapshots: AccountSnapshot[] = accounts
    .filter(account => !account.excludeFromNetWorth && !account.isArchived)
    .map(account => ({
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      classification: account.classification,
      balance: account.balance
    }));
  
  // Create the data point
  return {
    id,
    date,
    netWorth,
    assets: totalAssets,
    liabilities: totalLiabilities,
    accountSnapshots,
    createdAt: new Date()
  };
};