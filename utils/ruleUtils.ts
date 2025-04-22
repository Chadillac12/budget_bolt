import { Transaction } from '@/types/transaction';
import { 
  Rule, 
  RuleCondition, 
  RuleConditionType, 
  TextRuleCondition, 
  AmountRuleCondition, 
  MetadataRuleCondition,
  TextMatchOperator,
  AmountOperator,
  MetadataField,
  LogicalOperator
} from '@/types/rule';

/**
 * Evaluates a text-based condition against a transaction
 * @param condition The text condition to evaluate
 * @param transaction The transaction to check against
 * @returns True if the condition matches, false otherwise
 */
export const evaluateTextCondition = (
  condition: TextRuleCondition,
  transaction: Transaction
): boolean => {
  // Get the field value from the transaction
  const fieldValue = transaction[condition.field];
  
  if (!fieldValue) return false;
  
  // Convert to string if not already
  const textValue = String(fieldValue);
  
  // Prepare values based on case sensitivity
  const value = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
  const target = condition.caseSensitive ? textValue : textValue.toLowerCase();
  
  let result: boolean;
  
  // Evaluate based on the operator
  switch (condition.operator) {
    case TextMatchOperator.CONTAINS:
      result = target.includes(value);
      break;
      
    case TextMatchOperator.EQUALS:
      result = target === value;
      break;
      
    case TextMatchOperator.STARTS_WITH:
      result = target.startsWith(value);
      break;
      
    case TextMatchOperator.ENDS_WITH:
      result = target.endsWith(value);
      break;
      
    case TextMatchOperator.REGEX:
      try {
        const regex = new RegExp(condition.value, condition.caseSensitive ? '' : 'i');
        result = regex.test(textValue);
      } catch (error) {
        console.error('Invalid regex pattern:', condition.value, error);
        result = false;
      }
      break;
      
    default:
      result = false;
  }
  
  // Apply negation if needed
  return condition.isNegated ? !result : result;
};

/**
 * Evaluates an amount-based condition against a transaction
 * @param condition The amount condition to evaluate
 * @param transaction The transaction to check against
 * @returns True if the condition matches, false otherwise
 */
export const evaluateAmountCondition = (
  condition: AmountRuleCondition,
  transaction: Transaction
): boolean => {
  const amount = Math.abs(transaction.amount); // Use absolute value for comparison
  
  let result: boolean;
  
  // Evaluate based on the operator
  switch (condition.operator) {
    case AmountOperator.EQUALS:
      result = Math.abs(amount - condition.value) < 0.001; // Allow for small floating point differences
      break;
      
    case AmountOperator.GREATER_THAN:
      result = amount > condition.value;
      break;
      
    case AmountOperator.LESS_THAN:
      result = amount < condition.value;
      break;
      
    case AmountOperator.BETWEEN:
      if (condition.value2 === undefined) {
        result = false;
      } else {
        const min = Math.min(condition.value, condition.value2);
        const max = Math.max(condition.value, condition.value2);
        result = amount >= min && amount <= max;
      }
      break;
      
    default:
      result = false;
  }
  
  // Apply negation if needed
  return condition.isNegated ? !result : result;
};

/**
 * Evaluates a metadata-based condition against a transaction
 * @param condition The metadata condition to evaluate
 * @param transaction The transaction to check against
 * @returns True if the condition matches, false otherwise
 */
export const evaluateMetadataCondition = (
  condition: MetadataRuleCondition,
  transaction: Transaction
): boolean => {
  let result: boolean;
  
  // Evaluate based on the metadata field
  switch (condition.field) {
    case MetadataField.ACCOUNT:
      result = transaction.accountId === condition.value;
      break;
      
    case MetadataField.TYPE:
      result = transaction.type === condition.value;
      break;
      
    case MetadataField.DATE:
      // For date, we expect condition.value to be an object with comparison details
      if (typeof condition.value === 'object' && condition.value !== null) {
        const txDate = new Date(transaction.date);
        const { operator, date } = condition.value;
        const compareDate = new Date(date);
        
        switch (operator) {
          case 'before':
            result = txDate < compareDate;
            break;
          case 'after':
            result = txDate > compareDate;
            break;
          case 'on':
            // Compare only the date part (ignore time)
            result = txDate.toDateString() === compareDate.toDateString();
            break;
          default:
            result = false;
        }
      } else {
        result = false;
      }
      break;
      
    case MetadataField.TAGS:
      // For tags, we check if the transaction has any of the specified tags
      if (Array.isArray(condition.value) && Array.isArray(transaction.tags)) {
        result = condition.value.some(tag => transaction.tags.includes(tag));
      } else {
        result = false;
      }
      break;
      
    default:
      result = false;
  }
  
  // Apply negation if needed
  return condition.isNegated ? !result : result;
};

/**
 * Evaluates a single rule condition against a transaction
 * @param condition The condition to evaluate
 * @param transaction The transaction to check against
 * @returns True if the condition matches, false otherwise
 */
export const evaluateCondition = (
  condition: RuleCondition,
  transaction: Transaction
): boolean => {
  switch (condition.type) {
    case RuleConditionType.TEXT:
      return evaluateTextCondition(condition as TextRuleCondition, transaction);
      
    case RuleConditionType.AMOUNT:
      return evaluateAmountCondition(condition as AmountRuleCondition, transaction);
      
    case RuleConditionType.METADATA:
      return evaluateMetadataCondition(condition as MetadataRuleCondition, transaction);
      
    default:
      return false;
  }
};

/**
 * Evaluates all conditions of a rule against a transaction
 * @param rule The rule to evaluate
 * @param transaction The transaction to check against
 * @param logicalOperator The logical operator to use when combining conditions (default: AND)
 * @returns True if the rule matches, false otherwise
 */
export const evaluateRule = (
  rule: Rule,
  transaction: Transaction,
  logicalOperator: LogicalOperator = LogicalOperator.AND
): boolean => {
  // If the rule is not active, it doesn't match
  if (!rule.isActive) return false;
  
  // If there are no conditions, the rule doesn't match
  if (!rule.conditions || rule.conditions.length === 0) return false;
  
  // Evaluate all conditions
  if (logicalOperator === LogicalOperator.AND) {
    // All conditions must match (AND)
    return rule.conditions.every(condition => evaluateCondition(condition, transaction));
  } else {
    // At least one condition must match (OR)
    return rule.conditions.some(condition => evaluateCondition(condition, transaction));
  }
};

/**
 * Applies a rule to a transaction if it matches
 * @param rule The rule to apply
 * @param transaction The transaction to apply the rule to
 * @param logicalOperator The logical operator to use when combining conditions
 * @returns The updated transaction if the rule matched, or the original transaction if not
 */
export const applyRule = (
  rule: Rule,
  transaction: Transaction,
  logicalOperator: LogicalOperator = LogicalOperator.AND
): Transaction => {
  // Check if the rule matches
  if (!evaluateRule(rule, transaction, logicalOperator)) {
    return transaction;
  }
  
  // Rule matched, apply the action
  const updatedTransaction = { ...transaction };
  
  // Apply category
  updatedTransaction.categoryId = rule.action.categoryId;
  
  // Apply tags if specified
  if (rule.action.addTags && rule.action.addTags.length > 0) {
    const currentTags = updatedTransaction.tags || [];
    const newTags = [...currentTags];
    
    // Add any tags that don't already exist
    rule.action.addTags.forEach(tag => {
      if (!newTags.includes(tag)) {
        newTags.push(tag);
      }
    });
    
    updatedTransaction.tags = newTags;
  }
  
  // Update rule statistics
  const updatedRule = { ...rule };
  updatedRule.matchCount = (rule.matchCount || 0) + 1;
  updatedRule.lastMatchDate = new Date();
  
  // Return the updated transaction
  return updatedTransaction;
};

/**
 * Applies multiple rules to a transaction in priority order
 * @param rules The rules to apply, sorted by priority
 * @param transaction The transaction to apply the rules to
 * @param stopOnFirstMatch Whether to stop after the first matching rule (default: true)
 * @returns The updated transaction after applying rules
 */
export const applyRules = (
  rules: Rule[],
  transaction: Transaction,
  stopOnFirstMatch: boolean = true
): Transaction => {
  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  
  let updatedTransaction = { ...transaction };
  
  // Apply each rule in priority order
  for (const rule of sortedRules) {
    const result = applyRule(rule, updatedTransaction);
    
    // If the rule matched and changed the transaction
    if (result !== updatedTransaction) {
      updatedTransaction = result;
      
      // Stop after first match if requested
      if (stopOnFirstMatch) {
        break;
      }
    }
  }
  
  return updatedTransaction;
};

/**
 * Creates a new rule with default values
 * @returns A new rule object with default values
 */
export const createDefaultRule = (): Rule => {
  return {
    id: `rule_${Date.now()}`,
    name: 'New Rule',
    isActive: true,
    priority: 100, // Default medium priority
    conditions: [],
    action: {
      categoryId: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    matchCount: 0
  };
};

/**
 * Tests a rule against a transaction without applying it
 * @param rule The rule to test
 * @param transaction The transaction to test against
 * @returns True if the rule matches, false otherwise
 */
export const testRule = (rule: Rule, transaction: Transaction): boolean => {
  return evaluateRule(rule, transaction);
};

/**
 * Previews the result of applying rules to a transaction
 * @param rules The rules to apply
 * @param transaction The transaction to apply rules to
 * @returns An object containing the matching rule and the updated transaction
 */
export const previewRuleApplication = (
  rules: Rule[],
  transaction: Transaction
): { matchedRule: Rule | null; updatedTransaction: Transaction } => {
  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  
  // Find the first matching rule
  for (const rule of sortedRules) {
    if (evaluateRule(rule, transaction)) {
      // Apply the rule
      const updatedTransaction = applyRule(rule, transaction);
      return { matchedRule: rule, updatedTransaction };
    }
  }
  
  // No rule matched
  return { matchedRule: null, updatedTransaction: transaction };
};