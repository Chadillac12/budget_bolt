import React from 'react';
import { View, Pressable } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { formatCurrency } from '@/utils/formatters';
import { useAppContext } from '@/context/AppContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  ThemedDashboardCard,
  ThemedText,
  ThemedIconContainer,
  ThemedStatCard,
  ThemedDivider,
} from '@/components/themed';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from '@/components/icons';

interface AccountSummaryCardProps {
  onViewAll?: () => void;
  onViewDetails?: () => void;
}

/**
 * A themed account summary card that displays total balance and account metrics
 * Uses theme-aware components for consistent styling
 */
export default function AccountSummaryCard({
  onViewAll,
  onViewDetails,
}: AccountSummaryCardProps) {
  const { state } = useAppContext();
  const { accounts, transactions } = state;
  const theme = useAppTheme();
  
  // Calculate summary values
  const activeAccounts = accounts.filter(account => account.isActive);
  const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Calculate income and expenses based on transactions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const totalIncome = transactions
    .filter(tx => tx.type === 'income' && new Date(tx.date) >= thirtyDaysAgo)
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense' && new Date(tx.date) >= thirtyDaysAgo)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Theme-aware styles
  const styles = useThemedStyles((theme) => ({
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
    },
    statWrapper: {
      alignItems: 'center',
      flexDirection: 'row',
      flex: 1,
    },
    statContent: {
      marginLeft: theme.spacing.sm,
    },
    viewDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm,
      marginTop: theme.spacing.md,
    }
  }));

  return (
    <ThemedDashboardCard
      title="Accounts"
      titleRight={
        <ThemedText
          onPress={onViewAll}
          variant="body"
          style={{ color: theme.colors.primary }}
        >
          View All
        </ThemedText>
      }
    >
      {/* Balance Summary */}
      <ThemedStatCard
        title="Total Balance"
        value={formatCurrency(totalBalance)}
        subtitle={`${activeAccounts.length} active accounts`}
        alignment="left"
      />
      
      <ThemedDivider />
      
      {/* Income & Expense Metrics */}
      <View style={styles.statsContainer}>
        <View style={styles.statWrapper}>
          <ThemedIconContainer variant="success" size={32}>
            <ArrowDownLeft size={18} color={theme.colors.success} />
          </ThemedIconContainer>
          
          <View style={styles.statContent}>
            <ThemedText variant="caption" style={{ marginBottom: theme.spacing.xs }}>
              Income
            </ThemedText>
            <ThemedText variant="subtitle" style={{ color: theme.colors.success }}>
              {formatCurrency(totalIncome)}
            </ThemedText>
          </View>
        </View>
        
        <ThemedDivider orientation="vertical" length={40} />
        
        <View style={styles.statWrapper}>
          <ThemedIconContainer variant="error" size={32}>
            <ArrowUpRight size={18} color={theme.colors.error} />
          </ThemedIconContainer>
          
          <View style={styles.statContent}>
            <ThemedText variant="caption" style={{ marginBottom: theme.spacing.xs }}>
              Expenses
            </ThemedText>
            <ThemedText variant="subtitle" style={{ color: theme.colors.error }}>
              {formatCurrency(totalExpenses)}
            </ThemedText>
          </View>
        </View>
      </View>
      
      {/* View Details Button */}
      <Pressable 
        style={styles.viewDetailsButton}
        onPress={onViewDetails}
      >
        <ThemedText variant="body" style={{ 
          color: theme.colors.primary,
          fontWeight: '600',
          marginRight: theme.spacing.xs
        }}>
          View Account Details
        </ThemedText>
        <ChevronRight size={16} color={theme.colors.primary} />
      </Pressable>
    </ThemedDashboardCard>
  );
} 