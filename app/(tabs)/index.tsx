import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Link } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import AccountSummaryCard from '@/components/dashboard/AccountSummaryCard';
import BudgetSummaryCard from '@/components/dashboard/BudgetSummaryCard';
import { Account, AccountSummary } from '@/types/account';
import { Transaction } from '@/types/transaction';
import { Budget, BudgetSummary, BudgetCategory, BudgetCategoryGroup } from '@/types/budget';
import { formatCurrency, formatMonthYear } from '@/utils/dateUtils';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import TransactionItem from '@/components/transactions/TransactionItem';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import { ThemedScreen, ThemedText, ThemedCard } from '@/components/themed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }[];
  };
  width: number;
  height: number;
  chartConfig: {
    backgroundColor: string;
    backgroundGradientFrom: string;
    backgroundGradientTo: string;
    decimalPlaces: number;
    color: (opacity: number) => string;
    labelColor: (opacity: number) => string;
    style?: {
      borderRadius: number;
    };
    propsForDots?: {
      r: string;
      strokeWidth: string;
      stroke: string;
    };
  };
  bezier?: boolean;
  style?: any;
  // Responder props for native platforms
  onStartShouldSetResponder?: () => boolean;
  onMoveShouldSetResponder?: () => boolean;
  onResponderGrant?: () => void;
  onResponderMove?: () => void;
  onResponderRelease?: () => void;
  onResponderTerminate?: () => void;
  onResponderTerminationRequest?: () => boolean;
}

// Wrapper component to filter out responder props on web platform
const WebCompatibleLineChart = (props: LineChartProps) => {
  if (Platform.OS === 'web') {
    // Filter out responder-related props that cause warnings on web
    const {
      onStartShouldSetResponder,
      onMoveShouldSetResponder,
      onResponderGrant,
      onResponderMove,
      onResponderRelease,
      onResponderTerminate,
      onResponderTerminationRequest,
      ...webSafeProps
    } = props;
    return <LineChart {...webSafeProps} />;
  }
  
  // For native platforms, use all props
  return <LineChart {...props} />;
};

export default function DashboardScreen() {
  const { state } = useAppContext();
  const router = useRouter();
  const { isDark } = useTheme();
  const appTheme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [refreshing, setRefreshing] = useState(false);
  const [accountSummary, setAccountSummary] = useState<AccountSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netChange: 0,
  });
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    totalBudgeted: 0,
    totalSpent: 0,
    remainingBudget: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);

  // Calculate account summary
  useEffect(() => {
    if (state.accounts.length > 0 && state.transactions.length > 0) {
      // Filter active accounts
      const activeAccounts = state.accounts.filter(acc => !acc.isArchived);
      
      // Calculate total balance
      const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
      
      // Get current month transactions
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTransactions = state.transactions.filter(
        tx => new Date(tx.date) >= currentMonthStart
      );
      
      // Calculate income and expenses
      const totalIncome = currentMonthTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      const totalExpenses = currentMonthTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      // Note: Split transactions are already included in the calculations above
      // since they have a type (income/expense) and a total amount
        
      const netChange = totalIncome - totalExpenses;
      
      setAccountSummary({
        totalBalance,
        totalIncome,
        totalExpenses,
        netChange,
      });
    }
  }, [state.accounts, state.transactions]);

  // Calculate budget summary and find active budget
  useEffect(() => {
    if (state.budgets.length > 0) {
      // Find active budget
      const now = new Date();
      const currentActiveBudget = state.budgets.find(
        budget => 
          new Date(budget.startDate) <= now && 
          new Date(budget.endDate) >= now && 
          budget.isActive
      );
      
      setActiveBudget(currentActiveBudget || null);
      
      if (currentActiveBudget) {
        // Type guard to handle BudgetCategory vs BudgetCategoryGroup
        const calculateCategoryValue = (
          categories: (BudgetCategory | BudgetCategoryGroup)[],
          property: 'allocated' | 'spent'
        ): number => {
          return categories.reduce((sum, cat) => {
            if ('categoryId' in cat) {
              // It's a BudgetCategory
              return sum + cat[property];
            } else {
              // It's a BudgetCategoryGroup, recursively calculate
              return sum + calculateCategoryValue(cat.children, property);
            }
          }, 0);
        };
        
        const totalBudgeted = calculateCategoryValue(currentActiveBudget.categories, 'allocated');
        const totalSpent = calculateCategoryValue(currentActiveBudget.categories, 'spent');
        const remainingBudget = totalBudgeted - totalSpent;
        
        setBudgetSummary({
          totalBudgeted,
          totalSpent,
          remainingBudget,
        });
      }
    }
  }, [state.budgets]);

  // Get recent transactions
  useEffect(() => {
    if (state.transactions.length > 0) {
      // Sort transactions by date (newest first) and get the first 5
      const sorted = [...state.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
        
      setRecentTransactions(sorted);
    }
  }, [state.transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, you might fetch new data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Mock data for spending chart
  const spendingData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [1500, 1800, 1600, 2100, 1900, 2300],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ThemedScreen>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[appTheme.colors.primary]}
            tintColor={appTheme.colors.primary}
          />
        }
      >
        <View style={styles.headerContainer}>
          <ThemedText variant="title" style={styles.headerTitle} monospace={true}>Dashboard</ThemedText>
          <ThemedText variant="subtitle" style={styles.headerSubtitle}>
            {formatMonthYear(new Date())}
          </ThemedText>
        </View>
        
        {/* Account Summary Card */}
        <AccountSummaryCard 
          accounts={state.accounts} 
          summary={accountSummary} 
        />
        
        {/* Spending Overview Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Spending Overview</Text>
          <Text style={styles.sectionSubtitle}>{formatMonthYear(new Date())}</Text>
          
          {/* Using the web-compatible wrapper for LineChart */}
          <WebCompatibleLineChart
            data={spendingData}
            width={Dimensions.get('window').width - 32}
            height={200}
            chartConfig={{
              backgroundColor: appTheme.colors.card,
              backgroundGradientFrom: appTheme.colors.card,
              backgroundGradientTo: appTheme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(${appTheme.colors.primary.replace('#', '').match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '0, 122, 255'}, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${appTheme.colors.text.replace('#', '').match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '0, 0, 0'}, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: appTheme.colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
        
        {/* Budget Summary Card */}
        <BudgetSummaryCard
          summary={budgetSummary}
          hasActiveBudget={activeBudget !== null}
        />
        
        {/* Budget Categories */}
        {activeBudget && (
          <View
            style={styles.sectionContainer}
            accessible={true}
            accessibilityLabel="Budget Categories Section"
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budget Categories</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View all budget categories"
              >
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {/* Budget status summary */}
            <View style={styles.budgetStatusContainer}>
              <View style={[styles.statusIndicator, styles.goodStatusIndicator]}>
                <Text style={styles.statusText}>Under Budget</Text>
              </View>
              <View style={[styles.statusIndicator, styles.warningStatusIndicator]}>
                <Text style={styles.statusText}>Approaching Limit</Text>
              </View>
              <View style={[styles.statusIndicator, styles.badStatusIndicator]}>
                <Text style={styles.statusText}>Over Budget</Text>
              </View>
            </View>
            
            {/* Top 3 categories only for dashboard */}
            {activeBudget.categories.slice(0, 3).map((category, index) => (
              <BudgetProgressBar
                key={index}
                item={category}
                categoryColor="#5856D6"
                isGroupLevel={'children' in category}
              />
            ))}
            
            {/* View more button if there are more than 3 categories */}
            {activeBudget.categories.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => router.push("/(tabs)")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`View ${activeBudget.categories.length - 3} more budget categories`}
              >
                <Text style={styles.viewMoreText}>
                  View {activeBudget.categories.length - 3} more categories
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onPress={() => {}}
              />
            ))
          ) : (
            <Text style={styles.emptyStateText}>
              No recent transactions to display
            </Text>
          )}
        </View>
        
        {/* Add a debug button for testing CSV parsing */}
        <Link href="/csv-test" asChild>
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              bottom: 20, 
              right: 20, 
              backgroundColor: appTheme.colors.primary, 
              padding: 10, 
              borderRadius: 8 
            }}
          >
            <Text style={{ color: appTheme.colors.onPrimary }}>CSV Test</Text>
          </TouchableOpacity>
        </Link>
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedScreen>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
      : {
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
      : {
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  viewAll: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  positiveValue: {
    color: theme.colors.success,
  },
  negativeValue: {
    color: theme.colors.error,
  },
  emptyStateText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: 20,
  },
  bottomPadding: {
    height: 40,
  },
  budgetStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statusIndicator: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  goodStatusIndicator: {
    backgroundColor: `${theme.colors.success}20`,
    borderWidth: 1,
    borderColor: `${theme.colors.success}40`,
  },
  warningStatusIndicator: {
    backgroundColor: `${theme.colors.warning}20`,
    borderWidth: 1,
    borderColor: `${theme.colors.warning}40`,
  },
  badStatusIndicator: {
    backgroundColor: `${theme.colors.error}20`,
    borderWidth: 1,
    borderColor: `${theme.colors.error}40`,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  viewMoreButton: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});