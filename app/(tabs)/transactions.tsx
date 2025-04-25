import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import TransactionItem from '@/components/transactions/TransactionItem';
import TransactionForm from '@/components/transactions/TransactionForm';
import { Transaction, TransactionType } from '@/types/transaction';
import { formatMonthYear } from '@/utils/dateUtils';
import { Plus, Search, Filter, Calendar, X, Wand2 } from 'lucide-react-native';
import { applyRules } from '@/utils/ruleUtils';
import { debounce } from 'lodash';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

export default function TransactionsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, dispatch } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TransactionType | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  // Filter transactions based on search, type, and date
  const filteredTransactions = React.useMemo(() => {
    let filtered = [...state.transactions];
    
    // Apply month filter
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });
    
    // Apply transaction type filter
    if (activeFilter) {
      filtered = filtered.filter(tx => tx.type === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.payee.toLowerCase().includes(query) ||
        tx.description.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.transactions, searchQuery, activeFilter, selectedMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you might fetch updated transaction data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };
  
  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setShowTransactionForm(true);
  };
  
  const handleSaveTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      // Update existing transaction
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: transaction
      });
    } else {
      // Add new transaction
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: transaction
      });
    }
    
    setShowTransactionForm(false);
  };
  
  const handleCancelTransaction = () => {
    setShowTransactionForm(false);
  };

  const navigateToPreviousMonth = () => {
    const previousMonth = new Date(selectedMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setSelectedMonth(previousMonth);
  };

  const navigateToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
  };

  const toggleFilter = (filter: TransactionType) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    debouncedSearch(text);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  // Apply categorization rules to all transactions
  const handleApplyRules = () => {
    // Get all transactions for the current month
    let transactions = [...filteredTransactions];
    
    // Skip transactions that already have categories
    const uncategorizedTransactions = transactions.filter(tx => !tx.categoryId);
    
    if (uncategorizedTransactions.length === 0) {
      alert('All transactions already have categories!');
      return;
    }
    
    // Apply rules to each transaction
    let categorizedCount = 0;
    uncategorizedTransactions.forEach(transaction => {
      const updatedTransaction = applyRules(state.rules, transaction);
      
      // If the transaction was categorized (rules matched)
      if (updatedTransaction.categoryId && updatedTransaction.categoryId !== transaction.categoryId) {
        categorizedCount++;
        
        // Update the transaction in the store
        dispatch({
          type: 'UPDATE_TRANSACTION',
          payload: updatedTransaction
        });
      }
    });
    
    // Show results
    if (categorizedCount > 0) {
      alert(`Successfully categorized ${categorizedCount} transactions!`);
    } else {
      alert('No transactions were categorized. Try creating more rules!');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Search Bar (conditionally rendered) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="search"
            autoFocus
            onChangeText={handleSearchChange}
          />
          <TouchableOpacity onPress={toggleSearch}>
            <X size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={navigateToPreviousMonth}>
          <Text style={styles.monthNavigator}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Calendar size={18} color={theme.colors.primary} style={styles.calendarIcon} />
          <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
        </View>
        
        <TouchableOpacity onPress={navigateToNextMonth}>
          <Text style={styles.monthNavigator}>→</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filters Row */}
      <View style={styles.filtersRow}>
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'income' && styles.activeFilterChip,
            ]}
            onPress={() => toggleFilter('income')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'income' && styles.activeFilterChipText,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'expense' && styles.activeFilterChip,
            ]}
            onPress={() => toggleFilter('expense')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'expense' && styles.activeFilterChipText,
              ]}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'transfer' && styles.activeFilterChip,
            ]}
            onPress={() => toggleFilter('transfer')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'transfer' && styles.activeFilterChipText,
              ]}
            >
              Transfers
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterActions}>
          {!showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleSearch}
            >
              <Search size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleApplyRules}
          >
            <Wand2 size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton}>
            <Filter size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem 
            transaction={item} 
            onPress={handleTransactionPress} 
          />
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Add a transaction to get started'
              }
            </Text>
          </View>
        }
      />
      
      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddTransaction}
      >
        <Plus size={24} color={theme.colors.card} />
      </TouchableOpacity>
      
      {/* Transaction Form Modal */}
      <Modal
        visible={showTransactionForm}
        animationType="slide"
        transparent={false}
      >
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onCancel={handleCancelTransaction}
        />
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 16,
    color: theme.colors.text,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthNavigator: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    paddingHorizontal: 12,
  },
  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 6,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeFilterChipText: {
    color: theme.colors.card,
  },
  filterActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});