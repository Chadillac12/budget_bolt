import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import AccountCard from '@/components/accounts/AccountCard';
import { Account, AccountType } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { Plus, Filter } from 'lucide-react-native';

export default function AccountsScreen() {
  const { state } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(false);

  // Calculate totals
  const { totalBalance, visibleAccounts } = React.useMemo(() => {
    // Filter accounts based on selection
    let filteredAccounts = state.accounts;
    
    if (selectedFilter) {
      filteredAccounts = filteredAccounts.filter(
        account => account.type === selectedFilter
      );
    }
    
    // Filter by archived status
    filteredAccounts = filteredAccounts.filter(
      account => showArchivedAccounts ? account.isArchived : !account.isArchived
    );
    
    // Calculate total balance of visible accounts
    const total = filteredAccounts.reduce(
      (sum, account) => sum + account.balance, 
      0
    );
    
    return {
      totalBalance: total,
      visibleAccounts: filteredAccounts,
    };
  }, [state.accounts, selectedFilter, showArchivedAccounts]);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you'd fetch updated account data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAccountPress = (account: Account) => {
    // In a real app, this would navigate to the account details screen
    console.log('Account pressed:', account.id);
  };

  // Get unique account types for filters
  const accountTypes = React.useMemo(() => {
    const types = new Set<AccountType>();
    state.accounts.forEach(account => types.add(account.type));
    return Array.from(types);
  }, [state.accounts]);

  const renderFilterChip = (type: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === type && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedFilter(selectedFilter === type ? null : type)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedFilter === type && styles.selectedFilterChipText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Summary Header */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>
          {showArchivedAccounts ? 'Archived Accounts' : 'Total Balance'}
        </Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(totalBalance)}
        </Text>
        <Text style={styles.summarySubtitle}>
          {visibleAccounts.length} {visibleAccounts.length === 1 ? 'account' : 'accounts'}
        </Text>
      </View>
      
      {/* Filter Row */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {renderFilterChip('all', 'All')}
          {accountTypes.map((type) => (
            renderFilterChip(
              type, 
              type.charAt(0).toUpperCase() + type.slice(1)
            )
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowArchivedAccounts(!showArchivedAccounts)}
        >
          <Filter size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Accounts List */}
      <FlatList
        data={visibleAccounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AccountCard 
            account={item} 
            onPress={handleAccountPress} 
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {showArchivedAccounts 
                ? 'No archived accounts found' 
                : 'No accounts found'
              }
            </Text>
          </View>
        }
      />
      
      {/* Add Account Button */}
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
  summaryContainer: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersScroll: {
    flexGrow: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  selectedFilterChipText: {
    color: 'white',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
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