import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { formatCurrency } from '@/utils/dateUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BudgetCategory, BudgetCategoryGroup } from '@/types/budget';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface BudgetProgressBarProps {
  item: BudgetCategory | BudgetCategoryGroup;
  currency?: string;
  categoryColor?: string;
  isGroupLevel?: boolean;
}

export default function BudgetProgressBar(props: BudgetProgressBarProps) {
  const {
    item,
    currency = 'USD',
    categoryColor = '#007AFF',
    isGroupLevel = false
  } = props;
  
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const categoryName = 'name' in item ? item.name : 'Category Group';
  const progressAnimation = React.useRef(new Animated.Value(0)).current;
  
  // Animate progress bar on mount
  React.useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: Math.min(percentSpent, 100) / 100,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false
    }).start();
  }, []);

  const calculateGroupTotal = (group: BudgetCategoryGroup, property: 'allocated' | 'spent' | 'remaining'): number => {
    let total = 0;
    group.children.forEach((child: BudgetCategory | BudgetCategoryGroup) => {
      if ('categoryId' in child) {
        // BudgetCategory
        total += child[property];
      } else {
        // BudgetCategoryGroup
        total += calculateGroupTotal(child, property); // Recursive call for subgroups
      }
    });
    return total;
  };


  let allocated = 0;
  let spent = 0;
  let remaining = 0;
  let rolloverAmount = 0;


  if ('categoryId' in item) {
    // BudgetCategory
    const budgetCategory = item as BudgetCategory;
    allocated = budgetCategory.allocated;
    spent = budgetCategory.spent;
    remaining = budgetCategory.remaining;
    rolloverAmount = budgetCategory.rollover?.amount || 0;
  } else {
    // BudgetCategoryGroup
    const categoryGroup = item as BudgetCategoryGroup;
    allocated = calculateGroupTotal(categoryGroup, 'allocated');
    spent = calculateGroupTotal(categoryGroup, 'spent');
    remaining = calculateGroupTotal(categoryGroup, 'remaining');
  }


  // Calculate effective allocated amount (including rollover if present)
  const effectiveAllocated = allocated + rolloverAmount;


  // Calculate percentage spent
  const percentSpent = effectiveAllocated > 0 ? (spent / effectiveAllocated) * 100 : 0;


  // Determine color based on percentage spent
  const getProgressColor = () => {
    if (percentSpent < 50) return theme.colors.success; // Green
    if (percentSpent < 75) return '#30D158'; // Light Green
    if (percentSpent < 90) return theme.colors.warning; // Orange
    if (percentSpent < 100) return theme.colors.error; // Red
    return '#FF2D55'; // Bright Red for over budget
  };
  
  // Get background color for the container based on group level
  const getContainerStyle = () => {
    // Create a style object with proper typing
    const baseStyle: any = { ...styles.container };
    
    if (isGroupLevel) {
      baseStyle.borderLeftWidth = 3;
      baseStyle.borderLeftColor = theme.colors.primary;
    }
    
    if (!('categoryId' in item)) {
      baseStyle.backgroundColor = '#F8F8F8';
    }
    
    return baseStyle;
  };
  
  // Toggle tooltip visibility
  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  // Determine if this is a category or group for accessibility
  const itemType = 'categoryId' in item ? 'category' : 'group';
  const accessibilityLabel = `${categoryName} budget ${itemType}. ${formatCurrency(spent, currency)} spent of ${formatCurrency(allocated, currency)}. ${formatCurrency(remaining, currency)} remaining. ${percentSpent.toFixed(0)} percent spent.`;

  return (
    <View
      style={getContainerStyle()}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: percentSpent,
      }}
    >
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => {
          if (!('categoryId' in item)) { // Only toggle for category groups
            setIsExpanded(!isExpanded);
          }
        }}
        activeOpacity={0.7} // Reduce opacity when pressed for visual feedback
        accessible={true}
        accessibilityRole={!('categoryId' in item) ? "button" : "none"}
        accessibilityLabel={!('categoryId' in item) ? `${isExpanded ? 'Collapse' : 'Expand'} ${categoryName} group` : categoryName}
        accessibilityHint={!('categoryId' in item) ? "Double tap to toggle group expansion" : ""}
      >
        <View style={styles.titleContainer}>
          <Text style={[
            styles.categoryName,
            !('categoryId' in item) ? styles.groupCategoryName : null
          ]}>
            {categoryName}
          </Text>
          
          <TouchableOpacity
            style={styles.infoButton}
            onPress={toggleTooltip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Show budget details"
            accessibilityHint="Double tap to show detailed budget information"
          >
            <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {rolloverAmount > 0 && (
            <Text style={styles.rolloverText}>
              +{formatCurrency(rolloverAmount, currency)} rollover
            </Text>
          )}
          <Text style={[
            styles.remainingText,
            remaining < 0 ? styles.negativeRemaining : null
          ]}>
            {formatCurrency(remaining, currency)} left
          </Text>
          {/* Conditional rendering of expand/collapse icon */}
          { !('categoryId' in item) && (
            <Text style={styles.expandIcon}>
              {isExpanded ? '-' : '+'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Tooltip with detailed information */}
      {showTooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTitle}>Budget Details</Text>
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>Allocated:</Text>
            <Text style={styles.tooltipValue}>{formatCurrency(allocated, currency)}</Text>
          </View>
          {rolloverAmount > 0 && (
            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipLabel}>Rollover:</Text>
              <Text style={styles.tooltipValue}>{formatCurrency(rolloverAmount, currency)}</Text>
            </View>
          )}
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>Total Available:</Text>
            <Text style={styles.tooltipValue}>{formatCurrency(effectiveAllocated, currency)}</Text>
          </View>
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>Spent:</Text>
            <Text style={styles.tooltipValue}>{formatCurrency(spent, currency)}</Text>
          </View>
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>Remaining:</Text>
            <Text style={[
              styles.tooltipValue,
              remaining < 0 ? styles.negativeRemaining : styles.positiveRemaining
            ]}>
              {formatCurrency(remaining, currency)}
            </Text>
          </View>
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>Progress:</Text>
            <Text style={[
              styles.tooltipValue,
              percentSpent > 100 ? styles.negativeRemaining :
              percentSpent > 90 ? styles.warningValue :
              styles.positiveRemaining
            ]}>
              {percentSpent.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      <View style={styles.progressContainer}>
        {/* Background track */}
        <View style={styles.progressBackground} />
        
        {/* Animated progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: percentSpent > 100 ? theme.colors.error : getProgressColor(),
            },
          ]}
          accessible={false} // The parent view already has accessibility properties
        />
        
        {/* Milestone markers */}
        <View style={[styles.milestone, { left: '25%' }]} />
        <View style={[styles.milestone, { left: '50%' }]} />
        <View style={[styles.milestone, { left: '75%' }]} />
        <View style={[styles.milestone, { left: '100%' }]} />
      </View>
      
      {/* Percentage indicator that moves with the progress */}
      <View style={styles.percentageIndicatorContainer}>
        <View style={[
          styles.percentageIndicator,
          {
            left: `${Math.min(Math.max(percentSpent, 5), 95)}%`,
            backgroundColor: percentSpent > 100 ? theme.colors.error : getProgressColor()
          }
        ]}>
          <Text style={styles.percentageIndicatorText}>
            {percentSpent.toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.spentText}>
          {formatCurrency(spent, currency)} of {formatCurrency(allocated, currency)}
        </Text>
        <Text style={[
          styles.percentageText,
          percentSpent > 100 ? styles.overBudgetPercentage :
          percentSpent > 90 ? styles.warningPercentage : null
        ]}>
          {percentSpent.toFixed(1)}%
        </Text>
      </View>

      {percentSpent > 100 && (
        <View style={[styles.overBudgetIndicator, { borderColor: theme.colors.error }]}>
          <Text style={styles.overBudgetText}>
            Over budget by {formatCurrency(spent - allocated, currency)}
          </Text>
        </View>
      )}
      
      {percentSpent >= 90 && percentSpent <= 100 && (
        <View style={[styles.warningIndicator, { borderColor: theme.colors.warning }]}>
          <Text style={styles.warningText}>
            Approaching budget limit ({(100 - percentSpent).toFixed(1)}% remaining)
          </Text>
        </View>
      )}

      {/* Render children if it's a category group and expanded */}
      {!('categoryId' in item) && isExpanded && (
        <View style={styles.childrenContainer}>
          {item.children.map((child: BudgetCategory | BudgetCategoryGroup, index: number) => (
            <BudgetProgressBar
              key={index}
              item={child}
              currency={currency}
              categoryColor={categoryColor}
              isGroupLevel={false}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  groupContainer: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  categoryGroupContainer: {
    backgroundColor: '#F8F8F8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    marginLeft: 6,
    padding: 4, // Increase touch target
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
  rolloverText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning, // Orange color to indicate rollover
    marginLeft: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  groupCategoryName: {
    fontWeight: '700',
    fontSize: 17, // Slightly larger than regular category names
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.success,
  },
  negativeRemaining: {
    color: theme.colors.error,
  },
  progressContainer: {
    height: 12, // Slightly taller for better visibility
    backgroundColor: 'transparent',
    borderRadius: 6,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden', // Ensure content stays within rounded corners
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  milestone: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  percentageIndicatorContainer: {
    position: 'relative',
    height: 20,
    marginBottom: 8,
  },
  percentageIndicator: {
    position: 'absolute',
    top: -5,
    transform: [{ translateX: -15 }],
    backgroundColor: theme.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 30,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  percentageIndicatorText: {
    color: theme.colors.card,
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  overBudgetPercentage: {
    color: theme.colors.error,
    fontWeight: '700',
  },
  warningPercentage: {
    color: theme.colors.warning,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 16,
    marginLeft: 8,
    color: theme.colors.primary, // Or any color that fits your theme
    fontWeight: 'bold',
  },
  overBudgetIndicator: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningIndicator: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    shadowColor: theme.colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  childrenContainer: {
   marginLeft: 15, // Indentation for child categories
   marginTop: 8,
   paddingLeft: 8,
   borderLeftWidth: 1,
   borderLeftColor: 'rgba(0, 122, 255, 0.3)', // Light blue border for visual hierarchy
  },
  overBudgetText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.error,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.warning,
    textAlign: 'center',
  },
  tooltip: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tooltipLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  positiveRemaining: {
    color: theme.colors.success,
  },
  warningValue: {
    color: theme.colors.warning,
  },
});