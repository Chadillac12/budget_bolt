import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { useAppContext } from '@/context/AppContext';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Check } from 'lucide-react-native';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { state } = useAppContext();
  
  // Find category for this transaction
  const category = state.categories.find(cat => cat.id === transaction.categoryId);
  
  // Find account for this transaction
  const account = state.accounts.find(acc => acc.id === transaction.accountId);
  
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'income':
        return <ArrowDownLeft size={18} color="#34C759" />;
      case 'expense':
        return <ArrowUpRight size={18} color="#FF3B30" />;
      case 'transfer':
        return <ArrowLeftRight size={18} color="#5856D6" />;
      default:
        return <ArrowUpRight size={18} color="#FF3B30" />;
    }
  };

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return '#34C759';
      case 'expense':
        return '#FF3B30';
      case 'transfer':
        return '#5856D6';
      default:
        return '#000';
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
          { backgroundColor: category?.color || '#E5E5EA' }
        ]}>
          {getTransactionIcon()}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.payee} numberOfLines={1}>
            {transaction.payee}
          </Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.date}>
              {formatDate(new Date(transaction.date))}
            </Text>
            
            {category && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {category.name}
                </Text>
              </View>
            )}
            
            {account && (
              <Text style={styles.accountName} numberOfLines={1}>
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
        
        {transaction.isCleared && (
          <View style={styles.clearedIndicator}>
            <Check size={12} color="#34C759" />
            <Text style={styles.clearedText}>Cleared</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
    color: '#000',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  categoryPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  accountName: {
    fontSize: 12,
    color: '#8E8E93',
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
    color: '#34C759',
    marginLeft: 2,
  },
});