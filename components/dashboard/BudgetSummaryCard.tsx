import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BudgetSummary } from '@/types/budget';
import { formatCurrency } from '@/utils/dateUtils';
import { ChevronRight } from 'lucide-react-native';
import { ThemedCard, ThemedText } from '@/components/themed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface BudgetSummaryCardProps {
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    remainingBudget: number;
  };
  hasActiveBudget: boolean;
}

export default function BudgetSummaryCard({ summary, hasActiveBudget }: BudgetSummaryCardProps) {
  const appTheme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  
  const navigateToBudgets = () => {
    // Since there's no budgets tab yet, we'll navigate to the index tab for now
    router.push("/(tabs)");
  };
  
  // Calculate percentage for the circular progress indicator
  const percentageSpent = summary.totalSpent / summary.totalBudgeted * 100;
  const circumference = 2 * Math.PI * 40; // Circle radius is 40
  const strokeDashoffset = circumference - (percentageSpent / 100) * circumference;
  
  // Determine color based on percentage spent
  const getProgressColor = () => {
    if (percentageSpent < 50) return appTheme.colors.success; // Green
    if (percentageSpent < 75) return appTheme.colors.success; // Light Green
    if (percentageSpent < 90) return appTheme.colors.warning; // Orange
    if (percentageSpent < 100) return appTheme.colors.error; // Red
    return appTheme.colors.error; // Bright Red for over budget
  };

  if (!hasActiveBudget) {
    return (
      <ThemedCard style={styles.container}>
        <ThemedText variant="title" monospace={true}>Budget Summary</ThemedText>
        <ThemedText variant="body" style={styles.emptyText}>
          No active budget for this month
        </ThemedText>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard style={styles.container}>
      <ThemedText variant="title" monospace={true}>Budget Summary</ThemedText>
      
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <ThemedText variant="label">Budgeted</ThemedText>
          <ThemedText variant="body" style={styles.amount}>
            ${summary.totalBudgeted.toFixed(2)}
          </ThemedText>
        </View>
        
        <View style={styles.summaryItem}>
          <ThemedText variant="label">Spent</ThemedText>
          <ThemedText 
            variant="body" 
            style={[styles.amount, { color: appTheme.colors.error }]}
          >
            ${summary.totalSpent.toFixed(2)}
          </ThemedText>
        </View>
        
        <View style={styles.summaryItem}>
          <ThemedText variant="label">Remaining</ThemedText>
          <ThemedText 
            variant="body" 
            style={[
              styles.amount, 
              { 
                color: summary.remainingBudget >= 0 
                  ? appTheme.colors.success 
                  : appTheme.colors.error 
              }
            ]}
          >
            ${Math.abs(summary.remainingBudget).toFixed(2)}
          </ThemedText>
        </View>
      </View>
    </ThemedCard>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  amount: {
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
});