import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Account, AccountSummary } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react-native';

interface AccountSummaryCardProps {
  accounts: Account[];
  summary: AccountSummary;
}

export default function AccountSummaryCard({ accounts, summary }: AccountSummaryCardProps) {
  const router = useRouter();
  
  const navigateToAccounts = () => {
    router.push("/(tabs)/accounts");
  };
  
  // Count only non-archived accounts
  const activeAccountsCount = accounts.filter(acc => !acc.isArchived).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
        <TouchableOpacity onPress={navigateToAccounts}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>
          {formatCurrency(summary.totalBalance)}
        </Text>
        <Text style={styles.accountsCount}>
          {activeAccountsCount} active {activeAccountsCount === 1 ? 'account' : 'accounts'}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <ArrowDownLeft size={18} color="#34C759" />
          </View>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, styles.incomeValue]}>
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <ArrowUpRight size={18} color="#FF3B30" />
          </View>
          <View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, styles.expenseValue]}>
              {formatCurrency(summary.totalExpenses)}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.viewDetailsButton} onPress={navigateToAccounts}>
        <Text style={styles.viewDetailsText}>View Account Details</Text>
        <ChevronRight size={16} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#000',
  },
  viewAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  balanceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  accountsCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeValue: {
    color: '#34C759',
  },
  expenseValue: {
    color: '#FF3B30',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
    fontWeight: '500',
  },
});