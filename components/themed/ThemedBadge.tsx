import React from 'react';
import { View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from './ThemedText';

interface ThemedBadgeProps {
  label: string | number;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  outlined?: boolean;
  pill?: boolean;
}

/**
 * A themed badge component for status indicators and counters
 * Supports different variants, sizes, and styles
 */
export default function ThemedBadge({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
  outlined = false,
  pill = false,
}: ThemedBadgeProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    badge: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: outlined ? 1 : 0,
    },
    small: {
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
    },
    medium: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    large: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    text: {
      fontWeight: '500',
    },
    smallText: {
      fontSize: 10,
    },
    mediumText: {
      fontSize: 12,
    },
    largeText: {
      fontSize: 14,
    },
  }));

  // Get background and text colors based on variant
  const getColors = () => {
    let backgroundColor = theme.colors.surface;
    let textColor = theme.colors.text;
    let borderColor = 'transparent';

    switch (variant) {
      case 'primary':
        backgroundColor = outlined ? 'transparent' : theme.colors.primary;
        textColor = outlined ? theme.colors.primary : theme.colors.onPrimary;
        borderColor = theme.colors.primary;
        break;
      case 'success':
        backgroundColor = outlined ? 'transparent' : theme.colors.success;
        textColor = outlined ? theme.colors.success : '#FFFFFF';
        borderColor = theme.colors.success;
        break;
      case 'error':
        backgroundColor = outlined ? 'transparent' : theme.colors.error;
        textColor = outlined ? theme.colors.error : '#FFFFFF';
        borderColor = theme.colors.error;
        break;
      case 'warning':
        backgroundColor = outlined ? 'transparent' : theme.colors.warning;
        textColor = outlined ? theme.colors.warning : '#FFFFFF';
        borderColor = theme.colors.warning;
        break;
      case 'info':
        backgroundColor = outlined ? 'transparent' : theme.colors.secondary;
        textColor = outlined ? theme.colors.secondary : '#FFFFFF';
        borderColor = theme.colors.secondary;
        break;
      default:
        backgroundColor = outlined ? 'transparent' : theme.colors.surface;
        textColor = theme.colors.text;
        borderColor = theme.colors.border;
    }

    return { backgroundColor, textColor, borderColor };
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { containerStyle: styles.small, textStyle: styles.smallText };
      case 'large':
        return { containerStyle: styles.large, textStyle: styles.largeText };
      case 'medium':
      default:
        return { containerStyle: styles.medium, textStyle: styles.mediumText };
    }
  };

  const { backgroundColor, textColor, borderColor } = getColors();
  const { containerStyle, textStyle: sizeTextStyle } = getSizeStyles();
  const borderRadius = pill ? theme.borderRadius.round : theme.borderRadius.sm;

  return (
    <View
      style={[
        styles.badge,
        containerStyle,
        { backgroundColor, borderColor, borderRadius },
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          sizeTextStyle,
          { color: textColor },
          textStyle,
        ]}
      >
        {label}
      </ThemedText>
    </View>
  );
} 