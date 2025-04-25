import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import BudgetCategoryManager from '@/components/budgets/BudgetCategoryManager';
import { Plus, Calendar, Filter, Settings, Layers } from 'lucide-react-native';
import { formatMonthYear } from '@/utils/dateUtils';
import { BudgetCategory, BudgetCategoryGroup } from '@/types/budget';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
import MonospaceTitle from '@/components/ui/MonospaceTitle';

export default function BudgetScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
          <Layers size={18} color={activeTab === 'summary' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Settings size={18} color={activeTab === 'categories' ? theme.colors.primary : theme.colors.textSecondary} />
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
              <Calendar size={18} color={theme.colors.primary} style={styles.calendarIcon} />
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
            <MonospaceTitle size="medium">Budget Categories</MonospaceTitle>
            
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
            <Plus size={24} color={theme.colors.card} />
          </TouchableOpacity>
        </View>
      ) : (
        <BudgetCategoryManager />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  contentContainer: {
    flex: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthNavigator: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  positiveValue: {
    color: theme.colors.success,
  },
  negativeValue: {
    color: theme.colors.error,
  },
  progressContainer: {
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 10,
  },
  normalProgress: {
    backgroundColor: theme.colors.success,
  },
  warningProgress: {
    backgroundColor: theme.colors.warning,
  },
  overBudgetProgress: {
    backgroundColor: theme.colors.error,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: theme.colors.card,
    fontWeight: '600',
    fontSize: 12,
  },
  categoriesContainer: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});