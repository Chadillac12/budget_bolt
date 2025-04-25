import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import AccountCard from '@/components/accounts/AccountCard';
import { Account, AccountType, AccountClassification } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { Plus, Filter, TrendingUp, TrendingDown } from 'lucide-react-native';
import AccountForm from '@/components/accounts/AccountForm';
import { ThemedScreen, ThemedText, ThemedButton } from '@/components/themed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

export default function AccountsScreen() {
  const { state } = useAppContext();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
      <ThemedText
        style={selectedFilter === type ? styles.selectedFilterChipText : styles.filterChipText}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedScreen>
      <StatusBar style="auto" />
      
      {/* Summary Header */}
      <View style={styles.summaryContainer}>
        <ThemedText variant="title" style={styles.summaryTitle} monospace={true}>
          {showArchivedAccounts ? 'Archived Accounts' : 'Net Worth'}
        </ThemedText>
        <ThemedText 
          variant="title" 
          style={styles.summaryAmount}
          color={totalBalance < 0 ? theme.colors.error : theme.colors.text}
        >
          {formatCurrency(totalBalance)}
        </ThemedText>
        
        <View style={styles.balanceBreakdown}>
          <View style={styles.balanceItem}>
            <View style={[styles.balanceIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <TrendingUp size={14} color={theme.colors.success} />
            </View>
            <ThemedText variant="label" style={styles.balanceLabel}>Assets</ThemedText>
            <ThemedText variant="body" style={styles.balanceValue}>
              {formatCurrency(assetAccounts.reduce((sum, a) => sum + a.balance, 0))}
            </ThemedText>
          </View>
          
          <View style={styles.balanceDivider} />
          
          <View style={styles.balanceItem}>
            <View style={[styles.balanceIconContainer, { backgroundColor: theme.colors.error + '20' }]}>
              <TrendingDown size={14} color={theme.colors.error} />
            </View>
            <ThemedText variant="label" style={styles.balanceLabel}>Liabilities</ThemedText>
            <ThemedText variant="body" style={styles.balanceValue}>
              {formatCurrency(liabilityAccounts.reduce((sum, a) => sum + a.balance, 0))}
            </ThemedText>
          </View>
        </View>
        
        <ThemedText variant="caption" style={styles.summarySubtitle} color={theme.colors.textSecondary}>
          {visibleAccounts.length} {visibleAccounts.length === 1 ? 'account' : 'accounts'}
        </ThemedText>
      </View>
      
      {/* Classification Filter */}
      <View style={styles.classificationFilters}>
        <TouchableOpacity
          style={[
            styles.classificationButton,
            classificationFilter === 'asset' && styles.activeAssetButton
          ]}
          onPress={() => toggleClassificationFilter('asset')}
        >
          <TrendingUp size={16} color={classificationFilter === 'asset' ? theme.colors.onPrimary : theme.colors.success} />
          <ThemedText 
            style={classificationFilter === 'asset' ? styles.activeClassificationText : styles.classificationButtonText}
            color={classificationFilter === 'asset' ? theme.colors.onPrimary : theme.colors.success}
          >
            Assets
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.classificationButton,
            classificationFilter === 'liability' && styles.activeLiabilityButton
          ]}
          onPress={() => toggleClassificationFilter('liability')}
        >
          <TrendingDown size={16} color={classificationFilter === 'liability' ? theme.colors.onPrimary : theme.colors.error} />
          <ThemedText 
            style={classificationFilter === 'liability' ? styles.activeClassificationText : styles.classificationButtonText}
            color={classificationFilter === 'liability' ? theme.colors.onPrimary : theme.colors.error}
          >
            Liabilities
          </ThemedText>
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
          <Filter size={18} color={theme.colors.primary} />
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
            <ThemedText style={styles.emptyStateText}>
              {showArchivedAccounts 
                ? 'No archived accounts found' 
                : 'No accounts found matching filters'}
            </ThemedText>
            {!showArchivedAccounts && (
              <ThemedButton 
                mode="contained"
                onPress={handleAddAccount}
              >
                Add Account
              </ThemedButton>
            )}
          </View>
        }
      />
      
      {/* Floating Action Button */}
      {!showArchivedAccounts && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddAccount}
        >
          <Plus size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      )}
      
      {/* Account Form Modal */}
      {showAccountForm && (
        <AccountForm
          isVisible={showAccountForm}
          onClose={handleCloseAccountForm}
          initialAccount={selectedAccount || undefined}
        />
      )}
    </ThemedScreen>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  summarySubtitle: {
    textAlign: 'center',
    marginTop: 4,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    marginBottom: 2,
  },
  balanceValue: {
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    height: '80%',
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
  },
  classificationFilters: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  classificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeAssetButton: {
    backgroundColor: theme.colors.success,
  },
  activeLiabilityButton: {
    backgroundColor: theme.colors.error,
  },
  classificationButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  activeClassificationText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  filtersScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
  },
  selectedFilterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Extra padding at bottom for FAB
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});