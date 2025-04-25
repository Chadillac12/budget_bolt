import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { 
  TrendAnalysis, 
  TrendAnalysisConfig, 
  TrendAnalysisType, 
  TrendTimePeriod,
  SavedTrendAnalysis
} from '@/types/trends';
import { 
  generateTrendAnalysis, 
  generateTrendComparison, 
  getPreviousPeriod,
  exportTrendDataToCsv
} from '@/utils/trendUtils';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
import MonospaceTitle from '@/components/ui/MonospaceTitle';

const screenWidth = Dimensions.get('window').width;

/**
 * Trend Analysis Dashboard Screen
 */
export default function TrendsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [selectedTrendType, setSelectedTrendType] = useState<TrendAnalysisType>('spending-by-category');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TrendTimePeriod>('monthly');
  const [startDate, setStartDate] = useState<Date>(() => {
    // Default to first day of current month
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    // Default to last day of current month
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [smoothing, setSmoothing] = useState(false);
  const [smoothingFactor, setSmoothingFactor] = useState(0.5);
  const [currentAnalysis, setCurrentAnalysis] = useState<TrendAnalysis | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<TrendAnalysis | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedTrendAnalysis[]>([]);

  // Load saved analyses from context
  useEffect(() => {
    setSavedAnalyses(state.savedTrendAnalyses || []);
  }, [state.savedTrendAnalyses]);

  // Generate trend analysis when parameters change
  useEffect(() => {
    generateAnalysis();
  }, [
    selectedTrendType,
    selectedTimePeriod,
    startDate,
    endDate,
    selectedCategories,
    selectedAccounts,
    smoothing,
    smoothingFactor,
    compareWithPrevious,
    state.transactions,
    state.categories,
    state.accounts,
    state.budgets,
    state.netWorthHistory
  ]);

  /**
   * Generate trend analysis based on current settings
   */
  const generateAnalysis = async () => {
    setLoading(true);
    
    try {
      // Create config
      const config: TrendAnalysisConfig = {
        type: selectedTrendType,
        timePeriod: selectedTimePeriod,
        startDate,
        endDate,
        includeCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        includeAccounts: selectedAccounts.length > 0 ? selectedAccounts : undefined,
        smoothing,
        smoothingFactor,
        compareWithPrevious
      };
      
      // Generate current period analysis
      const analysis = generateTrendAnalysis(
        config,
        state.transactions,
        state.categories,
        state.accounts,
        state.budgets,
        state.netWorthHistory
      );
      
      setCurrentAnalysis(analysis);
      
      // Generate previous period analysis if needed
      if (compareWithPrevious) {
        const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriod(
          startDate,
          endDate,
          selectedTimePeriod
        );
        
        const prevConfig: TrendAnalysisConfig = {
          ...config,
          startDate: prevStart,
          endDate: prevEnd
        };
        
        const prevAnalysis = generateTrendAnalysis(
          prevConfig,
          state.transactions,
          state.categories,
          state.accounts,
          state.budgets,
          state.netWorthHistory
        );
        
        setPreviousAnalysis(prevAnalysis);
      } else {
        setPreviousAnalysis(null);
      }
    } catch (error) {
      console.error('Error generating trend analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export current analysis to CSV
   */
  const exportToCSV = async () => {
    if (!currentAnalysis) return;
    
    try {
      const csvContent = exportTrendDataToCsv(currentAnalysis);
      const fileName = `trend_analysis_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        console.log('Sharing is not available on this platform');
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };

  /**
   * Save current analysis configuration
   */
  const saveAnalysisConfig = () => {
    // Implementation will be added
  };

  /**
   * Load a saved analysis configuration
   */
  const loadSavedAnalysis = (savedAnalysis: SavedTrendAnalysis) => {
    // Implementation will be added
  };

  /**
   * Render chart based on trend type and data
   */
  const renderChart = () => {
    if (!currentAnalysis || currentAnalysis.series.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available for the selected parameters</Text>
        </View>
      );
    }

    switch (selectedTrendType) {
      case 'spending-by-category':
      case 'income-vs-expenses':
      case 'budget-vs-actual':
      case 'account-balance':
      case 'net-worth':
        return renderLineChart();
      case 'category-distribution':
        return renderPieChart();
      default:
        return null;
    }
  };

  /**
   * Render line chart for time-series data
   */
  const renderLineChart = () => {
    if (!currentAnalysis || currentAnalysis.series.length === 0) return null;

    // Prepare data for the chart
    const labels = currentAnalysis.series[0].data.map(point => {
      const date = new Date(point.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const datasets = currentAnalysis.series.map(series => ({
      data: series.data.map(point => point.value),
      color: () => series.color,
      strokeWidth: 2
    }));

    const legend = currentAnalysis.series.map(series => series.name);

    const chartData = {
      labels,
      datasets,
      legend
    };

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={chartData}
          width={Math.max(screenWidth, labels.length * 50)}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.card,
            backgroundGradientFrom: theme.colors.card,
            backgroundGradientTo: theme.colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726'
            }
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    );
  };

  /**
   * Render pie chart for distribution data
   */
  const renderPieChart = () => {
    if (!currentAnalysis || currentAnalysis.series.length === 0 || currentAnalysis.series[0].data.length === 0) return null;

    // Prepare data for the pie chart
    const pieData = currentAnalysis.series[0].data.map(point => {
      const category = state.categories.find(cat => cat.id === point.categoryId);
      return {
        name: point.label || category?.name || 'Unknown',
        value: point.value,
        color: category?.color || '#' + Math.floor(Math.random() * 16777215).toString(16),
        legendFontColor: theme.colors.textSecondary,
        legendFontSize: 12
      };
    });

    return (
      <PieChart
        data={pieData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.card,
          backgroundGradientFrom: theme.colors.card,
          backgroundGradientTo: theme.colors.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16
          }
        }}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    );
  };

  /**
   * Render trend type selector
   */
  const renderTrendTypeSelector = () => {
    const trendTypes: { value: TrendAnalysisType; label: string }[] = [
      { value: 'spending-by-category', label: 'Spending by Category' },
      { value: 'income-vs-expenses', label: 'Income vs Expenses' },
      { value: 'budget-vs-actual', label: 'Budget vs Actual' },
      { value: 'account-balance', label: 'Account Balance' },
      { value: 'net-worth', label: 'Net Worth' },
      { value: 'category-distribution', label: 'Category Distribution' }
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorContainer}>
        {trendTypes.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.selectorButton,
              selectedTrendType === type.value && styles.selectorButtonActive
            ]}
            onPress={() => setSelectedTrendType(type.value)}
          >
            <Text
              style={[
                styles.selectorButtonText,
                selectedTrendType === type.value && styles.selectorButtonTextActive
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  /**
   * Render time period selector
   */
  const renderTimePeriodSelector = () => {
    const timePeriods: { value: TrendTimePeriod; label: string }[] = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' }
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorContainer}>
        {timePeriods.map(period => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.selectorButton,
              selectedTimePeriod === period.value && styles.selectorButtonActive
            ]}
            onPress={() => setSelectedTimePeriod(period.value)}
          >
            <Text
              style={[
                styles.selectorButtonText,
                selectedTimePeriod === period.value && styles.selectorButtonTextActive
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MonospaceTitle size="large">Trend Analysis</MonospaceTitle>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(!showSettings)}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={exportToCSV}>
            <Ionicons name="download-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {renderTrendTypeSelector()}
      {renderTimePeriodSelector()}

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.chartContainer}>
          {renderChart()}
        </View>
      )}

      {/* Additional UI components for date range selection, category/account filters, etc. will be added here */}
      
      {/* Summary section */}
      {currentAnalysis && (
        <View style={styles.summaryContainer}>
          <MonospaceTitle size="medium">Summary</MonospaceTitle>
          {/* Summary content will be added based on the selected trend type */}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
  },
  selectorButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  selectorButtonText: {
    color: theme.colors.text,
  },
  selectorButtonTextActive: {
    color: theme.colors.card,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loader: {
    marginVertical: 100,
  },
});