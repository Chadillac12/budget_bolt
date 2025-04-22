import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BudgetSummary } from '@/types/budget';
import { formatCurrency } from '@/utils/dateUtils';
import { ChevronRight } from 'lucide-react-native';

interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  hasActiveBudget: boolean;
}

export default function BudgetSummaryCard({ summary, hasActiveBudget }: BudgetSummaryCardProps) {
  const router = useRouter();
  
  const navigateToBudgets = () => {
    // Since there's no budgets tab yet, we'll navigate to the index tab for now
    router.push("/(tabs)");
  };
  
  // Calculate percentage for the circular progress indicator
  const percentageSpent = summary.percentageSpent;
  const circumference = 2 * Math.PI * 40; // Circle radius is 40
  const strokeDashoffset = circumference - (percentageSpent / 100) * circumference;
  
  // Determine color based on percentage spent
  const getProgressColor = () => {
    if (percentageSpent < 50) return '#34C759'; // Green
    if (percentageSpent < 75) return '#30D158'; // Light Green
    if (percentageSpent < 90) return '#FF9500'; // Orange
    if (percentageSpent < 100) return '#FF3B30'; // Red
    return '#FF2D55'; // Bright Red for over budget
  };

  if (!hasActiveBudget) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No active budget</Text>
          <Text style={styles.emptyStateSubtext}>Create a budget to start tracking your expenses</Text>
          <TouchableOpacity style={styles.createBudgetButton} onPress={navigateToBudgets}>
            <Text style={styles.createBudgetText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel="Budget Overview Card"
      accessibilityRole="summary"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Budget Overview</Text>
        <TouchableOpacity
          onPress={navigateToBudgets}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View all budgets"
          accessibilityHint="Navigate to the budgets screen"
        >
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        {/* Circular progress indicator */}
        <View
          style={styles.circularProgressContainer}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityLabel={`${percentageSpent.toFixed(0)} percent of budget spent`}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: percentageSpent,
          }}
        >
          <View style={styles.circularProgress}>
            <View style={styles.circleBackground} />
            <View
              style={[
                styles.circleProgress,
                {
                  borderColor: getProgressColor(),
                  transform: [{ rotate: '-90deg' }],
                  borderWidth: percentageSpent > 0 ? 5 : 0
                }
              ]}
            />
            <View style={styles.circleContent}>
              <Text style={[
                styles.percentageText,
                percentageSpent > 90 ? styles.warningText :
                percentageSpent > 100 ? styles.negativeValue : null
              ]}>
                {percentageSpent.toFixed(0)}%
              </Text>
              <Text style={styles.percentageLabel}>spent</Text>
            </View>
          </View>
        </View>
        
        {/* Budget stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Allocated</Text>
            <Text style={styles.statValue}>
              {formatCurrency(summary.totalAllocated)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>
              {formatCurrency(summary.totalSpent)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[
              styles.statValue,
              summary.totalRemaining < 0 ? styles.negativeValue : styles.positiveValue
            ]}>
              {formatCurrency(summary.totalRemaining)}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={navigateToBudgets}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="View budget details"
        accessibilityHint="Navigate to detailed budget information"
      >
        <Text style={styles.viewDetailsText}>View Budget Details</Text>
        <ChevronRight size={16} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  viewAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  circularProgressContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgress: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  circleProgress: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  warningText: {
    color: '#FF9500',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  statItem: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  statValue: {
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
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  createBudgetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  createBudgetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});