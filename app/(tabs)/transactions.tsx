import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import TransactionItem from '@/components/transactions/TransactionItem';
import { Transaction, TransactionType } from '@/types/transaction';
import { formatMonthYear } from '@/utils/dateUtils';
import { Plus, Search, Filter, Calendar, X } from 'lucide-react-native';
import { debounce } from 'lodash';

export default function TransactionsScreen() {
  const { state } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TransactionType | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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
    // In a real app, navigate to transaction details
    console.log('Transaction pressed:', transaction.id);
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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Search Bar (conditionally rendered) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#8E8E93"
            returnKeyType="search"
            autoFocus
            onChangeText={handleSearchChange}
          />
          <TouchableOpacity onPress={toggleSearch}>
            <X size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={navigateToPreviousMonth}>
          <Text style={styles.monthNavigator}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Calendar size={18} color="#007AFF" style={styles.calendarIcon} />
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
              <Search size={18} color="#007AFF" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.iconButton}>
            <Filter size={18} color="#007AFF" />
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
      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 16,
    color: '#000',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  monthNavigator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
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
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  activeFilterChipText: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
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
    color: '#000',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});