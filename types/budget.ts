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
  name: string; // Add name property
  allocated: number;
  spent: number;
  remaining: number;
  rollover?: {
    amount: number;
    fromPreviousMonth: boolean;
  };
  parentGroupId?: string; // Still keep this for now, might be removed later
}

export interface BudgetSummary {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  percentageSpent: number;
}