/**
 * Rule-based automatic categorization system
 * Allows for automatic categorization of transactions based on defined rules
 */

import { TransactionType } from './transaction';

/**
 * Types of conditions that can be used in rules
 */
export enum RuleConditionType {
  TEXT = 'text',
  AMOUNT = 'amount',
  METADATA = 'metadata'
}

/**
 * Text matching operators for text-based conditions
 */
export enum TextMatchOperator {
  CONTAINS = 'contains',
  EQUALS = 'equals',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  REGEX = 'regex'
}

/**
 * Amount comparison operators for amount-based conditions
 */
export enum AmountOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  BETWEEN = 'between'
}

/**
 * Metadata field types that can be used in metadata conditions
 */
export enum MetadataField {
  ACCOUNT = 'account',
  TYPE = 'type',
  DATE = 'date',
  TAGS = 'tags'
}

/**
 * Base interface for all rule conditions
 */
export interface BaseRuleCondition {
  type: RuleConditionType;
  isNegated?: boolean; // If true, the condition is negated (NOT)
}

/**
 * Text-based rule condition
 * Matches against transaction payee or description
 */
export interface TextRuleCondition extends BaseRuleCondition {
  type: RuleConditionType.TEXT;
  field: 'payee' | 'description';
  operator: TextMatchOperator;
  value: string;
  caseSensitive?: boolean; // Default: false
}

/**
 * Amount-based rule condition
 * Matches against transaction amount
 */
export interface AmountRuleCondition extends BaseRuleCondition {
  type: RuleConditionType.AMOUNT;
  operator: AmountOperator;
  value: number;
  value2?: number; // Used for BETWEEN operator
}

/**
 * Metadata-based rule condition
 * Matches against transaction metadata fields
 */
export interface MetadataRuleCondition extends BaseRuleCondition {
  type: RuleConditionType.METADATA;
  field: MetadataField;
  value: any;
}

/**
 * Union type for all possible rule conditions
 */
export type RuleCondition = TextRuleCondition | AmountRuleCondition | MetadataRuleCondition;

/**
 * Rule action to apply when conditions are met
 */
export interface RuleAction {
  categoryId: string; // The category to assign
  addTags?: string[]; // Optional tags to add
}

/**
 * Complete rule definition
 */
export interface Rule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number; // Lower numbers = higher priority
  conditions: RuleCondition[];
  action: RuleAction;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields for rule statistics
  matchCount?: number; // Number of times this rule has matched
  lastMatchDate?: Date; // Last time this rule matched a transaction
}

/**
 * Logical operator for combining multiple conditions
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or'
}

/**
 * Rule group for organizing rules
 */
export interface RuleGroup {
  id: string;
  name: string;
  description?: string;
  rules: Rule[];
  isActive: boolean;
  logicalOperator: LogicalOperator; // How to combine conditions within this group
  priority: number; // Lower numbers = higher priority
}