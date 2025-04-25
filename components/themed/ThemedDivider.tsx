import React from 'react';
import { View, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ThemedDividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  thickness?: number;
  length?: DimensionValue;
  color?: string;
}

/**
 * A themed divider component for consistent separation styling
 * Can be used in horizontal or vertical orientation
 */
export default function ThemedDivider({
  orientation = 'horizontal',
  style,
  thickness = 1,
  length = '100%',
  color,
}: ThemedDividerProps) {
  const theme = useAppTheme();
  
  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    horizontal: {
      marginVertical: theme.spacing.sm,
    },
    vertical: {
      marginHorizontal: theme.spacing.sm,
    }
  }));
  
  return (
    <View 
      style={[
        orientation === 'horizontal' 
          ? { ...styles.horizontal, height: thickness, width: length }
          : { ...styles.vertical, width: thickness, height: length },
        { backgroundColor: color || theme.colors.border },
        style
      ]} 
    />
  );
} 