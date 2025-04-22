import { Transaction } from './transaction';

/**
 * Status of a reconciliation session
 */
export type ReconciliationStatus = 
  | 'in-progress' // Reconciliation is currently in progress
  | 'completed'   // Reconciliation was successfully completed
  | 'abandoned';  // Reconciliation was abandoned without completion

/**
 * Represents a bank statement or period being reconciled
 */
export interface ReconciliationStatement {
  id: string;
  accountId: string;
  startDate: Date;
  endDate: Date;
  startingBalance: number;
  endingBalance: number;
  statementDate: Date;
  notes?: string;
}

/**
 * Represents a checkpoint during the reconciliation process
 * Used to save progress during a multi-step reconciliation
 */
export interface ReconciliationCheckpoint {
  id: string;
  timestamp: Date;
  clearedTransactions: string[]; // IDs of transactions marked as cleared
  notes?: string;
}

/**
 * Represents a reconciliation session for an account
 */
export interface ReconciliationSession {
  id: string;
  accountId: string;
  statementId: string;
  status: ReconciliationStatus;
  startDate: Date;
  endDate?: Date;
  startingBalance: number;
  endingBalance: number;
  actualEndingBalance?: number; // The calculated ending balance based on cleared transactions
  difference?: number; // Difference between statement ending balance and actual ending balance
  clearedTransactions: string[]; // IDs of transactions marked as cleared during this session
  checkpoints?: ReconciliationCheckpoint[]; // Saved progress checkpoints
  completedDate?: Date; // When the reconciliation was completed
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Summary of reconciliation status for an account
 */
export interface ReconciliationSummary {
  lastReconciled?: Date;
  unreconciledTransactionCount: number;
  unclearedTransactionCount: number;
  daysSinceLastReconciliation?: number;
}