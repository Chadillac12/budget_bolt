import React from 'react';
import { Text, StyleProp, TextStyle, Pressable, Platform } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface ThemedTextProps {
  children: React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'error';
  style?: StyleProp<TextStyle>;
  color?: string;
  onPress?: () => void;
  monospace?: boolean;
}

/**
 * A themed text component with consistent typography
 * Supports various text variants with theme-appropriate styling
 */
export default function ThemedText({ 
  children, 
  variant = 'body',
  style,
  color,
  onPress,
  monospace = false,
}: ThemedTextProps) {
  const theme = useAppTheme();
  
  // Monospace font family based on platform
  const monospaceFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
  
  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    base: {
      color: theme.colors.text,
    },
    title: {
      ...theme.typography.titleLarge,
      fontWeight: 'bold',
      // Title variants always use monospace font
      fontFamily: monospaceFont,
    },
    subtitle: {
      ...theme.typography.titleMedium,
    },
    body: {
      ...theme.typography.bodyMedium,
    },
    caption: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    label: {
      ...theme.typography.labelMedium,
    },
    error: {
      ...theme.typography.bodyMedium,
      color: theme.colors.error,
    },
    monospace: {
      fontFamily: monospaceFont,
    }
  }));

  // Determine text style based on variant
  const getVariantStyle = () => {
    switch (variant) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      case 'error':
        return styles.error;
      case 'body':
      default:
        return styles.body;
    }
  };

  const textElement = (
    <Text 
      style={[
        styles.base,
        getVariantStyle(),
        monospace && styles.monospace,
        color && { color },
        style,
      ]}
    >
      {children}
    </Text>
  );

  // Return with or without pressable wrapper
  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {textElement}
      </Pressable>
    );
  }
  
  return textElement;
} 