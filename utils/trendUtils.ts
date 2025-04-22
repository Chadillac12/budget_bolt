import { Transaction, TransactionType, TransactionCategory } from '@/types/transaction';
import { Budget, BudgetCategory } from '@/types/budget';
import { Account } from '@/types/account';
import { NetWorthDataPoint } from '@/types/netWorth';
import {
  TrendAnalysis,
  TrendAnalysisConfig,
  TrendAnalysisType,
  TrendDataPoint,
  TrendSeries,
  TrendTimePeriod,
  TrendComparison
} from '@/types/trends';

/**
 * Generate a unique ID for trend data
 */
export const generateTrendId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Group transactions by date according to the specified time period
 * @param transactions Transactions to group
 * @param timePeriod Time period to group by
 * @returns Transactions grouped by date
 */
export const groupTransactionsByDate = (
  transactions: Transaction[],
  timePeriod: TrendTimePeriod
): Record<string, Transaction[]> => {
  const groupedTransactions: Record<string, Transaction[]> = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    let key: string;

    switch (timePeriod) {
      case 'daily':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        // Get the first day of the week (Sunday)
        const firstDayOfWeek = new Date(date);
        const day = date.getDay();
        firstDayOfWeek.setDate(date.getDate() - day);
        key = firstDayOfWeek.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!groupedTransactions[key]) {
      groupedTransactions[key] = [];
    }
    groupedTransactions[key].push(transaction);
  });

  return groupedTransactions;
};

/**
 * Filter transactions based on the trend analysis configuration
 * @param transactions All transactions
 * @param config Trend analysis configuration
 * @returns Filtered transactions
 */
export const filterTransactions = (
  transactions: Transaction[],
  config: TrendAnalysisConfig
): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    
    // Filter by date range
    if (transactionDate < config.startDate || transactionDate > config.endDate) {
      return false;
    }

    // Filter by transaction type
    if (
      config.includeTransactionTypes &&
      config.includeTransactionTypes.length > 0 &&
      !config.includeTransactionTypes.includes(transaction.type)
    ) {
      return false;
    }

    // Filter by category
    if (
      config.includeCategories &&
      config.includeCategories.length > 0 &&
      !config.includeCategories.includes(transaction.categoryId)
    ) {
      return false;
    }

    if (
      config.excludeCategories &&
      config.excludeCategories.length > 0 &&
      config.excludeCategories.includes(transaction.categoryId)
    ) {
      return false;
    }

    // Filter by account
    if (
      config.includeAccounts &&
      config.includeAccounts.length > 0 &&
      !config.includeAccounts.includes(transaction.accountId)
    ) {
      return false;
    }

    if (
      config.excludeAccounts &&
      config.excludeAccounts.length > 0 &&
      config.excludeAccounts.includes(transaction.accountId)
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Generate trend data points for spending by category
 * @param transactions Filtered transactions
 * @param categories Transaction categories
 * @param config Trend analysis configuration
 * @returns Trend series for each category
 */
export const generateSpendingByCategoryTrend = (
  transactions: Transaction[],
  categories: TransactionCategory[],
  config: TrendAnalysisConfig
): TrendSeries[] => {
  const groupedTransactions = groupTransactionsByDate(transactions, config.timePeriod);
  const categoryMap = new Map<string, TrendSeries>();

  // Initialize series for each category
  categories.forEach(category => {
    if (
      (config.includeCategories && config.includeCategories.length > 0 && !config.includeCategories.includes(category.id)) ||
      (config.excludeCategories && config.excludeCategories.includes(category.id))
    ) {
      return;
    }

    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      color: category.color,
      data: [],
      categoryId: category.id
    });
  });

  // Process transactions for each time period
  Object.entries(groupedTransactions).forEach(([dateKey, dateTransactions]) => {
    // Group transactions by category
    const categoryTotals = new Map<string, number>();

    dateTransactions.forEach(transaction => {
      if (transaction.isSplit && transaction.splits) {
        // Handle split transactions
        transaction.splits.forEach(split => {
          if (!categoryTotals.has(split.categoryId)) {
            categoryTotals.set(split.categoryId, 0);
          }
          categoryTotals.set(
            split.categoryId,
            categoryTotals.get(split.categoryId)! + Math.abs(split.amount)
          );
        });
      } else {
        // Handle regular transactions
        if (!categoryTotals.has(transaction.categoryId)) {
          categoryTotals.set(transaction.categoryId, 0);
        }
        categoryTotals.set(
          transaction.categoryId,
          categoryTotals.get(transaction.categoryId)! + Math.abs(transaction.amount)
        );
      }
    });

    // Create data points for each category
    categoryTotals.forEach((total, categoryId) => {
      if (categoryMap.has(categoryId)) {
        const series = categoryMap.get(categoryId)!;
        const date = parseDate(dateKey, config.timePeriod);
        
        series.data.push({
          id: generateTrendId(),
          date,
          value: total,
          categoryId
        });
      }
    });
  });

  // Apply smoothing if enabled
  if (config.smoothing && config.smoothingFactor) {
    categoryMap.forEach(series => {
      series.data = applySmoothing(series.data, config.smoothingFactor!);
    });
  }

  return Array.from(categoryMap.values());
};

/**
 * Generate trend data points for income vs expenses
 * @param transactions Filtered transactions
 * @param config Trend analysis configuration
 * @returns Trend series for income and expenses
 */
export const generateIncomeVsExpensesTrend = (
  transactions: Transaction[],
  config: TrendAnalysisConfig
): TrendSeries[] => {
  const groupedTransactions = groupTransactionsByDate(transactions, config.timePeriod);
  
  // Initialize series for income and expenses
  const incomeSeries: TrendSeries = {
    id: 'income',
    name: 'Income',
    color: '#4CAF50', // Green
    data: [],
    transactionType: 'income'
  };

  const expensesSeries: TrendSeries = {
    id: 'expenses',
    name: 'Expenses',
    color: '#F44336', // Red
    data: [],
    transactionType: 'expense'
  };

  // Process transactions for each time period
  Object.entries(groupedTransactions).forEach(([dateKey, dateTransactions]) => {
    let incomeTotal = 0;
    let expensesTotal = 0;

    dateTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        incomeTotal += transaction.amount;
      } else if (transaction.type === 'expense') {
        expensesTotal += Math.abs(transaction.amount);
      }
    });

    const date = parseDate(dateKey, config.timePeriod);

    // Add data points
    incomeSeries.data.push({
      id: generateTrendId(),
      date,
      value: incomeTotal,
      transactionType: 'income'
    });

    expensesSeries.data.push({
      id: generateTrendId(),
      date,
      value: expensesTotal,
      transactionType: 'expense'
    });
  });

  // Apply smoothing if enabled
  if (config.smoothing && config.smoothingFactor) {
    incomeSeries.data = applySmoothing(incomeSeries.data, config.smoothingFactor);
    expensesSeries.data = applySmoothing(expensesSeries.data, config.smoothingFactor);
  }

  return [incomeSeries, expensesSeries];
};

/**
 * Generate trend data points for budget vs actual spending
 * @param transactions Filtered transactions
 * @param budgets Budgets for the period
 * @param config Trend analysis configuration
 * @returns Trend series for budget and actual spending
 */
export const generateBudgetVsActualTrend = (
  transactions: Transaction[],
  budgets: Budget[],
  config: TrendAnalysisConfig
): TrendSeries[] => {
  const groupedTransactions = groupTransactionsByDate(transactions, config.timePeriod);
  
  // Initialize series for budget and actual
  const budgetSeries: TrendSeries = {
    id: 'budget',
    name: 'Budget',
    color: '#2196F3', // Blue
    data: []
  };

  const actualSeries: TrendSeries = {
    id: 'actual',
    name: 'Actual',
    color: '#FF9800', // Orange
    data: []
  };

  // Process transactions for each time period
  Object.entries(groupedTransactions).forEach(([dateKey, dateTransactions]) => {
    const date = parseDate(dateKey, config.timePeriod);
    
    // Find the budget for this period
    const budget = findBudgetForDate(budgets, date);
    let budgetTotal = 0;
    let actualTotal = 0;

    if (budget) {
      // Calculate budget total
      budget.categories.forEach(category => {
        if ('allocated' in category) {
          budgetTotal += (category as BudgetCategory).allocated;
        }
      });
    }

    // Calculate actual spending
    dateTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        actualTotal += Math.abs(transaction.amount);
      }
    });

    // Add data points
    budgetSeries.data.push({
      id: generateTrendId(),
      date,
      value: budgetTotal
    });

    actualSeries.data.push({
      id: generateTrendId(),
      date,
      value: actualTotal
    });
  });

  // Apply smoothing if enabled
  if (config.smoothing && config.smoothingFactor) {
    budgetSeries.data = applySmoothing(budgetSeries.data, config.smoothingFactor);
    actualSeries.data = applySmoothing(actualSeries.data, config.smoothingFactor);
  }

  return [budgetSeries, actualSeries];
};

/**
 * Generate trend data points for account balances
 * @param transactions Filtered transactions
 * @param accounts Accounts to include
 * @param config Trend analysis configuration
 * @returns Trend series for each account
 */
export const generateAccountBalanceTrend = (
  transactions: Transaction[],
  accounts: Account[],
  config: TrendAnalysisConfig
): TrendSeries[] => {
  const accountMap = new Map<string, TrendSeries>();
  
  // Initialize series for each account
  accounts.forEach(account => {
    if (
      (config.includeAccounts && config.includeAccounts.length > 0 && !config.includeAccounts.includes(account.id)) ||
      (config.excludeAccounts && config.excludeAccounts.includes(account.id))
    ) {
      return;
    }

    accountMap.set(account.id, {
      id: account.id,
      name: account.name,
      color: account.color || '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color if not specified
      data: [],
      accountId: account.id
    });
  });

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate running balances
  const accountBalances = new Map<string, number>();
  accounts.forEach(account => {
    accountBalances.set(account.id, account.balance || 0);
  });

  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(sortedTransactions, config.timePeriod);
  
  // Process transactions for each time period
  const dateKeys = Object.keys(groupedTransactions).sort();
  dateKeys.forEach(dateKey => {
    const dateTransactions = groupedTransactions[dateKey];
    const date = parseDate(dateKey, config.timePeriod);
    
    // Update account balances
    dateTransactions.forEach(transaction => {
      const accountId = transaction.accountId;
      if (accountBalances.has(accountId)) {
        let currentBalance = accountBalances.get(accountId)!;
        
        if (transaction.type === 'income') {
          currentBalance += transaction.amount;
        } else if (transaction.type === 'expense') {
          currentBalance -= Math.abs(transaction.amount);
        } else if (transaction.type === 'transfer') {
          // For transfers, we'd need to know the destination account
          // This is simplified and would need to be expanded
          currentBalance -= Math.abs(transaction.amount);
        }
        
        accountBalances.set(accountId, currentBalance);
      }
    });
    
    // Create data points for each account
    accountBalances.forEach((balance, accountId) => {
      if (accountMap.has(accountId)) {
        const series = accountMap.get(accountId)!;
        
        series.data.push({
          id: generateTrendId(),
          date,
          value: balance,
          accountId
        });
      }
    });
  });

  // Apply smoothing if enabled
  if (config.smoothing && config.smoothingFactor) {
    accountMap.forEach(series => {
      series.data = applySmoothing(series.data, config.smoothingFactor!);
    });
  }

  return Array.from(accountMap.values());
};

/**
 * Generate trend data points for net worth over time
 * @param netWorthHistory Net worth data points
 * @param config Trend analysis configuration
 * @returns Trend series for net worth
 */
export const generateNetWorthTrend = (
  netWorthHistory: NetWorthDataPoint[],
  config: TrendAnalysisConfig
): TrendSeries[] => {
  // Filter net worth data points by date range
  const filteredDataPoints = netWorthHistory.filter(dataPoint => {
    const date = new Date(dataPoint.date);
    return date >= config.startDate && date <= config.endDate;
  });

  // Sort by date
  const sortedDataPoints = [...filteredDataPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Create net worth series
  const netWorthSeries: TrendSeries = {
    id: 'net-worth',
    name: 'Net Worth',
    color: '#9C27B0', // Purple
    data: sortedDataPoints.map(dataPoint => ({
      id: generateTrendId(),
      date: new Date(dataPoint.date),
      value: dataPoint.netWorth
    }))
  };

  // Apply smoothing if enabled
  if (config.smoothing && config.smoothingFactor) {
    netWorthSeries.data = applySmoothing(netWorthSeries.data, config.smoothingFactor);
  }

  return [netWorthSeries];
};

/**
 * Generate trend data for category distribution (pie chart data)
 * @param transactions Filtered transactions
 * @param categories Transaction categories
 * @param config Trend analysis configuration
 * @returns Trend series for category distribution
 */
export const generateCategoryDistributionTrend = (
  transactions: Transaction[],
  categories: TransactionCategory[],
  config: TrendAnalysisConfig
): TrendSeries[] => {
  const categoryTotals = new Map<string, number>();
  
  // Calculate total for each category
  transactions.forEach(transaction => {
    if (transaction.isSplit && transaction.splits) {
      // Handle split transactions
      transaction.splits.forEach(split => {
        if (!categoryTotals.has(split.categoryId)) {
          categoryTotals.set(split.categoryId, 0);
        }
        categoryTotals.set(
          split.categoryId,
          categoryTotals.get(split.categoryId)! + Math.abs(split.amount)
        );
      });
    } else {
      // Handle regular transactions
      if (!categoryTotals.has(transaction.categoryId)) {
        categoryTotals.set(transaction.categoryId, 0);
      }
      categoryTotals.set(
        transaction.categoryId,
        categoryTotals.get(transaction.categoryId)! + Math.abs(transaction.amount)
      );
    }
  });

  // Create a single series with data points for each category
  const distributionSeries: TrendSeries = {
    id: 'category-distribution',
    name: 'Category Distribution',
    color: '#FFFFFF', // Not used for pie charts
    data: []
  };

  // Add data points for each category
  categories.forEach(category => {
    if (categoryTotals.has(category.id)) {
      distributionSeries.data.push({
        id: generateTrendId(),
        date: new Date(), // Not relevant for distribution
        value: categoryTotals.get(category.id)!,
        label: category.name,
        categoryId: category.id
      });
    }
  });

  return [distributionSeries];
};

/**
 * Generate a complete trend analysis based on the configuration
 * @param config Trend analysis configuration
 * @param transactions All transactions
 * @param categories All categories
 * @param accounts All accounts
 * @param budgets All budgets
 * @param netWorthHistory Net worth history
 * @returns Complete trend analysis
 */
export const generateTrendAnalysis = (
  config: TrendAnalysisConfig,
  transactions: Transaction[],
  categories: TransactionCategory[],
  accounts: Account[],
  budgets: Budget[],
  netWorthHistory: NetWorthDataPoint[]
): TrendAnalysis => {
  // Filter transactions based on config
  const filteredTransactions = filterTransactions(transactions, config);
  
  // Generate series based on trend type
  let series: TrendSeries[] = [];
  
  switch (config.type) {
    case 'spending-by-category':
      series = generateSpendingByCategoryTrend(filteredTransactions, categories, config);
      break;
    case 'income-vs-expenses':
      series = generateIncomeVsExpensesTrend(filteredTransactions, config);
      break;
    case 'budget-vs-actual':
      series = generateBudgetVsActualTrend(filteredTransactions, budgets, config);
      break;
    case 'account-balance':
      series = generateAccountBalanceTrend(filteredTransactions, accounts, config);
      break;
    case 'net-worth':
      series = generateNetWorthTrend(netWorthHistory, config);
      break;
    case 'category-distribution':
      series = generateCategoryDistributionTrend(filteredTransactions, categories, config);
      break;
  }

  // Create the trend analysis
  return {
    id: generateTrendId(),
    name: getTrendName(config),
    type: config.type,
    timePeriod: config.timePeriod,
    startDate: config.startDate,
    endDate: config.endDate,
    series,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Generate a comparison between two time periods
 * @param currentPeriod Current period trend analysis
 * @param previousPeriod Previous period trend analysis
 * @returns Trend comparison
 */
export const generateTrendComparison = (
  currentPeriod: TrendAnalysis,
  previousPeriod: TrendAnalysis
): TrendComparison => {
  // Calculate total values for both periods
  const currentTotal = calculateTotalForAnalysis(currentPeriod);
  const previousTotal = calculateTotalForAnalysis(previousPeriod);
  
  // Calculate changes
  const absoluteChange = currentTotal - previousTotal;
  const percentageChange = previousTotal !== 0 
    ? (absoluteChange / previousTotal) * 100 
    : 0;
  
  return {
    currentPeriod,
    previousPeriod,
    absoluteChange,
    percentageChange
  };
};

/**
 * Calculate the total value for a trend analysis
 * @param analysis Trend analysis
 * @returns Total value
 */
const calculateTotalForAnalysis = (analysis: TrendAnalysis): number => {
  let total = 0;
  
  analysis.series.forEach(series => {
    series.data.forEach(dataPoint => {
      total += dataPoint.value;
    });
  });
  
  return total;
};

/**
 * Apply smoothing to a series of data points
 * @param dataPoints Data points to smooth
 * @param factor Smoothing factor (0-1)
 * @returns Smoothed data points
 */
const applySmoothing = (
  dataPoints: TrendDataPoint[],
  factor: number
): TrendDataPoint[] => {
  if (dataPoints.length <= 1) {
    return dataPoints;
  }
  
  const smoothedPoints = [...dataPoints];
  
  for (let i = 1; i < smoothedPoints.length; i++) {
    const previousValue = smoothedPoints[i - 1].value;
    const currentValue = smoothedPoints[i].value;
    
    // Apply exponential smoothing
    const smoothedValue = (factor * currentValue) + ((1 - factor) * previousValue);
    
    smoothedPoints[i] = {
      ...smoothedPoints[i],
      value: smoothedValue
    };
  }
  
  return smoothedPoints;
};

/**
 * Parse a date string based on the time period
 * @param dateKey Date key string
 * @param timePeriod Time period
 * @returns Parsed date
 */
const parseDate = (dateKey: string, timePeriod: TrendTimePeriod): Date => {
  switch (timePeriod) {
    case 'daily':
      return new Date(dateKey);
    case 'weekly':
      return new Date(dateKey);
    case 'monthly':
      const [year, month] = dateKey.split('-').map(Number);
      return new Date(year, month - 1, 1);
    case 'quarterly':
      const [yearQ, quarterStr] = dateKey.split('-');
      const quarter = parseInt(quarterStr.substring(1));
      const monthQ = (quarter - 1) * 3;
      return new Date(parseInt(yearQ), monthQ, 1);
    case 'yearly':
      return new Date(parseInt(dateKey), 0, 1);
    default:
      return new Date(dateKey);
  }
};

/**
 * Find the budget for a specific date
 * @param budgets All budgets
 * @param date Date to find budget for
 * @returns Budget for the date, if any
 */
const findBudgetForDate = (budgets: Budget[], date: Date): Budget | undefined => {
  return budgets.find(budget => {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    return date >= startDate && date <= endDate;
  });
};

/**
 * Get a descriptive name for a trend analysis based on its configuration
 * @param config Trend analysis configuration
 * @returns Descriptive name
 */
const getTrendName = (config: TrendAnalysisConfig): string => {
  const typeNames = {
    'spending-by-category': 'Spending by Category',
    'income-vs-expenses': 'Income vs Expenses',
    'budget-vs-actual': 'Budget vs Actual',
    'account-balance': 'Account Balance',
    'net-worth': 'Net Worth',
    'category-distribution': 'Category Distribution'
  };
  
  const periodNames = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'yearly': 'Yearly',
    'custom': 'Custom'
  };
  
  const typeName = typeNames[config.type] || config.type;
  const periodName = periodNames[config.timePeriod] || config.timePeriod;
  
  const startDateStr = config.startDate.toLocaleDateString();
  const endDateStr = config.endDate.toLocaleDateString();
  
  return `${typeName} (${periodName}: ${startDateStr} - ${endDateStr})`;
};

/**
 * Export trend data to CSV format
 * @param analysis Trend analysis to export
 * @returns CSV string
 */
export const exportTrendDataToCsv = (analysis: TrendAnalysis): string => {
  // Create header row
  let csv = 'Date,';
  
  // Add series names to header
  analysis.series.forEach(series => {
    csv += `${series.name},`;
  });
  
  csv = csv.slice(0, -1) + '\n';
  
  // Create a map of dates to values for each series
  const dateMap = new Map<string, Record<string, number>>();
  
  analysis.series.forEach(series => {
    series.data.forEach(dataPoint => {
      const dateStr = dataPoint.date.toISOString().split('T')[0];
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {});
      }
      
      const dateValues = dateMap.get(dateStr)!;
      dateValues[series.id] = dataPoint.value;
    });
  });
  
  // Sort dates
  const sortedDates = Array.from(dateMap.keys()).sort();
  
  // Add data rows
  sortedDates.forEach(dateStr => {
    const dateValues = dateMap.get(dateStr)!;
    
    let row = dateStr + ',';
    
    analysis.series.forEach(series => {
      const value = dateValues[series.id] !== undefined ? dateValues[series.id] : '';
      row += `${value},`;
    });
    
    csv += row.slice(0, -1) + '\n';
  });
  
  return csv;
};

/**
 * Get the previous time period for comparison
 * @param startDate Start date of current period
 * @param endDate End date of current period
 * @param timePeriod Time period type
 * @returns Previous period date range
 */
export const getPreviousPeriod = (
  startDate: Date,
  endDate: Date,
  timePeriod: TrendTimePeriod
): { startDate: Date, endDate: Date } => {
  const currentStart = new Date(startDate);
  const currentEnd = new Date(endDate);
  const duration = currentEnd.getTime() - currentStart.getTime();
  
  let previousStart: Date;
  let previousEnd: Date;
  
  switch (timePeriod) {
    case 'daily':
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = new Date(previousStart);
      break;
    case 'weekly':
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(previousStart);
      previousEnd.setDate(previousEnd.getDate() + 6);
      break;
    case 'monthly':
      previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setMonth(previousEnd.getMonth() - 1);
      break;
    case 'quarterly':
      previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 3);
      previousEnd = new Date(currentEnd);
      previousEnd.setMonth(previousEnd.getMonth() - 3);
      break;
    case 'yearly':
      previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1);
      break;
    case 'custom':
    default:
      previousStart = new Date(currentStart.getTime() - duration);
      previousEnd = new Date(currentStart.getTime() - 1);
      break;
  }
  
  return { startDate: previousStart, endDate: previousEnd };
};