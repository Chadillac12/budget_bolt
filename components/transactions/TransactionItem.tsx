import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { useAppContext } from '@/context/AppContext';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Check, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ThemedText } from '@/components/themed';
import { Theme } from '@/context/theme';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { state } = useAppContext();
  const theme = useAppTheme();
  
  // Find category for this transaction
  const category = transaction.isSplit
    ? null // For split transactions, we'll show multiple categories
    : state.categories.find(cat => cat.id === transaction.categoryId);
  
  // Find account for this transaction
  const account = state.accounts.find(acc => acc.id === transaction.accountId);
  
  // Get categories for split transaction
  const splitCategories = transaction.isSplit && transaction.splits
    ? transaction.splits.map(split => {
        const cat = state.categories.find(c => c.id === split.categoryId);
        return {
          ...split,
          name: cat?.name || 'Uncategorized',
          color: cat?.color || theme.colors.textSecondary
        };
      })
    : [];
  
  const styles = useThemedStyles(createStyles);
  
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'income':
        return <ArrowDownLeft size={18} color={theme.colors.success} />;
      case 'expense':
        return <ArrowUpRight size={18} color={theme.colors.error} />;
      case 'transfer':
        return <ArrowLeftRight size={18} color={theme.colors.secondary} />;
      default:
        return <ArrowUpRight size={18} color={theme.colors.error} />;
    }
  };

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return theme.colors.success;
      case 'expense':
        return theme.colors.error;
      case 'transfer':
        return theme.colors.secondary;
      default:
        return theme.colors.text;
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[
          styles.categoryIcon,
          { backgroundColor: category?.color || theme.colors.textSecondary }
        ]}>
          {getTransactionIcon()}
        </View>
        
        <View style={styles.infoContainer}>
          <Text 
            style={[styles.payee, { color: theme.colors.text }]} 
            numberOfLines={1}
          >
            {transaction.payee}
          </Text>
          
          <View style={styles.detailsRow}>
            <Text 
              style={[styles.date, { color: theme.colors.textSecondary }]}
            >
              {formatDate(new Date(transaction.date))}
            </Text>
            
            {transaction.isSplit ? (
              <View style={styles.splitIndicator}>
                <Text style={[styles.splitText, { color: theme.colors.onPrimary }]}>
                  Split
                </Text>
              </View>
            ) : category && (
              <View style={styles.categoryPill}>
                <Text 
                  style={[styles.categoryText, { color: theme.colors.textSecondary }]} 
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
              </View>
            )}
            
            {account && (
              <Text 
                style={[styles.accountName, { color: theme.colors.textSecondary }]} 
                numberOfLines={1}
              >
                {account.name}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: getAmountColor() }]}>
          {getAmountPrefix()}
          {formatCurrency(Math.abs(transaction.amount), account?.currency || 'USD')}
        </Text>
        
        {transaction.isReconciled ? (
          <View style={styles.reconciledIndicator}>
            <CheckCircle2 size={12} color={theme.colors.secondary} />
            <Text style={[styles.reconciledText, { color: theme.colors.secondary }]}>
              Reconciled
            </Text>
          </View>
        ) : transaction.isCleared && (
          <View style={styles.clearedIndicator}>
            <Check size={12} color={theme.colors.success} />
            <Text style={[styles.clearedText, { color: theme.colors.success }]}>
              Cleared
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  splitIndicator: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  splitText: {
    fontSize: 12,
    fontWeight: '500',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  payee: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    marginRight: 8,
  },
  categoryPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
  },
  accountName: {
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clearedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearedText: {
    fontSize: 12,
    marginLeft: 2,
  },
  reconciledIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reconciledText: {
    fontSize: 12,
    marginLeft: 2,
  },
});