export interface Budget {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  categories: BudgetCategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategory {
  id: string;
  categoryId: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface BudgetSummary {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  percentageSpent: number;
}