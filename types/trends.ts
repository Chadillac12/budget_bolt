import { TransactionType } from './transaction';

/**
 * Represents a time period for trend analysis
 */
export type TrendTimePeriod = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

/**
 * Represents the type of trend analysis
 */
export type TrendAnalysisType =
  | 'spending-by-category'
  | 'income-vs-expenses'
  | 'budget-vs-actual'
  | 'account-balance'
  | 'net-worth'
  | 'category-distribution';

/**
 * Represents a single data point in a trend analysis
 */
export interface TrendDataPoint {
  id: string;
  date: Date;
  value: number;
  label?: string;
  categoryId?: string;
  accountId?: string;
  transactionType?: TransactionType;
}

/**
 * Represents a series of data points for a specific category, account, or type
 */
export interface TrendSeries {
  id: string;
  name: string;
  color: string;
  data: TrendDataPoint[];
  categoryId?: string;
  accountId?: string;
  transactionType?: TransactionType;
}

/**
 * Represents a complete trend analysis result
 */
export interface TrendAnalysis {
  id: string;
  name: string;
  type: TrendAnalysisType;
  timePeriod: TrendTimePeriod;
  startDate: Date;
  endDate: Date;
  series: TrendSeries[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration for a trend analysis
 */
export interface TrendAnalysisConfig {
  type: TrendAnalysisType;
  timePeriod: TrendTimePeriod;
  startDate: Date;
  endDate: Date;
  includeCategories?: string[]; // Category IDs to include
  excludeCategories?: string[]; // Category IDs to exclude
  includeAccounts?: string[]; // Account IDs to include
  excludeAccounts?: string[]; // Account IDs to exclude
  includeTransactionTypes?: TransactionType[]; // Transaction types to include
  smoothing?: boolean; // Whether to apply smoothing to the data
  smoothingFactor?: number; // Factor for smoothing (0-1)
  compareWithPrevious?: boolean; // Whether to compare with previous period
  showAverage?: boolean; // Whether to show average line
}

/**
 * Represents a saved trend analysis configuration
 */
export interface SavedTrendAnalysis extends TrendAnalysisConfig {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a comparison between two time periods
 */
export interface TrendComparison {
  currentPeriod: TrendAnalysis;
  previousPeriod: TrendAnalysis;
  percentageChange: number;
  absoluteChange: number;
}