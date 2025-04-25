import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FlexAlignType } from 'react-native';

/**
 * Props for ThemedStatCard component
 */
export interface ThemedStatCardProps {
  /** Title displayed at the top of the card */
  title: string;
  /** Main value/statistic to display */
  value: string | number;
  /** Optional subtitle or description text */
  subtitle?: string;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
  /** Color variant for the card */
  colorVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  /** Optional icon component to display */
  icon?: React.ReactNode;
  /** Alignment of content within the card */
  alignment?: 'left' | 'center' | 'right';
  /** Optional function to call when card is pressed */
  onPress?: () => void;
}

/**
 * A themed card component for displaying statistics or financial numbers
 */
export function ThemedStatCard({
  title,
  value,
  subtitle,
  style,
  colorVariant = 'primary',
  icon,
  alignment = 'left',
  onPress,
}: ThemedStatCardProps) {
  const theme = useAppTheme();
  
  // Determine value color based on variant
  const getValueColor = () => {
    switch (colorVariant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'danger':
        return theme.colors.error;
      case 'info':
        return theme.colors.secondary;
      case 'neutral':
        return theme.colors.text;
      case 'primary':
      default:
        return theme.colors.primary;
    }
  };
  
  // Get alignment style based on prop
  const getAlignmentStyle = (): { alignItems: FlexAlignType } => {
    switch (alignment) {
      case 'center':
        return { alignItems: 'center' };
      case 'right':
        return { alignItems: 'flex-end' };
      case 'left':
      default:
        return { alignItems: 'flex-start' };
    }
  };
  
  const CardContent = () => (
    <View 
      style={[
        styles.container, 
        getAlignmentStyle(),
        { backgroundColor: theme.colors.card },
        style
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      
      <Text style={[styles.value, { color: getValueColor() }]}>
        {value}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
  
  // Wrap in TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <CardContent />
      </TouchableOpacity>
    );
  }
  
  return <CardContent />;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
}); 