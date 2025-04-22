/**
 * Report Utilities
 * 
 * This file contains utility functions for generating and managing custom reports.
 */

import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { Transaction } from '../types/transaction';
import { BudgetCategory } from '../types/budget';
import { Account } from '../types/account';
import { Payee } from '../types/payee';
import { 
  ReportType, 
  ReportConfig, 
  ReportResult, 
  ReportSummary,
  ReportTimePeriod,
  DateRangeParams,
  FilterParams,
  GroupingParams,
  VisualizationParams,
  ReportTemplate,
  SavedReport,
  DEFAULT_REPORT_TEMPLATES
} from '../types/reports';
import { getData, storeData, generateUUID } from './storage';

// Function to get all transactions
const getTransactions = async (): Promise<Transaction[]> => {
  const transactions = await getData('budget_tracker_transactions') || [];
  return transactions;
};

/**
 * Generate a report based on the provided configuration
 * @param config The report configuration
 * @returns The generated report result
 */
export const generateReport = async (config: ReportConfig): Promise<ReportResult> => {
  // Get transactions based on date range and filters
  const transactions = await getFilteredTransactions(config.dateRange, config.filters);
  
  // Process data based on report type
  let data;
  switch (config.type) {
    case ReportType.EXPENSE:
      data = processExpenseReport(transactions, config);
      break;
    case ReportType.INCOME:
      data = processIncomeReport(transactions, config);
      break;
    case ReportType.CATEGORY:
      data = processCategoryReport(transactions, config);
      break;
    case ReportType.PAYEE:
      data = processPayeeReport(transactions, config);
      break;
    case ReportType.ACCOUNT:
      data = processAccountReport(transactions, config);
      break;
    case ReportType.BUDGET:
      data = processBudgetReport(transactions, config);
      break;
    case ReportType.NET_WORTH:
      data = processNetWorthReport(transactions, config);
      break;
    case ReportType.CUSTOM:
      data = processCustomReport(transactions, config);
      break;
    default:
      data = transactions;
  }
  
  // Generate summary
  const summary = generateReportSummary(data, config);
  
  // Return report result
  return {
    id: generateReportId(),
    reportId: config.id || 'temp-report',
    generatedAt: new Date(),
    config,
    data,
    summary
  };
};

/**
 * Get filtered transactions based on date range and filters
 * @param dateRange The date range parameters
 * @param filters The filter parameters
 * @returns Filtered transactions
 */
export const getFilteredTransactions = async (
  dateRange: DateRangeParams, 
  filters: FilterParams
): Promise<Transaction[]> => {
  // Get all transactions
  const allTransactions = await getTransactions();
  
  // Filter by date range
  const startDate = startOfDay(dateRange.startDate);
  const endDate = endOfDay(dateRange.endDate);
  
  let filteredTransactions = allTransactions.filter((transaction: Transaction) => {
    const transactionDate = new Date(transaction.date);
    return isWithinInterval(transactionDate, { start: startDate, end: endDate });
  });
  
  // Apply additional filters
  if (filters) {
    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        transaction.categoryId && filters.categories?.includes(transaction.categoryId)
      );
    }
    
    // Filter by accounts
    if (filters.accounts && filters.accounts.length > 0) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        filters.accounts?.includes(transaction.accountId)
      );
    }
    
    // Filter by payees
    if (filters.payees && filters.payees.length > 0) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        transaction.payeeId && filters.payees?.includes(transaction.payeeId)
      );
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        transaction.tags && transaction.tags.some((tag: string) => filters.tags?.includes(tag))
      );
    }
    
    // Filter by amount range
    if (filters.minAmount !== undefined) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        Math.abs(transaction.amount) >= (filters.minAmount || 0)
      );
    }
    
    if (filters.maxAmount !== undefined) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        Math.abs(transaction.amount) <= (filters.maxAmount || Infinity)
      );
    }
    
    // Filter transfers
    if (filters.includeTransfers === false) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        transaction.type !== 'transfer'
      );
    }
    
    // Filter split transactions
    if (filters.includeSplitTransactions === false) {
      filteredTransactions = filteredTransactions.filter((transaction: Transaction) =>
        !transaction.isSplit
      );
    }
  }
  
  return filteredTransactions;
};

/**
 * Process expense report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processExpenseReport = (transactions: Transaction[], config: ReportConfig): any => {
  // Filter to only include expenses (negative amounts)
  const expenses = transactions.filter(transaction => transaction.amount < 0);
  
  // Group and process data based on grouping parameters
  return groupAndProcessData(expenses, config.grouping);
};

/**
 * Process income report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processIncomeReport = (transactions: Transaction[], config: ReportConfig): any => {
  // Filter to only include income (positive amounts)
  const income = transactions.filter(transaction => transaction.amount > 0);
  
  // Group and process data based on grouping parameters
  return groupAndProcessData(income, config.grouping);
};

/**
 * Process category report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processCategoryReport = (transactions: Transaction[], config: ReportConfig): any => {
  // Group and process data based on grouping parameters
  return groupAndProcessData(transactions, { ...config.grouping, groupBy: 'category' });
};

/**
 * Process payee report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processPayeeReport = (transactions: Transaction[], config: ReportConfig): any => {
  // Group and process data based on grouping parameters
  return groupAndProcessData(transactions, { ...config.grouping, groupBy: 'payee' });
};

/**
 * Process account report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processAccountReport = (transactions: Transaction[], config: ReportConfig): any => {
  // Group and process data based on grouping parameters
  return groupAndProcessData(transactions, { ...config.grouping, groupBy: 'account' });
};

/**
 * Process budget report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processBudgetReport = (transactions: Transaction[], config: ReportConfig): any => {
  // This would require additional budget data to compare actual vs budgeted
  // For now, we'll just group by category
  return groupAndProcessData(transactions, { ...config.grouping, groupBy: 'category' });
};

/**
 * Process net worth report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processNetWorthReport = (transactions: Transaction[], config: ReportConfig): any => {
  // This would require additional account data to calculate net worth over time
  // For now, we'll just group by date
  return groupAndProcessData(transactions, { ...config.grouping, groupBy: 'date' });
};

/**
 * Process custom report data
 * @param transactions Filtered transactions
 * @param config Report configuration
 * @returns Processed report data
 */
const processCustomReport = (transactions: Transaction[], config: ReportConfig): any => {
  // Process based on the specific custom report configuration
  // For now, we'll just use the provided grouping
  return groupAndProcessData(transactions, config.grouping);
};

/**
 * Group and process data based on grouping parameters
 * @param transactions Filtered transactions
 * @param grouping Grouping parameters
 * @returns Grouped and processed data
 */
const groupAndProcessData = (transactions: Transaction[], grouping: GroupingParams): any => {
  const { groupBy, subGroupBy, sortBy, sortDirection } = grouping;
  
  // Group data
  const groupedData: Record<string, any> = {};
  
  transactions.forEach(transaction => {
    let groupKey = '';
    
    // Determine group key based on groupBy parameter
    switch (groupBy) {
      case 'category':
        groupKey = transaction.categoryId || 'Uncategorized';
        break;
      case 'payee':
        groupKey = transaction.payeeId || 'Unknown Payee';
        break;
      case 'account':
        groupKey = transaction.accountId;
        break;
      case 'date':
        groupKey = format(new Date(transaction.date), 'yyyy-MM-dd');
        break;
      case 'tag':
        // If grouping by tag, we might have multiple tags per transaction
        if (transaction.tags && transaction.tags.length > 0) {
          transaction.tags.forEach(tag => {
            if (!groupedData[tag]) {
              groupedData[tag] = {
                transactions: [],
                totalAmount: 0,
                count: 0,
                subGroups: {}
              };
            }
            
            groupedData[tag].transactions.push(transaction);
            groupedData[tag].totalAmount += transaction.amount;
            groupedData[tag].count += 1;
            
            // Handle subgrouping if needed
            if (subGroupBy && subGroupBy !== 'none') {
              processSubGroup(groupedData[tag], transaction, subGroupBy);
            }
          });
          return; // Skip the rest of the loop for this transaction
        } else {
          groupKey = 'No Tags';
        }
        break;
      default:
        groupKey = 'All Transactions';
    }
    
    // Initialize group if it doesn't exist
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        transactions: [],
        totalAmount: 0,
        count: 0,
        subGroups: {}
      };
    }
    
    // Add transaction to group
    groupedData[groupKey].transactions.push(transaction);
    groupedData[groupKey].totalAmount += transaction.amount;
    groupedData[groupKey].count += 1;
    
    // Handle subgrouping if needed
    if (subGroupBy && subGroupBy !== 'none') {
      processSubGroup(groupedData[groupKey], transaction, subGroupBy);
    }
  });
  
  // Convert to array for sorting
  const result = Object.entries(groupedData).map(([key, value]) => ({
    name: key,
    ...value
  }));
  
  // Sort data
  result.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'amount':
        comparison = Math.abs(a.totalAmount) - Math.abs(b.totalAmount);
        break;
      case 'date':
        if (a.transactions.length > 0 && b.transactions.length > 0) {
          comparison = new Date(a.transactions[0].date).getTime() - new Date(b.transactions[0].date).getTime();
        }
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'count':
        comparison = a.count - b.count;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return result;
};

/**
 * Process subgroup for a transaction
 * @param group The parent group
 * @param transaction The transaction to process
 * @param subGroupBy The subgrouping parameter
 */
const processSubGroup = (group: any, transaction: Transaction, subGroupBy: string): void => {
  let subGroupKey = '';
  
  // Determine subgroup key based on subGroupBy parameter
  switch (subGroupBy) {
    case 'category':
      subGroupKey = transaction.categoryId || 'Uncategorized';
      break;
    case 'payee':
      subGroupKey = transaction.payeeId || 'Unknown Payee';
      break;
    case 'account':
      subGroupKey = transaction.accountId;
      break;
    case 'date':
      subGroupKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      break;
    case 'tag':
      // If subgrouping by tag, we might have multiple tags per transaction
      if (transaction.tags && transaction.tags.length > 0) {
        transaction.tags.forEach(tag => {
          if (!group.subGroups[tag]) {
            group.subGroups[tag] = {
              transactions: [],
              totalAmount: 0,
              count: 0
            };
          }
          
          group.subGroups[tag].transactions.push(transaction);
          group.subGroups[tag].totalAmount += transaction.amount;
          group.subGroups[tag].count += 1;
        });
        return; // Skip the rest of the function
      } else {
        subGroupKey = 'No Tags';
      }
      break;
    default:
      return; // No subgrouping
  }
  
  // Initialize subgroup if it doesn't exist
  if (!group.subGroups[subGroupKey]) {
    group.subGroups[subGroupKey] = {
      transactions: [],
      totalAmount: 0,
      count: 0
    };
  }
  
  // Add transaction to subgroup
  group.subGroups[subGroupKey].transactions.push(transaction);
  group.subGroups[subGroupKey].totalAmount += transaction.amount;
  group.subGroups[subGroupKey].count += 1;
};

/**
 * Generate report summary
 * @param data Processed report data
 * @param config Report configuration
 * @returns Report summary
 */
const generateReportSummary = (data: any[], config: ReportConfig): ReportSummary => {
  // Calculate total amount and count
  let totalAmount = 0;
  let totalCount = 0;
  let minAmount = Infinity;
  let maxAmount = -Infinity;
  
  data.forEach(group => {
    totalAmount += group.totalAmount;
    totalCount += group.count;
    
    if (Math.abs(group.totalAmount) < minAmount) {
      minAmount = Math.abs(group.totalAmount);
    }
    
    if (Math.abs(group.totalAmount) > maxAmount) {
      maxAmount = Math.abs(group.totalAmount);
    }
  });
  
  // Calculate average amount
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
  
  // Get top items (up to 5)
  const topItems = data.slice(0, 5).map(group => ({
    name: group.name,
    amount: group.totalAmount,
    percentage: totalAmount !== 0 ? (group.totalAmount / totalAmount) * 100 : 0
  }));
  
  return {
    totalCount,
    totalAmount,
    averageAmount,
    minAmount: minAmount !== Infinity ? minAmount : undefined,
    maxAmount: maxAmount !== -Infinity ? maxAmount : undefined,
    startDate: config.dateRange.startDate,
    endDate: config.dateRange.endDate,
    topItems
  };
};

/**
 * Generate a unique report ID
 * @returns A unique report ID
 */
const generateReportId = (): string => {
  return `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Get date range for a time period
 * @param timePeriod The time period
 * @param referenceDate The reference date (defaults to today)
 * @returns The date range
 */
export const getDateRangeForTimePeriod = (
  timePeriod: ReportTimePeriod, 
  referenceDate: Date = new Date()
): { startDate: Date, endDate: Date } => {
  switch (timePeriod) {
    case ReportTimePeriod.DAILY:
      return {
        startDate: startOfDay(referenceDate),
        endDate: endOfDay(referenceDate)
      };
    case ReportTimePeriod.WEEKLY:
      return {
        startDate: startOfWeek(referenceDate, { weekStartsOn: 0 }),
        endDate: endOfWeek(referenceDate, { weekStartsOn: 0 })
      };
    case ReportTimePeriod.MONTHLY:
      return {
        startDate: startOfMonth(referenceDate),
        endDate: endOfMonth(referenceDate)
      };
    case ReportTimePeriod.QUARTERLY:
      return {
        startDate: startOfQuarter(referenceDate),
        endDate: endOfQuarter(referenceDate)
      };
    case ReportTimePeriod.YEARLY:
      return {
        startDate: startOfYear(referenceDate),
        endDate: endOfYear(referenceDate)
      };
    default:
      return {
        startDate: startOfMonth(referenceDate),
        endDate: endOfMonth(referenceDate)
      };
  }
};

/**
 * Format date range for display
 * @param startDate The start date
 * @param endDate The end date
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = format(startDate, 'MMM d, yyyy');
  const end = format(endDate, 'MMM d, yyyy');
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
};

/**
 * Get default report templates
 * @returns Array of default report templates
 */
export const getDefaultReportTemplates = (): ReportTemplate[] => {
  return DEFAULT_REPORT_TEMPLATES;
};

/**
 * Create a new report from a template
 * @param template The report template
 * @param name Optional name for the new report
 * @returns A new report configuration
 */
export const createReportFromTemplate = (
  template: ReportTemplate, 
  name?: string
): ReportConfig => {
  return {
    ...template,
    id: undefined, // Remove template ID
    name: name || template.name,
  };
};

/**
 * Save a report
 * @param config The report configuration
 * @param name Optional name for the saved report
 * @param description Optional description for the saved report
 * @returns A new saved report
 */
export const saveReport = (
  config: ReportConfig, 
  name?: string, 
  description?: string
): SavedReport => {
  return {
    id: generateReportId(),
    templateId: config.id || 'custom',
    name: name || config.name,
    description: description || config.description,
    config,
    createdAt: new Date(),
    isFavorite: false
  };
};