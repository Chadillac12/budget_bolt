import React, { ReactNode } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from './ThemedText';

interface ThemedFormProps {
  children: ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

interface ThemedFormFieldProps {
  children: ReactNode;
  label?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  helperText?: string;
}

/**
 * A themed form layout for consistent form styling
 * Provides proper spacing and organization for form fields
 */
export default function ThemedForm({ children, title, style }: ThemedFormProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      padding: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.md,
    },
  }));

  return (
    <View style={[styles.container, style]}>
      {title && (
        <ThemedText variant="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      )}
      {children}
    </View>
  );
}

/**
 * A themed form field component for consistent field styling
 * Includes label, error state, and helper text
 */
export function ThemedFormField({
  children,
  label,
  error,
  style,
  required,
  helperText,
}: ThemedFormFieldProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      marginBottom: theme.spacing.md,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.xs,
    },
    requiredIndicator: {
      color: theme.colors.error,
      marginLeft: theme.spacing.xs,
    },
    errorText: {
      marginTop: theme.spacing.xs,
      color: theme.colors.error,
    },
    helperText: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
    },
  }));

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <ThemedText variant="label">{label}</ThemedText>
          {required && (
            <ThemedText variant="label" style={styles.requiredIndicator}>
              *
            </ThemedText>
          )}
        </View>
      )}

      {children}

      {error && (
        <ThemedText variant="caption" style={styles.errorText}>
          {error}
        </ThemedText>
      )}

      {helperText && !error && (
        <ThemedText variant="caption" style={styles.helperText}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
} 