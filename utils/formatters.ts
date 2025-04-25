/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (default: USD)
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value Number to format (0-1)
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date in a consistent way
 * @param date Date to format
 * @param format Format type
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale: string = 'en-US'
): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? '2-digit' : format === 'medium' ? 'short' : 'long',
    day: '2-digit',
  };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
} 