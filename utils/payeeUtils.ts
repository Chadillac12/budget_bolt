import { Payee, PayeeRule } from '@/types/payee';
import { Transaction } from '@/types/transaction';

/**
 * Utility functions for working with payees
 */

/**
 * Suggests a payee for a transaction based on transaction details and existing payees
 * @param transaction The transaction to suggest a payee for
 * @param payees List of existing payees
 * @param payeeRules List of payee rules
 * @returns The suggested payee ID or undefined if no match
 */
export const suggestPayee = (
  transaction: Transaction,
  payees: Payee[],
  payeeRules?: PayeeRule[]
): string | undefined => {
  // First try to match using payee rules if available
  if (payeeRules && payeeRules.length > 0) {
    // Sort rules by priority (lower number = higher priority)
    const sortedRules = [...payeeRules]
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      let fieldValue = '';
      
      // Get the value of the field to match against
      switch (rule.field) {
        case 'description':
          fieldValue = transaction.description || '';
          break;
        case 'memo':
        case 'reference':
          // These fields might be added to the transaction model in the future
          fieldValue = '';
          break;
      }
      
      // Skip if the field is empty
      if (!fieldValue) continue;
      
      // Check if the rule matches
      let isMatch = false;
      
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          isMatch = regex.test(fieldValue);
        } catch (error) {
          console.error('Invalid regex pattern in payee rule:', error);
        }
      } else {
        // Simple string match (case insensitive)
        isMatch = fieldValue.toLowerCase().includes(rule.pattern.toLowerCase());
      }
      
      if (isMatch) {
        return rule.payeeId;
      }
    }
  }
  
  // If no rule matched, try to match based on payee name
  const payeeName = transaction.payee.toLowerCase();
  
  // First try exact match
  const exactMatch = payees.find(p => 
    p.name.toLowerCase() === payeeName || 
    (p.alias && p.alias.some(a => a.toLowerCase() === payeeName))
  );
  
  if (exactMatch) return exactMatch.id;
  
  // Then try partial match
  const partialMatch = payees.find(p => 
    p.name.toLowerCase().includes(payeeName) || 
    payeeName.includes(p.name.toLowerCase()) ||
    (p.alias && p.alias.some(a => 
      a.toLowerCase().includes(payeeName) || 
      payeeName.includes(a.toLowerCase())
    ))
  );
  
  if (partialMatch) return partialMatch.id;
  
  // No match found
  return undefined;
};

/**
 * Gets a payee by ID
 * @param payeeId The ID of the payee to get
 * @param payees List of payees
 * @returns The payee or undefined if not found
 */
export const getPayeeById = (
  payeeId: string,
  payees: Payee[]
): Payee | undefined => {
  return payees.find(p => p.id === payeeId);
};

/**
 * Gets transactions for a specific payee
 * @param payeeId The ID of the payee
 * @param transactions List of transactions
 * @returns Transactions associated with the payee
 */
export const getTransactionsByPayee = (
  payeeId: string,
  transactions: Transaction[]
): Transaction[] => {
  return transactions.filter(t => 
    t.payeeId === payeeId || 
    (!t.payeeId && t.payee.toLowerCase() === getPayeeById(payeeId, [])?.name.toLowerCase())
  );
};

/**
 * Calculates analytics for a payee
 * @param payeeId The ID of the payee
 * @param transactions List of transactions
 * @returns Object containing analytics data
 */
export const calculatePayeeAnalytics = (
  payeeId: string,
  transactions: Transaction[]
) => {
  const payeeTransactions = getTransactionsByPayee(payeeId, transactions);
  
  if (payeeTransactions.length === 0) {
    return {
      totalSpent: 0,
      averageAmount: 0,
      transactionCount: 0,
      firstTransaction: null,
      lastTransaction: null,
      monthlyAverages: {},
    };
  }
  
  // Sort transactions by date
  const sortedTransactions = [...payeeTransactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  
  // Calculate basic metrics
  const totalSpent = payeeTransactions.reduce((sum, t) => 
    t.type === 'expense' ? sum + t.amount : sum, 0
  );
  
  const totalIncome = payeeTransactions.reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum, 0
  );
  
  const averageExpense = payeeTransactions.filter(t => t.type === 'expense').length > 0
    ? totalSpent / payeeTransactions.filter(t => t.type === 'expense').length
    : 0;
    
  const averageIncome = payeeTransactions.filter(t => t.type === 'income').length > 0
    ? totalIncome / payeeTransactions.filter(t => t.type === 'income').length
    : 0;
  
  // Calculate monthly averages
  const monthlyData: Record<string, { expenses: number, income: number, count: number }> = {};
  
  payeeTransactions.forEach(t => {
    const yearMonth = `${t.date.getFullYear()}-${(t.date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = { expenses: 0, income: 0, count: 0 };
    }
    
    if (t.type === 'expense') {
      monthlyData[yearMonth].expenses += t.amount;
    } else if (t.type === 'income') {
      monthlyData[yearMonth].income += t.amount;
    }
    
    monthlyData[yearMonth].count += 1;
  });
  
  return {
    totalSpent,
    totalIncome,
    averageExpense,
    averageIncome,
    transactionCount: payeeTransactions.length,
    firstTransaction: sortedTransactions[0],
    lastTransaction: sortedTransactions[sortedTransactions.length - 1],
    monthlyData,
  };
};