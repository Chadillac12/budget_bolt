import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/utils/dateUtils';
import { TrendingUp, TrendingDown, Plus, Calendar, ChevronLeft, ChevronRight, Settings, History } from 'lucide-react-native';
import NetWorthSettings from '@/components/networth/NetWorthSettings';
import NetWorthHistory from '@/components/networth/NetWorthHistory';
import { calculateNetWorth } from '@/types/netWorth';
import { createNetWorthSnapshot } from '@/types/netWorth';
import { formatNetWorthDataForChart, calculateNetWorthChange, getNetWorthHistoryForRange } from '@/utils/netWorthUtils';
import { generateUUID } from '@/utils/storage';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

// Time range options for the chart
const TIME_RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 3650 }, // ~10 years
];

export default function NetWorthScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, dispatch } = useAppContext();
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Calculate current net worth
  const netWorthSummary = calculateNetWorth(state.accounts);
  
  // Get filtered history based on selected time range
  const filteredHistory = getNetWorthHistoryForRange(
    state.netWorthHistory,
    selectedRange.days
  );
  
  // Calculate change over the selected period
  const netWorthChange = calculateNetWorthChange(filteredHistory);
  
  // Format data for chart
  const chartData = formatNetWorthDataForChart(filteredHistory);
  
  // Create a snapshot
  const handleCreateSnapshot = () => {
    setIsLoading(true);
    
    // Create a new snapshot
    const snapshot = createNetWorthSnapshot(
      state.accounts,
      generateUUID()
    );
    
    // Add to state
    dispatch({
      type: 'ADD_NET_WORTH_SNAPSHOT',
      payload: snapshot
    });
    
    setIsLoading(false);
  };
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
  };
  
  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 32;
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Settings Modal */}
      <NetWorthSettings
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      {/* History View */}
      {showHistory && (
        <NetWorthHistory
          isVisible={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
      
      {/* Summary Header */}
      <View style={styles.summaryContainer}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowHistory(true)}
          >
            <History size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.summaryTitle}>Current Net Worth</Text>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[
          styles.summaryAmount,
          netWorthSummary.netWorth < 0 ? styles.negativeAmount : null
        ]}>
          {formatCurrency(netWorthSummary.netWorth)}
        </Text>
        
        {/* Change indicator */}
        {netWorthChange.amount !== 0 && (
          <View style={styles.changeContainer}>
            {netWorthChange.amount > 0 ? (
              <TrendingUp size={16} color={theme.colors.success} />
            ) : (
              <TrendingDown size={16} color={theme.colors.error} />
            )}
            <Text style={[
              styles.changeText,
              netWorthChange.amount > 0 ? styles.positiveChange : styles.negativeChange
            ]}>
              {formatCurrency(Math.abs(netWorthChange.amount))} ({Math.abs(netWorthChange.percentage).toFixed(1)}%)
            </Text>
          </View>
        )}
        
        {/* Assets vs Liabilities */}
        <View style={styles.balanceBreakdown}>
          <View style={styles.balanceItem}>
            <View style={styles.balanceIconContainer}>
              <TrendingUp size={14} color={theme.colors.success} />
            </View>
            <Text style={styles.balanceLabel}>Assets</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(netWorthSummary.totalAssets)}
            </Text>
          </View>
          
          <View style={styles.balanceDivider} />
          
          <View style={styles.balanceItem}>
            <View style={styles.balanceIconContainer}>
              <TrendingDown size={14} color={theme.colors.error} />
            </View>
            <Text style={styles.balanceLabel}>Liabilities</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(netWorthSummary.totalLiabilities)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.sectionTitle}>History</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range.label}
              style={[
                styles.timeRangeButton,
                selectedRange.label === range.label && styles.selectedTimeRange
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <Text style={[
                styles.timeRangeText,
                selectedRange.label === range.label && styles.selectedTimeRangeText
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Chart */}
      <View style={styles.chartContainer}>
        {chartData.length > 1 ? (
          <LineChart
            data={{
              labels: chartData.map(d => d.date),
              datasets: [
                {
                  data: chartData.map(d => d.netWorth),
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  strokeWidth: 2
                }
              ]
            }}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={chartData.length < 10}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLabels={chartData.length <= 6}
            withHorizontalLabels={true}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              Not enough data to display chart.
            </Text>
            <Text style={styles.noDataSubtext}>
              Create snapshots to track your net worth over time.
            </Text>
          </View>
        )}
      </View>
      
      {/* Account Breakdown */}
      <View style={styles.accountsContainer}>
        <Text style={styles.sectionTitle}>Account Breakdown</Text>
        
        {/* Assets */}
        <View style={styles.accountSection}>
          <View style={styles.accountSectionHeader}>
            <View style={[styles.accountTypeIndicator, styles.assetIndicator]} />
            <Text style={styles.accountSectionTitle}>Assets</Text>
            <Text style={styles.accountSectionTotal}>
              {formatCurrency(netWorthSummary.totalAssets)}
            </Text>
          </View>
          
          <ScrollView style={styles.accountList}>
            {netWorthSummary.assetAccounts.map(account => (
              <View key={account.id} style={styles.accountItem}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBalance}>
                  {formatCurrency(account.balance)}
                </Text>
              </View>
            ))}
            
            {netWorthSummary.assetAccounts.length === 0 && (
              <Text style={styles.emptyListText}>No asset accounts found</Text>
            )}
          </ScrollView>
        </View>
        
        {/* Liabilities */}
        <View style={styles.accountSection}>
          <View style={styles.accountSectionHeader}>
            <View style={[styles.accountTypeIndicator, styles.liabilityIndicator]} />
            <Text style={styles.accountSectionTitle}>Liabilities</Text>
            <Text style={styles.accountSectionTotal}>
              {formatCurrency(netWorthSummary.totalLiabilities)}
            </Text>
          </View>
          
          <ScrollView style={styles.accountList}>
            {netWorthSummary.liabilityAccounts.map(account => (
              <View key={account.id} style={styles.accountItem}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBalance}>
                  {formatCurrency(account.balance)}
                </Text>
              </View>
            ))}
            
            {netWorthSummary.liabilityAccounts.length === 0 && (
              <Text style={styles.emptyListText}>No liability accounts found</Text>
            )}
          </ScrollView>
        </View>
        
        {/* Excluded Accounts */}
        {netWorthSummary.excludedAccounts.length > 0 && (
          <View style={styles.accountSection}>
            <View style={styles.accountSectionHeader}>
              <Text style={styles.accountSectionTitle}>Excluded Accounts</Text>
            </View>
            
            <ScrollView style={styles.accountList}>
              {netWorthSummary.excludedAccounts.map(account => (
                <View key={account.id} style={styles.accountItem}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(account.balance)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      
      {/* Create Snapshot Button */}
      <TouchableOpacity 
        style={styles.createSnapshotButton}
        onPress={handleCreateSnapshot}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.card} />
        ) : (
          <>
            <Calendar size={20} color={theme.colors.card} />
            <Text style={styles.createSnapshotText}>Create Snapshot</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  summaryContainer: {
    backgroundColor: theme.colors.card,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerButton: {
    padding: 8,
  },
  summaryTitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  negativeAmount: {
    color: theme.colors.error,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  positiveChange: {
    color: theme.colors.success,
  },
  negativeChange: {
    color: theme.colors.error,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  timeRangeContainer: {
    backgroundColor: theme.colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedTimeRange: {
    backgroundColor: theme.colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  selectedTimeRangeText: {
    color: theme.colors.card,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  accountsContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    marginTop: 16,
    flex: 1,
  },
  accountSection: {
    marginBottom: 16,
  },
  accountSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  assetIndicator: {
    backgroundColor: theme.colors.success,
  },
  liabilityIndicator: {
    backgroundColor: theme.colors.error,
  },
  accountSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  accountSectionTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountList: {
    maxHeight: 120,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  accountName: {
    fontSize: 14,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyListText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  createSnapshotButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  createSnapshotText: {
    color: theme.colors.card,
    fontWeight: '600',
    marginLeft: 8,
  },
});