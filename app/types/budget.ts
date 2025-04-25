export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
}

export interface Budget {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  categories: (BudgetCategory | BudgetCategoryGroup)[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolloverSettings: {
    enabled: boolean;
    rolloverType: 'full' | 'partial' | 'none';
    maxRolloverAmount?: number;
  };
}

export interface BudgetCategoryGroup {
  id: string;
  name: string;
  children: (BudgetCategory | BudgetCategoryGroup)[];
}

export interface BudgetCategory {
  id: string;
  categoryId: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  rollover?: {
    amount: number;
    fromPreviousMonth: boolean;
  };
  parentGroupId?: string;
} 