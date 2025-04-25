import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  FlatList,
  Modal
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { Transaction, TransactionType, TransactionSplit } from '@/types/transaction';
import { Payee } from '@/types/payee';
import SplitTransaction from './SplitTransaction';
import { Calendar, DollarSign, Tag, FileText, Check, Wand2, Plus, Search, User } from 'lucide-react-native';
import { applyRules } from '@/utils/ruleUtils';
import { suggestPayee } from '@/utils/payeeUtils';
import PayeeForm from '@/components/payees/PayeeForm';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
// Using a simple date input approach instead of a dedicated date picker

interface TransactionFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing transactions
 * Supports both regular and split transactions
 */
export default function TransactionForm({
  transaction,
  onSave,
  onCancel
}: TransactionFormProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, dispatch } = useAppContext();
  const isEditing = !!transaction;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Transaction>>({
    id: transaction?.id || `tx_${Date.now()}`,
    accountId: transaction?.accountId || (state.accounts.length > 0 ? state.accounts[0].id : ''),
    date: transaction?.date || new Date(),
    payee: transaction?.payee || '',
    payeeId: transaction?.payeeId || '',
    amount: transaction?.amount || 0,
    type: transaction?.type || 'expense',
    categoryId: transaction?.categoryId || '',
    description: transaction?.description || '',
    isReconciled: transaction?.isReconciled || false,
    isCleared: transaction?.isCleared || false,
    tags: transaction?.tags || [],
    isSplit: transaction?.isSplit || false,
    splits: transaction?.splits || [],
    createdAt: transaction?.createdAt || new Date(),
    updatedAt: new Date(),
  });
  
  // UI state
  const [amountText, setAmountText] = useState(formData.amount?.toString() || '');
  const [payeeSearchQuery, setPayeeSearchQuery] = useState('');
  const [showPayeeSelector, setShowPayeeSelector] = useState(false);
  const [showPayeeForm, setShowPayeeForm] = useState(false);
  
  // Initialize splits if this is a split transaction
  useEffect(() => {
    if (formData.isSplit && (!formData.splits || formData.splits.length === 0)) {
      // Create an initial split with the full amount
      const initialSplit: TransactionSplit = {
        id: `split_${Date.now()}`,
        categoryId: formData.categoryId || '',
        amount: formData.amount || 0,
      };
      
      setFormData(prev => ({
        ...prev,
        splits: [initialSplit]
      }));
    }
  }, [formData.isSplit]);
  
  // Handle form field changes
  const handleChange = (field: keyof Transaction, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get selected payee
  const selectedPayee = useMemo(() => {
    if (!formData.payeeId) return undefined;
    return state.payees.find(p => p.id === formData.payeeId);
  }, [formData.payeeId, state.payees]);

  // Filter payees based on search query
  const filteredPayees = useMemo(() => {
    if (!payeeSearchQuery) {
      return state.payees;
    }
    
    return state.payees.filter(payee =>
      payee.name.toLowerCase().includes(payeeSearchQuery.toLowerCase()) ||
      (payee.alias && payee.alias.some(alias =>
        alias.toLowerCase().includes(payeeSearchQuery.toLowerCase())
      ))
    );
  }, [state.payees, payeeSearchQuery]);

  // Apply categorization rules based on current transaction data
  const applyCategorizationRules = () => {
    // Only apply rules if we have a payee and amount
    if ((!formData.payee && !formData.payeeId) || !formData.amount) {
      return;
    }

    // Don't apply rules to split transactions
    if (formData.isSplit) {
      return;
    }

    // Create a temporary transaction object for rule evaluation
    const tempTransaction: Transaction = {
      ...formData as Transaction,
      // Ensure required fields are present
      id: formData.id || `tx_${Date.now()}`,
      accountId: formData.accountId || '',
      date: formData.date || new Date(),
      description: formData.description || '',
      isReconciled: formData.isReconciled || false,
      isCleared: formData.isCleared || false,
      tags: formData.tags || [],
      createdAt: formData.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Apply rules from the app context
    const updatedTransaction = applyRules(state.rules, tempTransaction);

    // Update the form if a category was assigned
    if (updatedTransaction.categoryId && updatedTransaction.categoryId !== formData.categoryId) {
      setFormData(prev => ({
        ...prev,
        categoryId: updatedTransaction.categoryId,
        tags: updatedTransaction.tags // Also update tags if they were modified
      }));
    }
  };
  
  // Handle amount change with validation
  const handleAmountChange = (text: string) => {
    setAmountText(text);
    const amount = parseFloat(text) || 0;
    
    handleChange('amount', amount);
    
    // Try to apply rules when amount changes
    if (formData.payee || formData.payeeId) {
      applyCategorizationRules();
    }
    
    // If this is a split transaction, we need to update the splits
    if (formData.isSplit && formData.splits && formData.splits.length > 0) {
      // Calculate the difference between the new amount and the sum of all splits
      const currentSplitsTotal = formData.splits.reduce((sum, split) => sum + split.amount, 0);
      const difference = amount - currentSplitsTotal;
      
      if (difference !== 0) {
        // Adjust the first split to account for the difference
        const updatedSplits = [...formData.splits];
        updatedSplits[0] = {
          ...updatedSplits[0],
          amount: updatedSplits[0].amount + difference
        };
        
        handleChange('splits', updatedSplits);
      }
    }
  };
  
  // Toggle split transaction mode
  const handleToggleSplit = (value: boolean) => {
    handleChange('isSplit', value);
  };
  
  // Handle split changes
  const handleSplitsChange = (splits: TransactionSplit[]) => {
    handleChange('splits', splits);
  };
  
  // Handle date selection
  const handleDateChange = (dateString: string) => {
    try {
      const selectedDate = new Date(dateString);
      if (!isNaN(selectedDate.getTime())) {
        handleChange('date', selectedDate);
      }
    } catch (error) {
      console.error('Invalid date format', error);
    }
  };
  
  // Validate the form before saving
  const validateForm = (): boolean => {
    if (!formData.accountId) {
      Alert.alert('Error', 'Please select an account');
      return false;
    }
    
    if (!formData.payee && !formData.payeeId) {
      Alert.alert('Error', 'Please enter a payee');
      return false;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    if (!formData.isSplit && !formData.categoryId) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    
    if (formData.isSplit && (!formData.splits || formData.splits.length === 0)) {
      Alert.alert('Error', 'Split transactions must have at least one split');
      return false;
    }
    
    if (formData.isSplit && formData.splits) {
      // Check if all splits have categories
      const hasInvalidSplits = formData.splits.some(split => !split.categoryId);
      if (hasInvalidSplits) {
        Alert.alert('Error', 'All splits must have a category');
        return false;
      }
      
      // Check if the sum of splits equals the total amount
      const splitsTotal = formData.splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(splitsTotal - (formData.amount || 0)) > 0.01) { // Allow for small rounding errors
        Alert.alert('Error', 'The sum of splits must equal the transaction amount');
        return false;
      }
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // If this is not a split transaction, make sure splits is undefined
    if (!formData.isSplit) {
      formData.splits = undefined;
    }
    
    onSave(formData as Transaction);
  };
  
  // Handle payee selection
  const handleSelectPayee = (payee: Payee) => {
    setFormData(prev => ({
      ...prev,
      payee: payee.name,
      payeeId: payee.id
    }));
    setShowPayeeSelector(false);
    
    // Try to apply rules when payee changes
    setTimeout(() => applyCategorizationRules(), 100);
  };
  
  // Handle creating a new payee
  const handleCreatePayee = (payee: Payee) => {
    // Add the payee to the app state
    dispatch({
      type: 'ADD_PAYEE',
      payload: payee
    });
    
    // Select the new payee
    handleSelectPayee(payee);
    setShowPayeeForm(false);
  };
  
  // Get the selected account
  const selectedAccount = state.accounts.find(acc => acc.id === formData.accountId);
  
  // Get the selected category
  const selectedCategory = state.categories.find(cat => cat.id === formData.categoryId);
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </Text>
      </View>
      
      {/* Transaction Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'income' && styles.activeTypeButton
          ]}
          onPress={() => handleChange('type', 'income')}
        >
          <Text style={[
            styles.typeButtonText,
            formData.type === 'income' && styles.activeTypeButtonText
          ]}>
            Income
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'expense' && styles.activeTypeButton
          ]}
          onPress={() => handleChange('type', 'expense')}
        >
          <Text style={[
            styles.typeButtonText,
            formData.type === 'expense' && styles.activeTypeButtonText
          ]}>
            Expense
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'transfer' && styles.activeTypeButton
          ]}
          onPress={() => handleChange('type', 'transfer')}
        >
          <Text style={[
            styles.typeButtonText,
            formData.type === 'transfer' && styles.activeTypeButtonText
          ]}>
            Transfer
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Account Selector */}
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
            {selectedAccount?.name || 'Select Account'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Date Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Date</Text>
        <View style={styles.inputContainer}>
          <Calendar size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={formData.date ? formData.date.toISOString().split('T')[0] : ''}
            onChangeText={handleDateChange}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      
      {/* Payee Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Payee</Text>
        <TouchableOpacity
          style={styles.payeeSelector}
          onPress={() => setShowPayeeSelector(true)}
        >
          <User size={16} color={theme.colors.textSecondary} style={styles.payeeSelectorIcon} />
          <Text style={styles.payeeSelectorText}>
            {selectedPayee ? selectedPayee.name : formData.payee || 'Select Payee'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Payee Selector Modal */}
      <Modal
        visible={showPayeeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayeeSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.payeeSelectorModal}>
            <View style={styles.payeeSelectorHeader}>
              <Text style={styles.payeeSelectorTitle}>Select Payee</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPayeeSelector(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.payeeSearchContainer}>
              <View style={styles.payeeSearchInputContainer}>
                <Search size={16} color={theme.colors.textSecondary} style={styles.payeeSearchIcon} />
                <TextInput
                  style={styles.payeeSearchInput}
                  value={payeeSearchQuery}
                  onChangeText={setPayeeSearchQuery}
                  placeholder="Search payees"
                  clearButtonMode="while-editing"
                  autoFocus
                />
              </View>
              
              <TouchableOpacity
                style={styles.createPayeeButton}
                onPress={() => {
                  setShowPayeeSelector(false);
                  setShowPayeeForm(true);
                }}
              >
                <Plus size={16} color={theme.colors.card} />
              </TouchableOpacity>
            </View>
            
            {/* Manual Entry Option */}
            <TouchableOpacity
              style={styles.manualEntryOption}
              onPress={() => {
                setFormData(prev => ({
                  ...prev,
                  payee: payeeSearchQuery || '',
                  payeeId: ''
                }));
                setShowPayeeSelector(false);
              }}
            >
              <Text style={styles.manualEntryText}>
                {payeeSearchQuery ? `Use "${payeeSearchQuery}"` : 'Enter manually'}
              </Text>
            </TouchableOpacity>
            
            <FlatList
              data={filteredPayees}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.payeeOption}
                  onPress={() => handleSelectPayee(item)}
                >
                  <Text style={styles.payeeOptionName}>{item.name}</Text>
                  {item.alias && item.alias.length > 0 && (
                    <Text style={styles.payeeOptionAlias}>
                      Also: {item.alias.join(', ')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPayeeList}>
                  <Text style={styles.emptyPayeeText}>
                    No payees found. Try a different search or create a new payee.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      
      {/* Create Payee Modal */}
      <Modal
        visible={showPayeeForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayeeForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <PayeeForm
              payee={{
                id: `payee_${Date.now()}`,
                name: payeeSearchQuery,
                categoryIds: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              }}
              onSave={handleCreatePayee}
              onCancel={() => {
                setShowPayeeForm(false);
                setShowPayeeSelector(true);
              }}
            />
          </View>
        </View>
      </Modal>
      
      {/* Amount Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.inputContainer}>
          <DollarSign size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
      </View>
      
      {/* Split Transaction Toggle */}
      <View style={styles.formGroup}>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Split Transaction</Text>
          <Switch
            value={formData.isSplit}
            onValueChange={handleToggleSplit}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
      </View>
      
      {/* Category Selector (only shown for non-split transactions) */}
      {!formData.isSplit && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {
              // In a real implementation, this would open a category picker
              Alert.alert(
                "Select Category",
                "Category picker would open here"
              );
            }}
          >
            <View 
              style={[
                styles.categoryIndicator, 
                { backgroundColor: selectedCategory?.color || theme.colors.border }
              ]}
            />
            <Text style={styles.selectorText}>
              {selectedCategory?.name || 'Select Category'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Split Transaction Component (only shown for split transactions) */}
      {formData.isSplit && formData.splits && (
        <SplitTransaction
          splits={formData.splits}
          totalAmount={formData.amount || 0}
          currency={selectedAccount?.currency || 'USD'}
          onSplitsChange={handleSplitsChange}
        />
      )}
      
      {/* Description Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <View style={styles.inputContainer}>
          <FileText size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            placeholder="Optional description"
            multiline
          />
        </View>
      </View>
      
      {/* Tags Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.inputContainer}>
          <Tag size={16} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Add tags (comma separated)"
            value={formData.tags?.join(', ')}
            onChangeText={(text) => {
              const tags = text.split(',').map(tag => tag.trim()).filter(Boolean);
              handleChange('tags', tags);
            }}
          />
        </View>
      </View>
      
      {/* Cleared/Reconciled Toggles */}
      <View style={styles.formGroup}>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Cleared</Text>
          <Switch
            value={formData.isCleared}
            onValueChange={(value) => handleChange('isCleared', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.success }}
          />
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Reconciled</Text>
          <Switch
            value={formData.isReconciled}
            onValueChange={(value) => handleChange('isReconciled', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
          />
        </View>
      </View>
      
      {/* Auto-categorize Button */}
      {!formData.isSplit && (
        <View style={styles.formGroup}>
          <TouchableOpacity
            style={styles.autoCategorizeButton}
            onPress={applyCategorizationRules}
          >
            <Wand2 size={16} color={theme.colors.card} style={styles.buttonIcon} />
            <Text style={styles.autoCategorizeButtonText}>
              Auto-Categorize
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
        >
          <Check size={16} color={theme.colors.card} style={styles.buttonIcon} />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
  payeeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  payeeSelectorIcon: {
    marginRight: 8,
  },
  payeeSelectorText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.primary,
  },
  payeeSelectorModal: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  payeeSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  payeeSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  payeeSearchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  payeeSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  payeeSearchIcon: {
    marginRight: 8,
  },
  payeeSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  createPayeeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualEntryOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  manualEntryText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  payeeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  payeeOptionName: {
    fontSize: 16,
    marginBottom: 4,
  },
  payeeOptionAlias: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyPayeeList: {
    padding: 16,
    alignItems: 'center',
  },
  emptyPayeeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    margin: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTypeButton: {
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  typeButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeTypeButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  formGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.primary,
  },
  categoryIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  autoCategorizeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  autoCategorizeButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});