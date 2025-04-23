import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import BudgetCategoryManager from '@/components/budgets/BudgetCategoryManager';
import { Plus, Calendar, Filter, Settings, Layers } from 'lucide-react-native';
import { formatMonthYear } from '@/utils/dateUtils';
import { BudgetCategory, BudgetCategoryGroup } from '@/types/budget';

export default function BudgetScreen() {
  const { state } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'summary' | 'categories'>('summary');
  
  // Sample budget data for demonstration
  const sampleBudgetCategories: BudgetCategory[] = [
    {
      id: 'cat1',
      categoryId: 'housing',
      name: 'Housing',
      allocated: 1200,
      spent: 1150,
      remaining: 50
    },
    {
      id: 'cat2',
      categoryId: 'groceries',
      name: 'Groceries',
      allocated: 500,
      spent: 320,
      remaining: 180
    },
    {
      id: 'cat3',
      categoryId: 'utilities',
      name: 'Utilities',
      allocated: 300,
      spent: 275,
      remaining: 25
    },
    {
      id: 'cat4',
      categoryId: 'transportation',
      name: 'Transportation',
      allocated: 250,
      spent: 180,
      remaining: 70
    },
    {
      id: 'cat5',
      categoryId: 'entertainment',
      name: 'Entertainment',
      allocated: 200,
      spent: 220,
      remaining: -20
    }
  ];
  
  // Sample budget group
  const sampleBudgetGroup: BudgetCategoryGroup = {
    id: 'group1',
    name: 'Essential Expenses',
    children: sampleBudgetCategories.slice(0, 3)
  };
  
  // Navigate to previous month
  const navigateToPreviousMonth = () => {
    const previousMonth = new Date(selectedMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setSelectedMonth(previousMonth);
  };

  // Navigate to next month
  const navigateToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
  };
  
  // Calculate budget summary
  const totalAllocated = sampleBudgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = sampleBudgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const percentSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Budget' }} />
      
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
        >
          <Layers size={18} color={activeTab === 'summary' ? "#007AFF" : "#666"} />
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Settings size={18} color={activeTab === 'categories' ? "#007AFF" : "#666"} />
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Manage Categories</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'summary' ? (
        <View style={styles.contentContainer}>
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={navigateToPreviousMonth}>
              <Text style={styles.monthNavigator}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.monthContainer}>
              <Calendar size={18} color="#007AFF" style={styles.calendarIcon} />
              <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
            </View>
            
            <TouchableOpacity onPress={navigateToNextMonth}>
              <Text style={styles.monthNavigator}>→</Text>
            </TouchableOpacity>
          </View>
          
          {/* Budget Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Allocated</Text>
                <Text style={styles.summaryValue}>${totalAllocated.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Spent</Text>
                <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={[
                  styles.summaryValue,
                  totalRemaining < 0 ? styles.negativeValue : styles.positiveValue
                ]}>
                  ${totalRemaining.toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground} />
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min(percentSpent, 100)}%` },
                  percentSpent > 90 ? styles.warningProgress :
                  percentSpent > 100 ? styles.overBudgetProgress :
                  styles.normalProgress
                ]}
              />
              <Text style={styles.progressText}>{percentSpent.toFixed(1)}% Spent</Text>
            </View>
          </View>
          
          {/* Budget Categories */}
          <ScrollView style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Budget Categories</Text>
            
            {/* Group Example */}
            <BudgetProgressBar
              item={sampleBudgetGroup}
              isGroupLevel={true}
            />
            
            {/* Individual Categories */}
            {sampleBudgetCategories.slice(3).map((category) => (
              <BudgetProgressBar
                key={category.id}
                item={category}
              />
            ))}
          </ScrollView>
          
          {/* Add Category Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Switch to categories tab
              setActiveTab('categories');
            }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <BudgetCategoryManager />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    flex: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#007AFF',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  monthNavigator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 12,
  },
  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 6,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  positiveValue: {
    color: '#34C759',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  progressContainer: {
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E5E5EA',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 10,
  },
  normalProgress: {
    backgroundColor: '#34C759',
  },
  warningProgress: {
    backgroundColor: '#FF9500',
  },
  overBudgetProgress: {
    backgroundColor: '#FF3B30',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  categoriesContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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