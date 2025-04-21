import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import { formatCurrency, formatMonthYear } from '@/utils/dateUtils';
import { PieChart } from 'react-native-chart-kit';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';

export default function BudgetScreen() {
  const { state } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Mock budget data (in a real app, this would come from state)
  const budgetData = [
    {
      id: '1',
      categoryId: '1',
      categoryName: 'Housing',
      categoryColor: '#5856D6',
      allocated: 1500,
      spent: 1450,
      remaining: 50,
    },
    {
      id: '2',
      categoryId: '2',
      categoryName: 'Food',
      categoryColor: '#FF9500',
      allocated: 600,
      spent: 580,
      remaining: 20,
    },
    {
      id: '3',
      categoryId: '3',
      categoryName: 'Transportation',
      categoryColor: '#34C759',
      allocated: 300,
      spent: 275,
      remaining: 25,
    },
    {
      id: '4',
      categoryId: '4',
      categoryName: 'Entertainment',
      categoryColor: '#007AFF',
      allocated: 200,
      spent: 180,
      remaining: 20,
    },
    {
      id: '5',
      categoryId: '5',
      categoryName: 'Healthcare',
      categoryColor: '#FF2D55',
      allocated: 150,
      spent: 50,
      remaining: 100,
    },
    {
      id: '6',
      categoryId: '6',
      categoryName: 'Shopping',
      categoryColor: '#AF52DE',
      allocated: 300,
      spent: 320,
      remaining: -20,
    },
  ];
  
  // Calculate budget summary
  const budgetSummary = React.useMemo(() => {
    const totalAllocated = budgetData.reduce((sum, item) => sum + item.allocated, 0);
    const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const percentSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    
    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      percentSpent,
    };
  }, [budgetData]);
  
  // Prepare data for pie chart
  const chartData = React.useMemo(() => {
    return budgetData.map((item) => ({
      name: item.categoryName,
      spent: item.spent,
      color: item.categoryColor,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  }, [budgetData]);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you'd fetch updated budget data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <ChevronLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
          
          <TouchableOpacity onPress={goToNextMonth}>
            <ChevronRight size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Budget Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Allocated</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(budgetSummary.totalAllocated)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(budgetSummary.totalSpent)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[
                styles.summaryValue,
                budgetSummary.totalRemaining < 0 ? styles.negativeAmount : styles.positiveAmount
              ]}>
                {formatCurrency(budgetSummary.totalRemaining)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Progress</Text>
              <Text style={styles.summaryValue}>
                {budgetSummary.percentSpent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Spending Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          
          <PieChart
            data={chartData}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="spent"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        {/* Budget Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          
          {budgetData.map((item) => (
            <BudgetProgressBar
              key={item.id}
              allocated={item.allocated}
              spent={item.spent}
              remaining={item.remaining}
              categoryName={item.categoryName}
              categoryColor={item.categoryColor}
            />
          ))}
        </View>
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Add Category Button */}
      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  summaryContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  positiveAmount: {
    color: '#34C759',
  },
  negativeAmount: {
    color: '#FF3B30',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  bottomPadding: {
    height: 80,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});