import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { formatCurrency } from '@/utils/dateUtils';

interface BudgetProgressBarProps {
  allocated: number;
  spent: number;
  remaining: number;
  currency?: string;
  categoryName: string;
  categoryColor?: string;
}

export default function BudgetProgressBar({
  allocated,
  spent,
  remaining,
  currency = 'USD',
  categoryName,
  categoryColor = '#007AFF'
}: BudgetProgressBarProps) {
  // Calculate percentage spent
  const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0;
  
  // Determine color based on percentage spent
  const getProgressColor = () => {
    if (percentSpent < 75) return '#34C759'; // Green
    if (percentSpent < 90) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={styles.remainingText}>
          {formatCurrency(remaining, currency)} left
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(percentSpent, 100)}%`,
              backgroundColor: percentSpent > 100 ? '#FF3B30' : getProgressColor(),
            },
          ]}
        />
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.spentText}>
          {formatCurrency(spent, currency)} of {formatCurrency(allocated, currency)}
        </Text>
        <Text style={styles.percentageText}>
          {percentSpent.toFixed(1)}%
        </Text>
      </View>
      
      {percentSpent > 100 && (
        <View style={[styles.overBudgetIndicator, { borderColor: '#FF3B30' }]}>
          <Text style={styles.overBudgetText}>Over budget by {formatCurrency(spent - allocated, currency)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  overBudgetIndicator: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  overBudgetText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF3B30',
    textAlign: 'center',
  },
});