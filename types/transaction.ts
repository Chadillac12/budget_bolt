import { Payee } from './payee';

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer';

/**
 * Represents a single category allocation within a split transaction
 */
export interface TransactionSplit {
  id: string;
  categoryId: string;
  amount: number;
  description?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  payee: string; // Kept for backward compatibility
  payeeId?: string; // Reference to a Payee object
  amount: number;
  type: TransactionType;
  categoryId: string; // Main category for non-split transactions
  description: string;
  isReconciled: boolean;
  isCleared: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Split transaction properties
  isSplit: boolean;
  splits?: TransactionSplit[];
}

export interface RecurringTransaction extends Transaction {
  recurrenceRule: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
    interval?: number; // For custom frequencies
    endDate?: Date | null;
    dayOfMonth?: number; // For monthly recurrence
    dayOfWeek?: number; // For weekly recurrence (0-6, Sunday to Saturday)
  };
  isAutomatic: boolean;
}

export interface TransactionCategory {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  isIncome: boolean;
  isProtected: boolean;
}