import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import AccountCard from '@/components/accounts/AccountCard';
import { Account, AccountType, AccountClassification, DEFAULT_ACCOUNT_CLASSIFICATIONS } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { Plus, Filter, TrendingUp, TrendingDown } from 'lucide-react-native';
import AccountForm from '@/components/accounts/AccountForm';

export default function AccountsScreen() {
  const { state } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(false);
  const [classificationFilter, setClassificationFilter] = useState<AccountClassification | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Calculate totals
  const { totalBalance, visibleAccounts, assetAccounts, liabilityAccounts } = React.useMemo(() => {
    // Filter accounts based on selection
    let filteredAccounts = state.accounts;
    
    if (selectedFilter && selectedFilter !== 'all') {
      filteredAccounts = filteredAccounts.filter(
        account => account.type === selectedFilter
      );
    }
    
    // Filter by classification if selected
    if (classificationFilter) {
      filteredAccounts = filteredAccounts.filter(
        account => account.classification === classificationFilter
      );
    }
    
    // Filter by archived status
    filteredAccounts = filteredAccounts.filter(
      account => showArchivedAccounts ? account.isArchived : !account.isArchived
    );
    
    // Separate assets and liabilities
    const assets = filteredAccounts.filter(account => account.classification === 'asset');
    const liabilities = filteredAccounts.filter(account => account.classification === 'liability');
    
    // Calculate total balance of visible accounts
    const assetsTotal = assets.reduce((sum, account) => sum + account.balance, 0);
    const liabilitiesTotal = liabilities.reduce((sum, account) => sum + account.balance, 0);
    const netWorth = assetsTotal - liabilitiesTotal;
    
    return {
      totalBalance: netWorth,
      visibleAccounts: filteredAccounts,
      assetAccounts: assets,
      liabilityAccounts: liabilities,
    };
  }, [state.accounts, selectedFilter, classificationFilter, showArchivedAccounts]);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you'd fetch updated account data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAccountPress = (account: Account) => {
    // Open the account form with the selected account for editing
    setSelectedAccount(account);
    setShowAccountForm(true);
  };
  
  // Handle new account creation
  const handleAddAccount = () => {
    console.log('+ button clicked, opening account form');
    // Reset selected account and open the form
    setSelectedAccount(null);
    setShowAccountForm(true);
    console.log('showAccountForm set to:', true);
  };
  
  // Handle closing the account form
  const handleCloseAccountForm = () => {
    setShowAccountForm(false);
    setSelectedAccount(null);
  };

  // Get unique account types for filters
  const accountTypes = React.useMemo(() => {
    const types = new Set<AccountType>();
    state.accounts.forEach(account => types.add(account.type));
    return Array.from(types);
  }, [state.accounts]);
  
  // Toggle classification filter
  const toggleClassificationFilter = (classification: AccountClassification) => {
    if (classificationFilter === classification) {
      setClassificationFilter(null);
    } else {
      setClassificationFilter(classification);
    }
  };

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
          {showArchivedAccounts ? 'Archived Accounts' : 'Net Worth'}
        </Text>
        <Text style={[
          styles.summaryAmount,
          totalBalance < 0 ? styles.negativeBalance : null
        ]}>
          {formatCurrency(totalBalance)}
        </Text>
        
        <View style={styles.balanceBreakdown}>
          <View style={styles.balanceItem}>
            <View style={styles.balanceIconContainer}>
              <TrendingUp size={14} color="#34C759" />
            </View>
            <Text style={styles.balanceLabel}>Assets</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(assetAccounts.reduce((sum, a) => sum + a.balance, 0))}
            </Text>
          </View>
          
          <View style={styles.balanceDivider} />
          
          <View style={styles.balanceItem}>
            <View style={styles.balanceIconContainer}>
              <TrendingDown size={14} color="#FF3B30" />
            </View>
            <Text style={styles.balanceLabel}>Liabilities</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(liabilityAccounts.reduce((sum, a) => sum + a.balance, 0))}
            </Text>
          </View>
        </View>
        
        <Text style={styles.summarySubtitle}>
          {visibleAccounts.length} {visibleAccounts.length === 1 ? 'account' : 'accounts'}
        </Text>
      </View>
      
      {/* Classification Filter */}
      <View style={styles.classificationFilters}>
        <TouchableOpacity
          style={[
            styles.classificationButton,
            classificationFilter === 'asset' && styles.activeClassificationButton
          ]}
          onPress={() => toggleClassificationFilter('asset')}
        >
          <TrendingUp size={16} color={classificationFilter === 'asset' ? '#fff' : '#34C759'} />
          <Text style={[
            styles.classificationButtonText,
            classificationFilter === 'asset' && styles.activeClassificationText
          ]}>
            Assets
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.classificationButton,
            classificationFilter === 'liability' && styles.activeClassificationButton,
            styles.liabilityButton
          ]}
          onPress={() => toggleClassificationFilter('liability')}
        >
          <TrendingDown size={16} color={classificationFilter === 'liability' ? '#fff' : '#FF3B30'} />
          <Text style={[
            styles.classificationButtonText,
            classificationFilter === 'liability' && styles.activeClassificationText
          ]}>
            Liabilities
          </Text>
        </TouchableOpacity>
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
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddAccount}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
      
      {/* Account Form Modal */}
      <AccountForm
        isVisible={showAccountForm}
        onClose={handleCloseAccountForm}
        initialAccount={selectedAccount || undefined}
      />
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
    marginBottom: 12,
  },
  negativeBalance: {
    color: '#FF3B30',
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    width: '80%',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  classificationFilters: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  classificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  liabilityButton: {
    borderColor: '#FF3B30',
  },
  activeClassificationButton: {
    backgroundColor: '#34C759',
  },
  activeClassificationText: {
    color: 'white',
  },
  classificationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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