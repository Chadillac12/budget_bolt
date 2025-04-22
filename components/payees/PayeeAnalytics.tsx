import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { Payee } from '@/types/payee';
import { calculatePayeeAnalytics } from '@/utils/payeeUtils';
import { ArrowUpRight, ArrowDownRight, Calendar, DollarSign, BarChart3 } from 'lucide-react-native';

interface PayeeAnalyticsProps {
  payee: Payee;
}

/**
 * Component to display analytics for a specific payee
 */
export default function PayeeAnalytics({ payee }: PayeeAnalyticsProps) {
  const { state } = useAppContext();
  
  // Calculate analytics data
  const analytics = useMemo(() => {
    return calculatePayeeAnalytics(payee.id, state.transactions);
  }, [payee.id, state.transactions]);
  
  // Get sorted months for the chart
  const sortedMonths = useMemo(() => {
    return Object.keys(analytics.monthlyData || {}).sort();
  }, [analytics.monthlyData]);
  
  // Find the month with the highest expense
  const maxExpenseMonth = useMemo(() => {
    if (sortedMonths.length === 0 || !analytics.monthlyData) return null;
    
    return sortedMonths.reduce((max, month) => {
      const current = analytics.monthlyData?.[month]?.expenses || 0;
      const currentMax = analytics.monthlyData?.[max]?.expenses || 0;
      return current > currentMax ? month : max;
    }, sortedMonths[0]);
  }, [sortedMonths, analytics.monthlyData]);
  
  // Find the month with the highest income
  const maxIncomeMonth = useMemo(() => {
    if (sortedMonths.length === 0 || !analytics.monthlyData) return null;
    
    return sortedMonths.reduce((max, month) => {
      const current = analytics.monthlyData?.[month]?.income || 0;
      const currentMax = analytics.monthlyData?.[max]?.income || 0;
      return current > currentMax ? month : max;
    }, sortedMonths[0]);
  }, [sortedMonths, analytics.monthlyData]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format month for display
  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  // Calculate the maximum value for the chart
  const maxChartValue = useMemo(() => {
    if (sortedMonths.length === 0 || !analytics.monthlyData) return 0;
    
    return Math.max(
      ...sortedMonths.map(month => Math.max(
        analytics.monthlyData?.[month]?.expenses || 0,
        analytics.monthlyData?.[month]?.income || 0
      ))
    );
  }, [sortedMonths, analytics.monthlyData]);
  
  // Calculate bar height percentage
  const getBarHeight = (value: number) => {
    if (maxChartValue === 0) return 0;
    return (value / maxChartValue) * 100;
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics for {payee.name}</Text>
      </View>
      
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <ArrowUpRight size={20} color="#FF3B30" />
          </View>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>{formatCurrency(analytics.totalSpent || 0)}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <ArrowDownRight size={20} color="#34C759" />
          </View>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={styles.summaryValue}>{formatCurrency(analytics.totalIncome || 0)}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Calendar size={20} color="#007AFF" />
          </View>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{analytics.transactionCount}</Text>
        </View>
      </View>
      
      {/* Average Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Averages</Text>
        
        <View style={styles.averagesContainer}>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Average Expense</Text>
            <Text style={styles.averageValue}>{formatCurrency(analytics.averageExpense || 0)}</Text>
          </View>
          
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Average Income</Text>
            <Text style={styles.averageValue}>{formatCurrency(analytics.averageIncome || 0)}</Text>
          </View>
        </View>
      </View>
      
      {/* Monthly Chart */}
      {sortedMonths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Activity</Text>
          
          <View style={styles.chartContainer}>
            {/* Chart Bars */}
            <View style={styles.chartBars}>
              {sortedMonths.map(month => (
                <View key={month} style={styles.chartBarGroup}>
                  {/* Expense Bar */}
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.expenseBar, 
                        { 
                          height: `${getBarHeight(analytics.monthlyData?.[month]?.expenses || 0)}%`,
                          opacity: month === maxExpenseMonth ? 1 : 0.7
                        }
                      ]} 
                    />
                  </View>
                  
                  {/* Income Bar */}
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.incomeBar, 
                        { 
                          height: `${getBarHeight(analytics.monthlyData?.[month]?.income || 0)}%`,
                          opacity: month === maxIncomeMonth ? 1 : 0.7
                        }
                      ]} 
                    />
                  </View>
                  
                  {/* Month Label */}
                  <Text style={styles.monthLabel}>{formatMonth(month)}</Text>
                </View>
              ))}
            </View>
            
            {/* Legend */}
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.expenseLegend]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.incomeLegend]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        
        <View style={styles.historyContainer}>
          {analytics.firstTransaction ? (
            <>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>First Transaction</Text>
                <Text style={styles.historyValue}>
                  {analytics.firstTransaction.date.toLocaleDateString()}
                </Text>
                <Text style={styles.historyAmount}>
                  {formatCurrency(analytics.firstTransaction.amount)}
                </Text>
              </View>
              
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>Last Transaction</Text>
                <Text style={styles.historyValue}>
                  {analytics.lastTransaction.date.toLocaleDateString()}
                </Text>
                <Text style={styles.historyAmount}>
                  {formatCurrency(analytics.lastTransaction.amount)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No transaction history available</Text>
          )}
        </View>
      </View>
      
      {/* Monthly Breakdown */}
      {sortedMonths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          
          <View style={styles.breakdownContainer}>
            {sortedMonths.map(month => (
              <View key={month} style={styles.breakdownItem}>
                <Text style={styles.breakdownMonth}>{formatMonth(month)}</Text>
                
                <View style={styles.breakdownDetails}>
                  <View style={styles.breakdownDetail}>
                    <ArrowUpRight size={14} color="#FF3B30" style={styles.breakdownIcon} />
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(analytics.monthlyData?.[month]?.expenses || 0)}
                    </Text>
                  </View>
                  
                  <View style={styles.breakdownDetail}>
                    <ArrowDownRight size={14} color="#34C759" style={styles.breakdownIcon} />
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(analytics.monthlyData?.[month]?.income || 0)}
                    </Text>
                  </View>
                  
                  <View style={styles.breakdownDetail}>
                    <Calendar size={14} color="#007AFF" style={styles.breakdownIcon} />
                    <Text style={styles.breakdownValue}>
                      {analytics.monthlyData?.[month]?.count || 0} tx
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  averagesContainer: {
    flexDirection: 'row',
  },
  averageItem: {
    flex: 1,
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartContainer: {
    height: 220,
  },
  chartBars: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 4,
  },
  barContainer: {
    width: 20,
    height: 180,
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  expenseBar: {
    width: '100%',
    backgroundColor: '#FF3B30',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  incomeBar: {
    width: '100%',
    backgroundColor: '#34C759',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  monthLabel: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#8E8E93',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  expenseLegend: {
    backgroundColor: '#FF3B30',
  },
  incomeLegend: {
    backgroundColor: '#34C759',
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  historyItem: {
    marginBottom: 12,
  },
  historyLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  noDataText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  breakdownContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  breakdownMonth: {
    fontSize: 14,
    fontWeight: '500',
    width: 100,
  },
  breakdownDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIcon: {
    marginRight: 4,
  },
  breakdownValue: {
    fontSize: 14,
  },
});