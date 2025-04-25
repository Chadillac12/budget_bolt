import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  Switch,
  TextInput,
  ScrollView
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { 
  Rule, 
  RuleCondition, 
  RuleConditionType, 
  TextMatchOperator, 
  AmountOperator, 
  MetadataField,
  TextRuleCondition,
  AmountRuleCondition,
  MetadataRuleCondition,
  LogicalOperator
} from '@/types/rule';
import { createDefaultRule } from '@/utils/ruleUtils';
import { 
  Plus, 
  Trash2, 
  Edit, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  Copy,
  AlertCircle,
  Check,
  Wand2
} from 'lucide-react-native';
import { Stack } from 'expo-router';
import { Transaction } from '@/types/transaction';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

/**
 * Rules Management Screen
 * Allows users to create, edit, delete, and reorder categorization rules
 */
export default function RulesScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, dispatch } = useAppContext();
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [testTransaction, setTestTransaction] = useState<Transaction | null>(null);
  
  // Create a new rule
  const handleAddRule = () => {
    const newRule = createDefaultRule();
    setEditingRule(newRule);
    setIsAddingRule(true);
  };
  
  // Edit an existing rule
  const handleEditRule = (rule: Rule) => {
    setEditingRule({ ...rule });
    setIsAddingRule(false);
  };
  
  // Delete a rule
  const handleDeleteRule = (ruleId: string) => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this rule?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_RULE', payload: ruleId });
          },
        },
      ]
    );
  };
  
  // Duplicate a rule
  const handleDuplicateRule = (rule: Rule) => {
    const duplicatedRule: Rule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    dispatch({ type: 'ADD_RULE', payload: duplicatedRule });
  };
  
  // Move a rule up in priority
  const handleMoveRuleUp = (index: number) => {
    if (index <= 0) return;
    
    const updatedRules = [...state.rules];
    const temp = updatedRules[index];
    updatedRules[index] = updatedRules[index - 1];
    updatedRules[index - 1] = temp;
    
    // Update priorities
    updatedRules.forEach((rule, idx) => {
      rule.priority = idx * 10; // Space priorities by 10 to allow for easy insertion
    });
    
    dispatch({ type: 'REORDER_RULES', payload: updatedRules });
  };
  
  // Move a rule down in priority
  const handleMoveRuleDown = (index: number) => {
    if (index >= state.rules.length - 1) return;
    
    const updatedRules = [...state.rules];
    const temp = updatedRules[index];
    updatedRules[index] = updatedRules[index + 1];
    updatedRules[index + 1] = temp;
    
    // Update priorities
    updatedRules.forEach((rule, idx) => {
      rule.priority = idx * 10;
    });
    
    dispatch({ type: 'REORDER_RULES', payload: updatedRules });
  };
  
  // Toggle rule active state
  const handleToggleRuleActive = (rule: Rule) => {
    const updatedRule = {
      ...rule,
      isActive: !rule.isActive,
      updatedAt: new Date(),
    };
    
    dispatch({ type: 'UPDATE_RULE', payload: updatedRule });
  };
  
  // Save a rule (new or edited)
  const handleSaveRule = () => {
    if (!editingRule) return;
    
    // Validate rule
    if (!editingRule.name.trim()) {
      Alert.alert('Error', 'Rule name is required');
      return;
    }
    
    if (!editingRule.conditions || editingRule.conditions.length === 0) {
      Alert.alert('Error', 'At least one condition is required');
      return;
    }
    
    if (!editingRule.action.categoryId) {
      Alert.alert('Error', 'A category must be selected for the rule action');
      return;
    }
    
    // Update timestamps
    const updatedRule = {
      ...editingRule,
      updatedAt: new Date(),
    };
    
    // Add or update the rule
    if (isAddingRule) {
      dispatch({ type: 'ADD_RULE', payload: updatedRule });
    } else {
      dispatch({ type: 'UPDATE_RULE', payload: updatedRule });
    }
    
    // Reset editing state
    setEditingRule(null);
    setIsAddingRule(false);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingRule(null);
    setIsAddingRule(false);
  };
  
  // Add a condition to the current rule
  const handleAddCondition = (type: RuleConditionType) => {
    if (!editingRule) return;
    
    let newCondition: RuleCondition;
    
    switch (type) {
      case RuleConditionType.TEXT:
        newCondition = {
          type: RuleConditionType.TEXT,
          field: 'payee',
          operator: TextMatchOperator.CONTAINS,
          value: '',
          caseSensitive: false,
        } as TextRuleCondition;
        break;
        
      case RuleConditionType.AMOUNT:
        newCondition = {
          type: RuleConditionType.AMOUNT,
          operator: AmountOperator.GREATER_THAN,
          value: 0,
        } as AmountRuleCondition;
        break;
        
      case RuleConditionType.METADATA:
        newCondition = {
          type: RuleConditionType.METADATA,
          field: MetadataField.ACCOUNT,
          value: '',
        } as MetadataRuleCondition;
        break;
        
      default:
        return;
    }
    
    const updatedRule = {
      ...editingRule,
      conditions: [...(editingRule.conditions || []), newCondition],
    };
    
    setEditingRule(updatedRule);
  };
  
  // Update a condition
  const handleUpdateCondition = (index: number, updatedCondition: RuleCondition) => {
    if (!editingRule || !editingRule.conditions) return;
    
    const updatedConditions = [...editingRule.conditions];
    updatedConditions[index] = updatedCondition;
    
    setEditingRule({
      ...editingRule,
      conditions: updatedConditions,
    });
  };
  
  // Delete a condition
  const handleDeleteCondition = (index: number) => {
    if (!editingRule || !editingRule.conditions) return;
    
    const updatedConditions = [...editingRule.conditions];
    updatedConditions.splice(index, 1);
    
    setEditingRule({
      ...editingRule,
      conditions: updatedConditions,
    });
  };
  
  // Update rule action
  const handleUpdateAction = (categoryId: string, addTags?: string[]) => {
    if (!editingRule) return;
    
    setEditingRule({
      ...editingRule,
      action: {
        categoryId,
        addTags,
      },
    });
  };
  
  // Render a rule item in the list
  const renderRuleItem = ({ item, index }: { item: Rule; index: number }) => {
    const selectedCategory = state.categories.find(cat => cat.id === item.action.categoryId);
    
    return (
      <View style={styles.ruleItem}>
        <View style={styles.ruleHeader}>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggleRuleActive(item)}
            trackColor={{ false: theme.colors.border, true: '#4CD964' }}
          />
          
          <Text style={styles.ruleName}>{item.name}</Text>
          
          <View style={styles.ruleActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleMoveRuleUp(index)}
              disabled={index === 0}
            >
              <ChevronUp size={18} color={index === 0 ? '#C7C7CC' : theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleMoveRuleDown(index)}
              disabled={index === state.rules.length - 1}
            >
              <ChevronDown size={18} color={index === state.rules.length - 1 ? '#C7C7CC' : theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDuplicateRule(item)}
            >
              <Copy size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEditRule(item)}
            >
              <Edit size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteRule(item.id)}
            >
              <Trash2 size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.ruleSummary}>
          <Text style={styles.ruleConditionsLabel}>Conditions:</Text>
          {item.conditions.map((condition, condIndex) => (
            <Text key={condIndex} style={styles.ruleCondition}>
              {formatConditionSummary(condition)}
            </Text>
          ))}
          
          <Text style={styles.ruleActionLabel}>Action:</Text>
          <View style={styles.categoryAction}>
            {selectedCategory && (
              <View 
                style={[
                  styles.categoryIndicator, 
                  { backgroundColor: selectedCategory.color }
                ]}
              />
            )}
            <Text style={styles.categoryName}>
              {selectedCategory ? selectedCategory.name : 'No category selected'}
            </Text>
          </View>
          
          {item.action.addTags && item.action.addTags.length > 0 && (
            <Text style={styles.ruleTags}>
              Add tags: {item.action.addTags.join(', ')}
            </Text>
          )}
          
          {item.matchCount !== undefined && item.matchCount > 0 && (
            <Text style={styles.ruleStats}>
              Matched {item.matchCount} times
              {item.lastMatchDate && ` (last: ${formatDate(item.lastMatchDate)})`}
            </Text>
          )}
        </View>
      </View>
    );
  };
  
  // Format a condition for display
  const formatConditionSummary = (condition: RuleCondition): string => {
    switch (condition.type) {
      case RuleConditionType.TEXT: {
        const textCondition = condition as TextRuleCondition;
        const negation = textCondition.isNegated ? 'not ' : '';
        
        let operatorText = '';
        switch (textCondition.operator) {
          case TextMatchOperator.CONTAINS:
            operatorText = 'contains';
            break;
          case TextMatchOperator.EQUALS:
            operatorText = 'equals';
            break;
          case TextMatchOperator.STARTS_WITH:
            operatorText = 'starts with';
            break;
          case TextMatchOperator.ENDS_WITH:
            operatorText = 'ends with';
            break;
          case TextMatchOperator.REGEX:
            operatorText = 'matches pattern';
            break;
        }
        
        return `${textCondition.field} ${negation}${operatorText} "${textCondition.value}"`;
      }
      
      case RuleConditionType.AMOUNT: {
        const amountCondition = condition as AmountRuleCondition;
        const negation = amountCondition.isNegated ? 'not ' : '';
        
        let operatorText = '';
        switch (amountCondition.operator) {
          case AmountOperator.EQUALS:
            operatorText = 'equals';
            break;
          case AmountOperator.GREATER_THAN:
            operatorText = 'greater than';
            break;
          case AmountOperator.LESS_THAN:
            operatorText = 'less than';
            break;
          case AmountOperator.BETWEEN:
            if (amountCondition.value2 !== undefined) {
              return `amount ${negation}between ${amountCondition.value} and ${amountCondition.value2}`;
            }
            operatorText = 'between (invalid)';
            break;
        }
        
        return `amount ${negation}${operatorText} ${amountCondition.value}`;
      }
      
      case RuleConditionType.METADATA: {
        const metadataCondition = condition as MetadataRuleCondition;
        const negation = metadataCondition.isNegated ? 'not ' : '';
        
        let fieldText = '';
        switch (metadataCondition.field) {
          case MetadataField.ACCOUNT:
            const account = state.accounts.find(acc => acc.id === metadataCondition.value);
            fieldText = `account ${negation}is ${account ? account.name : metadataCondition.value}`;
            break;
          case MetadataField.TYPE:
            fieldText = `transaction type ${negation}is ${metadataCondition.value}`;
            break;
          case MetadataField.DATE:
            if (typeof metadataCondition.value === 'object' && metadataCondition.value !== null) {
              const { operator, date } = metadataCondition.value;
              fieldText = `date ${negation}is ${operator} ${formatDate(new Date(date))}`;
            } else {
              fieldText = `date condition (invalid)`;
            }
            break;
          case MetadataField.TAGS:
            if (Array.isArray(metadataCondition.value)) {
              fieldText = `tags ${negation}include ${metadataCondition.value.join(' or ')}`;
            } else {
              fieldText = `tags condition (invalid)`;
            }
            break;
        }
        
        return fieldText;
      }
      
      default:
        return 'Unknown condition';
    }
  };
  
  // Format a date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };
  
  // Format text operator for display
  const formatTextOperator = (operator: TextMatchOperator): string => {
    switch (operator) {
      case TextMatchOperator.CONTAINS:
        return 'Contains';
      case TextMatchOperator.EQUALS:
        return 'Equals';
      case TextMatchOperator.STARTS_WITH:
        return 'Starts with';
      case TextMatchOperator.ENDS_WITH:
        return 'Ends with';
      case TextMatchOperator.REGEX:
        return 'Matches pattern (regex)';
      default:
        return 'Unknown';
    }
  };
  
  // Format amount operator for display
  const formatAmountOperator = (operator: AmountOperator): string => {
    switch (operator) {
      case AmountOperator.EQUALS:
        return 'Equals';
      case AmountOperator.GREATER_THAN:
        return 'Greater than';
      case AmountOperator.LESS_THAN:
        return 'Less than';
      case AmountOperator.BETWEEN:
        return 'Between';
      default:
        return 'Unknown';
    }
  };
  
  // Format metadata field for display
  const formatMetadataField = (field: MetadataField): string => {
    switch (field) {
      case MetadataField.ACCOUNT:
        return 'Account';
      case MetadataField.TYPE:
        return 'Transaction Type';
      case MetadataField.DATE:
        return 'Date';
      case MetadataField.TAGS:
        return 'Tags';
      default:
        return 'Unknown';
    }
  };
  
  // Get account name from ID
  const getAccountName = (accountId: string): string => {
    const account = state.accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Select Account';
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Categorization Rules',
          headerRight: () => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddRule}
            >
              <Plus size={20} color={theme.colors.card} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {editingRule ? (
        // Rule Editor
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>
              {isAddingRule ? 'New Rule' : 'Edit Rule'}
            </Text>
            
            <View style={styles.editorActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCancelEdit}
              >
                <X size={20} color={theme.colors.error} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSaveRule}
              >
                <Save size={20} color="#4CD964" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.editorScrollView}>
            {/* Rule Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rule Name</Text>
              <TextInput
                style={styles.input}
                value={editingRule.name}
                onChangeText={(text) => setEditingRule({ ...editingRule, name: text })}
                placeholder="Enter rule name"
              />
            </View>
            
            {/* Rule Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                value={editingRule.description || ''}
                onChangeText={(text) => setEditingRule({ ...editingRule, description: text })}
                placeholder="Enter rule description"
                multiline
              />
            </View>
            
            {/* Rule Active Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.toggleContainer}>
                <Text style={styles.label}>Rule Active</Text>
                <Switch
                  value={editingRule.isActive}
                  onValueChange={(value) => setEditingRule({ ...editingRule, isActive: value })}
                  trackColor={{ false: theme.colors.border, true: '#4CD964' }}
                />
              </View>
            </View>
            
            {/* Rule Priority */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority (Lower number = higher priority)</Text>
              <TextInput
                style={styles.input}
                value={editingRule.priority.toString()}
                onChangeText={(text) => {
                  const priority = parseInt(text);
                  if (!isNaN(priority)) {
                    setEditingRule({ ...editingRule, priority });
                  }
                }}
                keyboardType="numeric"
                placeholder="Enter priority number"
              />
            </View>
            
            {/* Conditions */}
            <View style={styles.conditionsContainer}>
              <Text style={styles.sectionTitle}>Conditions</Text>
              
              {editingRule.conditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <View style={styles.conditionHeader}>
                    <Text style={styles.conditionType}>
                      {condition.type.toUpperCase()}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteCondition(index)}
                    >
                      <Trash2 size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Render condition editor based on type */}
                  {condition.type === RuleConditionType.TEXT && (
                    <View style={styles.conditionEditor}>
                      {/* Field Selection */}
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Field</Text>
                        <View style={styles.segmentedControl}>
                          <TouchableOpacity
                            style={[
                              styles.segmentButton,
                              (condition as TextRuleCondition).field === 'payee' && styles.segmentButtonActive
                            ]}
                            onPress={() => {
                              const updatedCondition = { ...condition as TextRuleCondition, field: 'payee' as const };
                              handleUpdateCondition(index, updatedCondition);
                            }}
                          >
                            <Text style={[
                              styles.segmentButtonText,
                              (condition as TextRuleCondition).field === 'payee' && styles.segmentButtonTextActive
                            ]}>
                              Payee
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.segmentButton,
                              (condition as TextRuleCondition).field === 'description' && styles.segmentButtonActive
                            ]}
                            onPress={() => {
                              const updatedCondition = { ...condition as TextRuleCondition, field: 'description' as const };
                              handleUpdateCondition(index, updatedCondition);
                            }}
                          >
                            <Text style={[
                              styles.segmentButtonText,
                              (condition as TextRuleCondition).field === 'description' && styles.segmentButtonTextActive
                            ]}>
                              Description
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Operator Selection */}
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Operator</Text>
                        <TouchableOpacity
                          style={styles.selector}
                          onPress={() => {
                            // In a real implementation, this would open a picker
                            Alert.alert(
                              "Select Operator",
                              "Operator picker would open here"
                            );
                          }}
                        >
                          <Text style={styles.selectorText}>
                            {formatTextOperator((condition as TextRuleCondition).operator)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Value Input */}
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Value</Text>
                        <TextInput
                          style={styles.input}
                          value={(condition as TextRuleCondition).value}
                          onChangeText={(text) => {
                            const updatedCondition = { ...condition as TextRuleCondition, value: text };
                            handleUpdateCondition(index, updatedCondition);
                          }}
                          placeholder="Enter text to match"
                        />
                      </View>
                      
                      {/* Case Sensitive Toggle */}
                      <View style={styles.formGroup}>
                        <View style={styles.toggleContainer}>
                          <Text style={styles.label}>Case Sensitive</Text>
                          <Switch
                            value={(condition as TextRuleCondition).caseSensitive || false}
                            onValueChange={(value) => {
                              const updatedCondition = { ...condition as TextRuleCondition, caseSensitive: value };
                              handleUpdateCondition(index, updatedCondition);
                            }}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          />
                        </View>
                      </View>
                      
                      {/* Negation Toggle */}
                      <View style={styles.formGroup}>
                        <View style={styles.toggleContainer}>
                          <Text style={styles.label}>NOT (Negate Condition)</Text>
                          <Switch
                            value={(condition as TextRuleCondition).isNegated || false}
                            onValueChange={(value) => {
                              const updatedCondition = { ...condition as TextRuleCondition, isNegated: value };
                              handleUpdateCondition(index, updatedCondition);
                            }}
                            trackColor={{ false: theme.colors.border, true: theme.colors.warning }}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {condition.type === RuleConditionType.AMOUNT && (
                    <View style={styles.conditionEditor}>
                      {/* Operator Selection */}
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Operator</Text>
                        <TouchableOpacity
                          style={styles.selector}
                          onPress={() => {
                            // In a real implementation, this would open a picker
                            Alert.alert(
                              "Select Operator",
                              "Operator picker would open here"
                            );
                          }}
                        >
                          <Text style={styles.selectorText}>
                            {formatAmountOperator((condition as AmountRuleCondition).operator)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Value Input */}
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Value</Text>
                        <TextInput
                          style={styles.input}
                          value={(condition as AmountRuleCondition).value.toString()}
                          onChangeText={(text) => {
                            const value = parseFloat(text);
                            if (!isNaN(value)) {
                              const updatedCondition = { ...condition as AmountRuleCondition, value };
                              handleUpdateCondition(index, updatedCondition);
                            }
                          }}
                          keyboardType="numeric"
                          placeholder="Enter amount"
                        />
                      </View>
                      
                      {/* Second Value Input (for BETWEEN operator) */}
                      {(condition as AmountRuleCondition).operator === AmountOperator.BETWEEN && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Second Value</Text>
                          <TextInput
                            style={styles.input}
                            value={(condition as AmountRuleCondition).value2?.toString() || ''}
                            onChangeText={(text) => {
                              const value2 = parseFloat(text);
                              if (!isNaN(value2)) {
                                const updatedCondition = { ...condition as AmountRuleCondition, value2 };
                                handleUpdateCondition(index, updatedCondition);
                              }
                            }}
                            keyboardType="numeric"
                            placeholder="Enter second amount"
                          />
                        </View>
                      )}
                      
                      {/* Negation Toggle */}
                      <View style={styles.formGroup}>
                        <View style={styles.toggleContainer}>
                          <Text style={styles.label}>NOT (Negate Condition)</Text>
                          <Switch
                            value={(condition as AmountRuleCondition).isNegated || false}
                            onValueChange={(value) => {
                              const updatedCondition = { ...condition as AmountRuleCondition, isNegated: value };
                              handleUpdateCondition(index, updatedCondition);
                            }}
                            trackColor={{ false: theme.colors.border, true: theme.colors.warning }}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {condition.type === RuleConditionType.METADATA && (
                    <View style={styles.conditionEditor}>
                      {/* Field Selection */}
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Field</Text>
                        <TouchableOpacity
                          style={styles.selector}
                          onPress={() => {
                            // In a real implementation, this would open a picker
                            Alert.alert(
                              "Select Field",
                              "Field picker would open here"
                            );
                          }}
                        >
                          <Text style={styles.selectorText}>
                            {formatMetadataField((condition as MetadataRuleCondition).field)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Value Selection/Input (depends on field type) */}
                      {(condition as MetadataRuleCondition).field === MetadataField.ACCOUNT && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Account</Text>
                          <TouchableOpacity
                            style={styles.selector}
                            onPress={() => {
                              // In a real implementation, this would open an account picker
                              Alert.alert(
                                "Select Account",
                                "Account picker would open here"
                              );
                            }}
                          >
                            <Text style={styles.selectorText}>
                              {getAccountName((condition as MetadataRuleCondition).value)}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {(condition as MetadataRuleCondition).field === MetadataField.TYPE && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Transaction Type</Text>
                          <TouchableOpacity
                            style={styles.selector}
                            onPress={() => {
                              // In a real implementation, this would open a type picker
                              Alert.alert(
                                "Select Transaction Type",
                                "Type picker would open here"
                              );
                            }}
                          >
                            <Text style={styles.selectorText}>
                              {(condition as MetadataRuleCondition).value || 'Select Type'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {/* Negation Toggle */}
                      <View style={styles.formGroup}>
                        <View style={styles.toggleContainer}>
                          <Text style={styles.label}>NOT (Negate Condition)</Text>
                          <Switch
                            value={(condition as MetadataRuleCondition).isNegated || false}
                            onValueChange={(value) => {
                              const updatedCondition = { ...condition as MetadataRuleCondition, isNegated: value };
                              handleUpdateCondition(index, updatedCondition);
                            }}
                            trackColor={{ false: theme.colors.border, true: theme.colors.warning }}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              
              {/* Add Condition Buttons */}
              <View style={styles.addConditionButtons}>
                <TouchableOpacity
                  style={[styles.addButton, styles.textConditionButton]}
                  onPress={() => handleAddCondition(RuleConditionType.TEXT)}
                >
                  <Plus size={16} color={theme.colors.card} />
                  <Text style={styles.addButtonText}>Text</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.addButton, styles.amountConditionButton]}
                  onPress={() => handleAddCondition(RuleConditionType.AMOUNT)}
                >
                  <Plus size={16} color={theme.colors.card} />
                  <Text style={styles.addButtonText}>Amount</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.addButton, styles.metadataConditionButton]}
                  onPress={() => handleAddCondition(RuleConditionType.METADATA)}
                >
                  <Plus size={16} color={theme.colors.card} />
                  <Text style={styles.addButtonText}>Metadata</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Action */}
            <View style={styles.actionContainer}>
              <Text style={styles.sectionTitle}>Action</Text>
              
              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Assign Category</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => {
                    // In a real implementation, this would open a category picker
                    Alert.alert(
                      "Select Category",
                      "Category picker would open here"
                    );
                  }}
                >
                  {/* Show selected category if available */}
                  {editingRule.action.categoryId && (
                    <View
                      style={[
                        styles.categoryIndicator,
                        {
                          backgroundColor: state.categories.find(
                            cat => cat.id === editingRule.action.categoryId
                          )?.color || theme.colors.border
                        }
                      ]}
                    />
                  )}
                  <Text style={styles.categorySelectorText}>
                    {state.categories.find(cat => cat.id === editingRule.action.categoryId)?.name || 'Select Category'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Tags */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Add Tags (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={editingRule.action.addTags?.join(', ') || ''}
                  onChangeText={(text) => {
                    const tags = text.split(',').map(tag => tag.trim()).filter(Boolean);
                    setEditingRule({
                      ...editingRule,
                      action: {
                        ...editingRule.action,
                        addTags: tags.length > 0 ? tags : undefined,
                      },
                    });
                  }}
                  placeholder="Enter tags (comma separated)"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        // Rules List
        <>
          {state.rules.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertCircle size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Rules Yet</Text>
              <Text style={styles.emptyStateText}>
                Create rules to automatically categorize your transactions based on payee, amount, and more.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddRule}
              >
                <Plus size={16} color={theme.colors.card} />
                <Text style={styles.emptyStateButtonText}>Create First Rule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={state.rules.sort((a, b) => a.priority - b.priority)}
              renderItem={renderRuleItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.rulesList}
            />
          )}
        </>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rulesList: {
    padding: 16,
  },
  ruleItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  ruleActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  ruleSummary: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  ruleConditionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  ruleCondition: {
    fontSize: 14,
    marginBottom: 2,
    paddingLeft: 8,
  },
  ruleActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  categoryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  ruleTags: {
    fontSize: 14,
    marginTop: 4,
    paddingLeft: 8,
    color: theme.colors.textSecondary,
  },
  ruleStats: {
    fontSize: 12,
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editorActions: {
    flexDirection: 'row',
  },
  editorScrollView: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  conditionsContainer: {
    marginBottom: 24,
  },
  conditionItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  conditionEditor: {
    marginTop: 8,
  },
  addConditionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  textConditionButton: {
    backgroundColor: theme.colors.primary,
  },
  amountConditionButton: {
    backgroundColor: theme.colors.secondary,
  },
  metadataConditionButton: {
    backgroundColor: theme.colors.warning,
  },
  addButtonText: {
    color: theme.colors.card,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionContainer: {
    marginBottom: 24,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categorySelectorText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selector: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
});
