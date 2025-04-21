import { format, addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';
import { RecurringTransaction } from '@/types/transaction';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy');
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End of week (Saturday)
  
  return { start, end };
};

export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return { start, end };
};

export const getFutureTransactionDates = (
  transaction: RecurringTransaction,
  startDate: Date,
  endDate: Date
): Date[] => {
  const dates: Date[] = [];
  const { recurrenceRule } = transaction;
  const { frequency, interval = 1, endDate: ruleEndDate } = recurrenceRule;
  
  // Determine actual end date (earlier of provided end date or rule end date)
  const actualEndDate = ruleEndDate && isAfter(ruleEndDate, endDate) ? ruleEndDate : endDate;
  
  let currentDate = new Date(startDate);
  
  while (!isAfter(currentDate, actualEndDate)) {
    dates.push(new Date(currentDate)); // Add a copy of the current date
    
    // Calculate next occurrence based on frequency
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
      case 'custom':
        currentDate = addDays(currentDate, interval);
        break;
    }
  }
  
  return dates;
};

export const getNextPaymentDate = (transaction: RecurringTransaction): Date => {
  const today = new Date();
  const nextDates = getFutureTransactionDates(transaction, today, addMonths(today, 1));
  return nextDates.length > 0 ? nextDates[0] : today;
};