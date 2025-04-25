/**
 * Custom Reports Type Definitions
 * 
 * This file contains type definitions for the custom reports feature,
 * including report templates, configurations, and saved reports.
 */

import { Transaction } from './transaction';
import { BudgetCategory } from './budget';
import { Account } from './account';
import { Payee } from './payee';

/**
 * Enum for different report types
 */
export enum ReportType {
  EXPENSE = 'expense',
  INCOME = 'income',
  CATEGORY = 'category',
  PAYEE = 'payee',
  ACCOUNT = 'account',
  BUDGET = 'budget',
  NET_WORTH = 'netWorth',
  CUSTOM = 'custom',
}

/**
 * Enum for different time periods
 */
export enum ReportTimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

/**
 * Enum for different output formats
 */
export enum ReportOutputFormat {
  SCREEN = 'screen',
  PDF = 'pdf',
  CSV = 'csv',
}

/**
 * Enum for different visualization types
 */
export enum ReportVisualizationType {
  TABLE = 'table',
  BAR_CHART = 'barChart',
  LINE_CHART = 'lineChart',
  PIE_CHART = 'pieChart',
  STACKED_BAR = 'stackedBar',
  AREA_CHART = 'areaChart',
}

/**
 * Interface for date range parameters
 */
export interface DateRangeParams {
  startDate: Date;
  endDate: Date;
  timePeriod: ReportTimePeriod;
}

/**
 * Interface for filter parameters
 */
export interface FilterParams {
  categories?: string[];
  accounts?: string[];
  payees?: string[];
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
  includeTransfers?: boolean;
  includeSplitTransactions?: boolean;
}

/**
 * Interface for grouping parameters
 */
export interface GroupingParams {
  groupBy: 'category' | 'payee' | 'account' | 'date' | 'tag' | 'none';
  subGroupBy?: 'category' | 'payee' | 'account' | 'date' | 'tag' | 'none';
  sortBy: 'amount' | 'date' | 'name' | 'count';
  sortDirection: 'asc' | 'desc';
}

/**
 * Interface for visualization parameters
 */
export interface VisualizationParams {
  type: ReportVisualizationType;
  showLegend: boolean;
  showLabels: boolean;
  showValues: boolean;
  colorScheme: 'default' | 'monochrome' | 'colorful' | 'pastel';
}

/**
 * Interface for report configuration
 */
export interface ReportConfig {
  id?: string;
  name: string;
  type: ReportType;
  description?: string;
  dateRange: DateRangeParams;
  filters: FilterParams;
  grouping: GroupingParams;
  visualization: VisualizationParams;
  outputFormat: ReportOutputFormat;
}

/**
 * Interface for report template
 */
export interface ReportTemplate extends ReportConfig {
  id: string;
  isDefault: boolean;
  icon?: string;
}

/**
 * Interface for saved report
 */
export interface SavedReport {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  config: ReportConfig;
  createdAt: Date;
  lastRunAt?: Date;
  isFavorite: boolean;
  scheduleConfig?: ReportScheduleConfig;
}

/**
 * Interface for report schedule configuration
 */
export interface ReportScheduleConfig {
  isScheduled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6, Sunday to Saturday
  dayOfMonth?: number; // 1-31
  time?: string; // HH:MM format
  lastRun?: Date;
  nextRun?: Date;
  recipients?: string[]; // Email addresses
}

/**
 * Interface for report result
 */
export interface ReportResult {
  id: string;
  reportId: string;
  generatedAt: Date;
  config: ReportConfig;
  data: any; // The actual report data, structure depends on report type
  summary: ReportSummary;
}

/**
 * Interface for report summary
 */
export interface ReportSummary {
  totalCount: number;
  totalAmount: number;
  averageAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  startDate: Date;
  endDate: Date;
  topItems?: {name: string, amount: number, percentage: number}[];
}

/**
 * Predefined report templates
 */
export const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-expense-summary',
    name: 'Monthly Expense Summary',
    description: 'Summary of expenses grouped by category for the current month',
    type: ReportType.EXPENSE,
    isDefault: true,
    icon: 'calendar-month',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      timePeriod: ReportTimePeriod.MONTHLY,
    },
    filters: {
      includeTransfers: false,
      includeSplitTransactions: true,
    },
    grouping: {
      groupBy: 'category',
      sortBy: 'amount',
      sortDirection: 'desc',
    },
    visualization: {
      type: ReportVisualizationType.PIE_CHART,
      showLegend: true,
      showLabels: true,
      showValues: true,
      colorScheme: 'default',
    },
    outputFormat: ReportOutputFormat.SCREEN,
  },
  {
    id: 'income-vs-expenses',
    name: 'Income vs. Expenses',
    description: 'Comparison of income and expenses over time',
    type: ReportType.CUSTOM,
    isDefault: true,
    icon: 'chart-line',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
      endDate: new Date(),
      timePeriod: ReportTimePeriod.MONTHLY,
    },
    filters: {
      includeTransfers: false,
      includeSplitTransactions: true,
    },
    grouping: {
      groupBy: 'date',
      sortBy: 'date',
      sortDirection: 'asc',
    },
    visualization: {
      type: ReportVisualizationType.BAR_CHART,
      showLegend: true,
      showLabels: true,
      showValues: true,
      colorScheme: 'default',
    },
    outputFormat: ReportOutputFormat.SCREEN,
  },
  {
    id: 'category-spending',
    name: 'Category Spending',
    description: 'Analyse spending distribution across different categories.',
    type: ReportType.CATEGORY,
    isDefault: true,
    icon: 'chart-pie',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1),
      endDate: new Date(),
      timePeriod: ReportTimePeriod.MONTHLY,
    },
    filters: {
      includeTransfers: false,
      includeSplitTransactions: true,
    },
    grouping: {
      groupBy: 'category',
      subGroupBy: 'date',
      sortBy: 'amount',
      sortDirection: 'desc',
    },
    visualization: {
      type: ReportVisualizationType.STACKED_BAR,
      showLegend: true,
      showLabels: true,
      showValues: true,
      colorScheme: 'colorful',
    },
    outputFormat: ReportOutputFormat.SCREEN,
  },
  {
    id: 'payee-analysis',
    name: 'Payee Analysis',
    description: 'Understand spending patterns associated with specific payees.',
    type: ReportType.PAYEE,
    isDefault: true,
    icon: 'account-group',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
      endDate: new Date(),
      timePeriod: ReportTimePeriod.MONTHLY,
    },
    filters: {
      includeTransfers: false,
      includeSplitTransactions: true,
    },
    grouping: {
      groupBy: 'payee',
      sortBy: 'amount',
      sortDirection: 'desc',
    },
    visualization: {
      type: ReportVisualizationType.TABLE,
      showLegend: false,
      showLabels: true,
      showValues: true,
      colorScheme: 'default',
    },
    outputFormat: ReportOutputFormat.SCREEN,
  },
  {
    id: 'budget-performance',
    name: 'Budget Performance',
    description: 'Comparison of budgeted vs. actual spending by category',
    type: ReportType.BUDGET,
    isDefault: true,
    icon: 'bullseye',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      timePeriod: ReportTimePeriod.MONTHLY,
    },
    filters: {},
    grouping: {
      groupBy: 'category',
      sortBy: 'amount',
      sortDirection: 'desc',
    },
    visualization: {
      type: ReportVisualizationType.BAR_CHART,
      showLegend: true,
      showLabels: true,
      showValues: true,
      colorScheme: 'default',
    },
    outputFormat: ReportOutputFormat.SCREEN,
  },
];