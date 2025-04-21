export type AccountType = 
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'loan'
  | 'cash'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isHidden: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}