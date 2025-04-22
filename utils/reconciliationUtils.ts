import { Account } from '@/types/account';
import { Transaction } from '@/types/transaction';
import { 
  ReconciliationSession, 
  ReconciliationStatement,
  ReconciliationSummary 
} from '@/types/reconciliation';

/**
 * Calculate the actual ending balance based on starting balance and cleared transactions
 * @param startingBalance The starting balance of the reconciliation period
 * @param transactions Transactions to consider for the calculation
 * @returns The calculated ending balance
 */
export const calculateActualBalance = (
  startingBalance: number,
  transactions: Transaction[]
): number => {
  return transactions.reduce((balance, transaction) => {
    if (transaction.isCleared) {
      if (transaction.type === 'income') {
        return balance + transaction.amount;
      } else if (transaction.type === 'expense') {
        return balance - transaction.amount;
      }
    }
    return balance;
  }, startingBalance);
};

/**
 * Calculate the difference between statement ending balance and actual balance
 * @param statementBalance The ending balance from the bank statement
 * @param actualBalance The calculated balance based on cleared transactions
 * @returns The difference amount
 */
export const calculateDifference = (
  statementBalance: number,
  actualBalance: number
): number => {
  return statementBalance - actualBalance;
};

/**
 * Get transactions for a specific account within a date range
 * @param transactions All transactions
 * @param accountId The account ID to filter by
 * @param startDate Start date of the period
 * @param endDate End date of the period
 * @returns Filtered transactions
 */
export const getTransactionsForReconciliation = (
  transactions: Transaction[],
  accountId: string,
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter(transaction => {
    const txDate = new Date(transaction.date);
    return (
      transaction.accountId === accountId &&
      txDate >= startDate &&
      txDate <= endDate
    );
  });
};

/**
 * Get reconciliation summary for an account
 * @param account The account to get summary for
 * @param transactions All transactions
 * @param reconciliationSessions All reconciliation sessions
 * @returns A summary of reconciliation status
 */
export const getReconciliationSummary = (
  account: Account,
  transactions: Transaction[],
  reconciliationSessions: ReconciliationSession[]
): ReconciliationSummary => {
  // Get account transactions
  const accountTransactions = transactions.filter(
    tx => tx.accountId === account.id
  );
  
  // Count unreconciled and uncleared transactions
  const unreconciledTransactionCount = accountTransactions.filter(
    tx => !tx.isReconciled
  ).length;
  
  const unclearedTransactionCount = accountTransactions.filter(
    tx => !tx.isCleared
  ).length;
  
  // Calculate days since last reconciliation
  let daysSinceLastReconciliation: number | undefined;
  
  if (account.lastReconciled) {
    const lastReconciledDate = new Date(account.lastReconciled);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - lastReconciledDate.getTime());
    daysSinceLastReconciliation = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  return {
    lastReconciled: account.lastReconciled,
    unreconciledTransactionCount,
    unclearedTransactionCount,
    daysSinceLastReconciliation,
  };
};

/**
 * Mark multiple transactions as cleared
 * @param transactions Transactions to update
 * @param transactionIds IDs of transactions to mark as cleared
 * @param isCleared Whether to mark as cleared or uncleared
 * @returns Updated transactions
 */
export const batchUpdateTransactionClearedStatus = (
  transactions: Transaction[],
  transactionIds: string[],
  isCleared: boolean
): Transaction[] => {
  return transactions.map(transaction => {
    if (transactionIds.includes(transaction.id)) {
      return {
        ...transaction,
        isCleared,
        updatedAt: new Date()
      };
    }
    return transaction;
  });
};

/**
 * Mark multiple transactions as reconciled
 * @param transactions Transactions to update
 * @param transactionIds IDs of transactions to mark as reconciled
 * @param isReconciled Whether to mark as reconciled or unreconciled
 * @returns Updated transactions
 */
export const batchUpdateTransactionReconciledStatus = (
  transactions: Transaction[],
  transactionIds: string[],
  isReconciled: boolean
): Transaction[] => {
  return transactions.map(transaction => {
    if (transactionIds.includes(transaction.id)) {
      return {
        ...transaction,
        isReconciled,
        // If marking as reconciled, also mark as cleared
        isCleared: isReconciled ? true : transaction.isCleared,
        updatedAt: new Date()
      };
    }
    return transaction;
  });
};

/**
 * Complete a reconciliation session
 * @param session The reconciliation session to complete
 * @param account The account being reconciled
 * @param clearedTransactions IDs of transactions that were cleared during reconciliation
 * @returns Updated session and account
 */
export const completeReconciliation = (
  session: ReconciliationSession,
  account: Account,
  clearedTransactions: string[]
): { session: ReconciliationSession, account: Account } => {
  const completedDate = new Date();
  
  // Update the session
  const updatedSession: ReconciliationSession = {
    ...session,
    status: 'completed',
    completedDate,
    clearedTransactions,
    endDate: completedDate,
    updatedAt: completedDate
  };
  
  // Update the account
  const updatedAccount: Account = {
    ...account,
    lastReconciled: completedDate,
    updatedAt: completedDate
  };
  
  return {
    session: updatedSession,
    account: updatedAccount
  };
};