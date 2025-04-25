import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Account, AccountSummary } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface AccountSummaryCardProps {
  accounts: Account[];
  summary: AccountSummary;
}

export default function AccountSummaryCard({ accounts, summary }: AccountSummaryCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
            <ArrowDownLeft size={18} color={theme.colors.success} />
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
            <ArrowUpRight size={18} color={theme.colors.error} />
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
        <ChevronRight size={16} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: theme.colors.text,
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
    color: theme.colors.text,
  },
  viewAll: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  balanceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  accountsCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeValue: {
    color: theme.colors.success,
  },
  expenseValue: {
    color: theme.colors.error,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
    fontWeight: '500',
  },
});