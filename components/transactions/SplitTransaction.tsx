import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { TransactionSplit } from '@/types/transaction';
import { formatCurrency } from '@/utils/dateUtils';
import { Plus, Trash2, DollarSign } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface SplitTransactionProps {
  splits: TransactionSplit[];
  totalAmount: number;
  currency?: string;
  onSplitsChange: (splits: TransactionSplit[]) => void;
  readOnly?: boolean;
}

/**
 * Component for managing split transactions
 * Allows adding, editing, and removing splits
 */
export default function SplitTransaction({
  splits,
  totalAmount,
  currency = 'USD',
  onSplitsChange,
  readOnly = false
}: SplitTransactionProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state } = useAppContext();
  const [remainingAmount, setRemainingAmount] = useState(() => {
    const allocatedAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    return totalAmount - allocatedAmount;
  });

  // Generate a unique ID for new splits
  const generateSplitId = () => {
    return 'split_' + Math.random().toString(36).substr(2, 9);
  };

  // Add a new split
  const handleAddSplit = () => {
    if (remainingAmount <= 0) {
      Alert.alert(
        "Cannot Add Split",
        "The total amount has already been allocated. Adjust existing splits first."
      );
      return;
    }

    const newSplit: TransactionSplit = {
      id: generateSplitId(),
      categoryId: '', // Will be selected by user
      amount: remainingAmount,
      description: ''
    };

    const updatedSplits = [...splits, newSplit];
    onSplitsChange(updatedSplits);
    setRemainingAmount(0);
  };

  // Remove a split
  const handleRemoveSplit = (splitId: string) => {
    const splitToRemove = splits.find(s => s.id === splitId);
    if (!splitToRemove) return;

    const updatedSplits = splits.filter(s => s.id !== splitId);
    onSplitsChange(updatedSplits);
    
    // Update remaining amount
    setRemainingAmount(prev => prev + splitToRemove.amount);
  };

  // Update a split's category
  const handleCategoryChange = (splitId: string, categoryId: string) => {
    const updatedSplits = splits.map(split => 
      split.id === splitId ? { ...split, categoryId } : split
    );
    onSplitsChange(updatedSplits);
  };

  // Update a split's amount
  const handleAmountChange = (splitId: string, amountText: string) => {
    // Parse the amount, defaulting to 0 if invalid
    const newAmount = parseFloat(amountText) || 0;
    
    // Find the split being updated
    const splitIndex = splits.findIndex(s => s.id === splitId);
    if (splitIndex === -1) return;
    
    const oldAmount = splits[splitIndex].amount;
    
    // Calculate how much this change affects the remaining amount
    const amountDifference = oldAmount - newAmount;
    const newRemainingAmount = remainingAmount + amountDifference;
    
    // Don't allow negative remaining amounts
    if (newRemainingAmount < 0) {
      Alert.alert(
        "Invalid Amount",
        "The total of all splits cannot exceed the transaction amount."
      );
      return;
    }
    
    // Update the split and remaining amount
    const updatedSplits = [...splits];
    updatedSplits[splitIndex] = { ...updatedSplits[splitIndex], amount: newAmount };
    
    onSplitsChange(updatedSplits);
    setRemainingAmount(newRemainingAmount);
  };

  // Update a split's description
  const handleDescriptionChange = (splitId: string, description: string) => {
    const updatedSplits = splits.map(split => 
      split.id === splitId ? { ...split, description } : split
    );
    onSplitsChange(updatedSplits);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Split Transaction</Text>
        <Text style={styles.totalAmount}>
          Total: {formatCurrency(totalAmount, currency)}
        </Text>
      </View>
      
      {remainingAmount > 0 && (
        <View style={styles.remainingContainer}>
          <Text style={styles.remainingLabel}>Remaining:</Text>
          <Text style={styles.remainingAmount}>
            {formatCurrency(remainingAmount, currency)}
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.splitsContainer}>
        {splits.map((split) => {
          const category = state.categories.find(cat => cat.id === split.categoryId);
          
          return (
            <View key={split.id} style={styles.splitItem}>
              <View style={styles.splitHeader}>
                <View 
                  style={[
                    styles.categoryIndicator, 
                    { backgroundColor: category?.color || theme.colors.border }
                  ]}
                />
                
                {!readOnly && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveSplit(split.id)}
                  >
                    <Trash2 size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.splitRow}>
                <Text style={styles.fieldLabel}>Category:</Text>
                {readOnly ? (
                  <Text style={styles.fieldValue}>
                    {category?.name || 'Uncategorized'}
                  </Text>
                ) : (
                  <TouchableOpacity 
                    style={styles.categorySelector}
                    onPress={() => {
                      // In a real implementation, this would open a category picker
                      // For now, we'll just use a placeholder
                      Alert.alert(
                        "Select Category",
                        "Category picker would open here"
                      );
                    }}
                  >
                    <Text style={styles.categorySelectorText}>
                      {category?.name || 'Select Category'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.splitRow}>
                <Text style={styles.fieldLabel}>Amount:</Text>
                {readOnly ? (
                  <Text style={styles.fieldValue}>
                    {formatCurrency(split.amount, currency)}
                  </Text>
                ) : (
                  <View style={styles.amountInputContainer}>
                    <DollarSign size={16} color={theme.colors.textSecondary} />
                    <TextInput
                      style={styles.amountInput}
                      value={split.amount.toString()}
                      onChangeText={(text) => handleAmountChange(split.id, text)}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.splitRow}>
                <Text style={styles.fieldLabel}>Description:</Text>
                {readOnly ? (
                  <Text style={styles.fieldValue}>
                    {split.description || 'No description'}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.descriptionInput}
                    value={split.description || ''}
                    onChangeText={(text) => handleDescriptionChange(split.id, text)}
                    placeholder="Optional description"
                  />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {!readOnly && (
        <TouchableOpacity 
          style={[
            styles.addSplitButton,
            remainingAmount <= 0 && styles.disabledButton
          ]}
          onPress={handleAddSplit}
          disabled={remainingAmount <= 0}
        >
          <Plus size={16} color={theme.colors.card} />
          <Text style={styles.addSplitButtonText}>Add Split</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  remainingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  remainingLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  splitsContainer: {
    maxHeight: 300,
  },
  splitItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryIndicator: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  removeButton: {
    padding: 4,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    width: 100,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
  },
  categorySelector: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 6,
  },
  categorySelectorText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  amountInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 4,
  },
  descriptionInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
  },
  addSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#A2A2A2',
  },
  addSplitButtonText: {
    color: theme.colors.card,
    fontWeight: '600',
    marginLeft: 8,
  },
});