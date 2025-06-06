import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Payee } from '@/types/payee';
import { useAppContext } from '@/context/AppContext';
import { Edit, Trash2, MoreHorizontal, DollarSign, Clock } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface PayeeItemProps {
  payee: Payee;
  onEdit: (payee: Payee) => void;
  onDelete: (payee: Payee) => void;
  onViewTransactions: (payee: Payee) => void;
}

/**
 * Component to display a single payee in the payee list
 */
export default function PayeeItem({
  payee,
  onEdit,
  onDelete,
  onViewTransactions
}: PayeeItemProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state } = useAppContext();
  
  // Get categories for this payee
  const categories = state.payeeCategories.filter(
    category => payee.categoryIds.includes(category.id)
  );
  
  // Get transaction count for this payee
  const transactionCount = state.transactions.filter(
    t => t.payeeId === payee.id || 
    (!t.payeeId && t.payee.toLowerCase() === payee.name.toLowerCase())
  ).length;
  
  // Format the last transaction date if available
  const formattedLastTransactionDate = payee.lastTransactionDate 
    ? payee.lastTransactionDate.toLocaleDateString() 
    : 'Never';
  
  return (
    <View style={[
      styles.container,
      !payee.isActive && styles.inactiveContainer
    ]}>
      <View style={styles.header}>
        <Text style={styles.name}>{payee.name}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onViewTransactions(payee)}
          >
            <DollarSign size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(payee)}
          >
            <Edit size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(payee)}
          >
            <Trash2 size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          {categories.map(category => (
            <View 
              key={category.id} 
              style={[
                styles.categoryBadge,
                { backgroundColor: category.color || theme.colors.border }
              ]}
            >
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Transaction info */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <DollarSign size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
          <Text style={styles.statText}>{transactionCount} transactions</Text>
        </View>
        
        <View style={styles.statItem}>
          <Clock size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
          <Text style={styles.statText}>Last: {formattedLastTransactionDate}</Text>
        </View>
      </View>
      
      {/* Aliases (if any) */}
      {payee.alias && payee.alias.length > 0 && (
        <View style={styles.aliasContainer}>
          <Text style={styles.aliasLabel}>Also known as: </Text>
          <Text style={styles.aliasText}>{payee.alias.join(', ')}</Text>
        </View>
      )}
      
      {/* Inactive indicator */}
      {!payee.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Inactive</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inactiveContainer: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.card,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  aliasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aliasLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  aliasText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  inactiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveText: {
    color: theme.colors.card,
    fontSize: 10,
    fontWeight: '600',
  },
});