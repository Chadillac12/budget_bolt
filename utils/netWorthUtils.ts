import { Account } from '@/types/account';
import { NetWorthDataPoint, NetWorthSnapshotSettings, createNetWorthSnapshot } from '@/types/netWorth';
import { generateUUID } from './storage';

/**
 * Checks if a new automatic snapshot should be created based on settings
 * @param settings The net worth snapshot settings
 * @returns Boolean indicating if a snapshot should be created
 */
export const shouldCreateSnapshot = (settings: NetWorthSnapshotSettings): boolean => {
  if (!settings.enabled) {
    return false;
  }

  const now = new Date();
  const lastSnapshot = settings.lastSnapshotDate ? new Date(settings.lastSnapshotDate) : null;

  // If no previous snapshot, create one
  if (!lastSnapshot) {
    return true;
  }

  switch (settings.frequency) {
    case 'daily':
      // Check if the last snapshot was created on a different day
      return (
        now.getDate() !== lastSnapshot.getDate() ||
        now.getMonth() !== lastSnapshot.getMonth() ||
        now.getFullYear() !== lastSnapshot.getFullYear()
      );

    case 'weekly':
      // Check if it's the configured day of week and at least a week has passed
      const daysSinceLastSnapshot = Math.floor((now.getTime() - lastSnapshot.getTime()) / (1000 * 60 * 60 * 24));
      const isDayOfWeek = settings.dayOfWeek !== undefined ? now.getDay() === settings.dayOfWeek : true;
      return isDayOfWeek && daysSinceLastSnapshot >= 7;

    case 'monthly':
      // Check if it's the configured day of month and at least a month has passed
      const isDayOfMonth = settings.dayOfMonth !== undefined ? now.getDate() === settings.dayOfMonth : true;
      const isNewMonth = 
        now.getMonth() !== lastSnapshot.getMonth() || 
        now.getFullYear() !== lastSnapshot.getFullYear();
      return isDayOfMonth && isNewMonth;

    default:
      return false;
  }
};

/**
 * Creates an automatic net worth snapshot if needed based on settings
 * @param accounts List of all accounts
 * @param settings Net worth snapshot settings
 * @param history Existing net worth history
 * @returns New snapshot if created, null otherwise
 */
export const createAutomaticSnapshotIfNeeded = (
  accounts: Account[],
  settings: NetWorthSnapshotSettings,
  history: NetWorthDataPoint[]
): NetWorthDataPoint | null => {
  if (shouldCreateSnapshot(settings)) {
    const snapshot = createNetWorthSnapshot(accounts, generateUUID());
    
    // Update the last snapshot date in settings
    const updatedSettings: NetWorthSnapshotSettings = {
      ...settings,
      lastSnapshotDate: new Date()
    };
    
    return snapshot;
  }
  
  return null;
};

/**
 * Gets net worth data for a specific time range
 * @param history Complete net worth history
 * @param range Time range in days (e.g., 30 for last 30 days)
 * @returns Filtered history for the specified range
 */
export const getNetWorthHistoryForRange = (
  history: NetWorthDataPoint[],
  range: number
): NetWorthDataPoint[] => {
  const now = new Date();
  const rangeStart = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);
  
  return history
    .filter(dataPoint => new Date(dataPoint.date) >= rangeStart)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Formats net worth data for chart display
 * @param history Net worth history data points
 * @returns Formatted data for charts
 */
export const formatNetWorthDataForChart = (history: NetWorthDataPoint[]) => {
  return history.map(dataPoint => ({
    date: new Date(dataPoint.date).toLocaleDateString(),
    netWorth: dataPoint.netWorth,
    assets: dataPoint.assets,
    liabilities: dataPoint.liabilities
  }));
};

/**
 * Calculates the net worth change over a period
 * @param history Net worth history
 * @returns Object with change amount and percentage
 */
export const calculateNetWorthChange = (history: NetWorthDataPoint[]) => {
  if (history.length < 2) {
    return { amount: 0, percentage: 0 };
  }
  
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const oldest = sortedHistory[0];
  const newest = sortedHistory[sortedHistory.length - 1];
  
  const changeAmount = newest.netWorth - oldest.netWorth;
  const changePercentage = oldest.netWorth !== 0 
    ? (changeAmount / Math.abs(oldest.netWorth)) * 100 
    : 0;
  
  return {
    amount: changeAmount,
    percentage: changePercentage
  };
};