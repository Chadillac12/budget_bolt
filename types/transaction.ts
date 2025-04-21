export type TransactionType = 
  | 'income'
  | 'expense'
  | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  payee: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  isReconciled: boolean;
  isCleared: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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