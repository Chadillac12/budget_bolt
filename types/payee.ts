/**
 * Payee Management System
 * Defines types and interfaces for managing payees in the budget tracker
 */

/**
 * Represents a contact method for a payee
 */
export interface PayeeContact {
  type: 'email' | 'phone' | 'address' | 'website' | 'other';
  value: string;
  isPrimary?: boolean;
  label?: string;
}

/**
 * Represents a category or tag for organizing payees
 */
export interface PayeeCategory {
  id: string;
  name: string;
  color?: string;
}

/**
 * Represents a payee in the system
 */
export interface Payee {
  id: string;
  name: string;
  alias?: string[];
  notes?: string;
  contacts?: PayeeContact[];
  categoryIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields for analytics and tracking
  lastTransactionDate?: Date;
  totalTransactions?: number;
  averageTransactionAmount?: number;
}

/**
 * Represents a rule for automatically assigning a payee
 * based on transaction details
 */
export interface PayeeRule {
  id: string;
  payeeId: string;
  pattern: string;
  field: 'description' | 'memo' | 'reference';
  isRegex: boolean;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}