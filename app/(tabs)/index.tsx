import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import AccountSummaryCard from '@/components/dashboard/AccountSummaryCard';
import { Account, AccountSummary } from '@/types/account';
import { Transaction } from '@/types/transaction';
import { Budget, BudgetSummary } from '@/types/budget';
import { formatCurrency, formatMonthYear } from '@/utils/dateUtils';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import TransactionItem from '@/components/transactions/TransactionItem';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';

// Wrapper component to filter out responder props on web platform
const WebCompatibleLineChart = (props) => {
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
        
      const netChange = totalIncome - totalExpenses;
      
      setAccountSummary({
        totalBalance,
        totalIncome,
        totalExpenses,
        netChange,
      });
    }
  }, [state.accounts, state.transactions]);

  // Calculate budget summary
  useEffect(() => {
    if (state.budgets.length > 0) {
      // Find active budget
      const now = new Date();
      const activeBudget = state.budgets.find(
        budget => 
          new Date(budget.startDate) <= now && 
          new Date(budget.endDate) >= now && 
          budget.isActive
      );
      
      if (activeBudget) {
        const totalAllocated = activeBudget.categories.reduce(
          (sum, cat) => sum + cat.allocated, 0
        );
        
        const totalSpent = activeBudget.categories.reduce(
          (sum, cat) => sum + cat.spent, 0
        );
        
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
        
        {/* Budget Overview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>
          
          <View style={styles.budgetSummaryContainer}>
            <View style={styles.budgetSummaryItem}>
              <Text style={styles.budgetLabel}>Allocated</Text>
              <Text style={styles.budgetValue}>
                {formatCurrency(budgetSummary.totalAllocated)}
              </Text>
            </View>
            
            <View style={styles.budgetSummaryItem}>
              <Text style={styles.budgetLabel}>Spent</Text>
              <Text style={styles.budgetValue}>
                {formatCurrency(budgetSummary.totalSpent)}
              </Text>
            </View>
            
            <View style={styles.budgetSummaryItem}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text style={[
                styles.budgetValue,
                budgetSummary.totalRemaining < 0 ? styles.negativeValue : styles.positiveValue
              ]}>
                {formatCurrency(budgetSummary.totalRemaining)}
              </Text>
            </View>
          </View>
          
          {/* Example Budget Categories */}
          <BudgetProgressBar
            allocated={1200}
            spent={800}
            remaining={400}
            categoryName="Housing"
            categoryColor="#5856D6"
          />
          
          <BudgetProgressBar
            allocated={500}
            spent={490}
            remaining={10}
            categoryName="Groceries"
            categoryColor="#FF9500"
          />
        </View>
        
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  budgetSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
});