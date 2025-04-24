import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
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
  const [refreshing, setRefreshing] = useState(false);
  const [accountSummary, setAccountSummary] = useState<AccountSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netChange: 0,
  });
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    totalAllocated: 0,
    totalSpent: 0,
    totalRemaining: 0,
    percentageSpent: 0,
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
        
        // Update budget categories with transaction data
        const updateBudgetWithTransactions = () => {
          // Get transactions for the budget period
          const budgetStart = new Date(currentActiveBudget.startDate);
          const budgetEnd = new Date(currentActiveBudget.endDate);
          
          const budgetTransactions = state.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= budgetStart && txDate <= budgetEnd && tx.type === 'expense';
          });
          
          // Create a map to track spending by category
          const categorySpending: Record<string, number> = {};
          
          // Process all transactions
          budgetTransactions.forEach(tx => {
            if (tx.isSplit && tx.splits) {
              // Handle split transactions
              tx.splits.forEach(split => {
                if (!categorySpending[split.categoryId]) {
                  categorySpending[split.categoryId] = 0;
                }
                categorySpending[split.categoryId] += split.amount;
              });
            } else {
              // Handle regular transactions
              if (!categorySpending[tx.categoryId]) {
                categorySpending[tx.categoryId] = 0;
              }
              categorySpending[tx.categoryId] += tx.amount;
            }
          });
          
          // Update budget categories with actual spending
          const updateCategorySpending = (
            categories: (BudgetCategory | BudgetCategoryGroup)[]
          ): (BudgetCategory | BudgetCategoryGroup)[] => {
            return categories.map(cat => {
              if ('categoryId' in cat) {
                // It's a BudgetCategory
                const spent = categorySpending[cat.categoryId] || 0;
                return {
                  ...cat,
                  spent,
                  remaining: cat.allocated - spent
                };
              } else {
                // It's a BudgetCategoryGroup, recursively update
                return {
                  ...cat,
                  children: updateCategorySpending(cat.children)
                };
              }
            });
          };
          
          // Update the budget categories
          currentActiveBudget.categories = updateCategorySpending(currentActiveBudget.categories);
        };
        
        // Update budget with transaction data
        updateBudgetWithTransactions();
        
        const totalAllocated = calculateCategoryValue(currentActiveBudget.categories, 'allocated');
        const totalSpent = calculateCategoryValue(currentActiveBudget.categories, 'spent');
        const totalRemaining = totalAllocated - totalSpent;
        const percentageSpent = totalAllocated > 0 
          ? (totalSpent / totalAllocated) * 100 
          : 0;
          
        setBudgetSummary({
          totalAllocated,
          totalSpent,
          totalRemaining,
          percentageSpent,
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
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#007AFF',
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
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
      : {
          shadowColor: '#000',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
      : {
          shadowColor: '#000',
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
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  viewAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  positiveValue: {
    color: '#34C759',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#8E8E93',
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
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  warningStatusIndicator: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  badStatusIndicator: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});