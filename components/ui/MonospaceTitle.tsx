import React from 'react';
import { Text, StyleSheet, TextStyle, Platform } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface MonospaceTitleProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  style?: TextStyle;
}

/**
 * A reusable monospace title component for consistent heading styles
 * across the application.
 */
export default function MonospaceTitle({ 
  children, 
  size = 'medium', 
  style 
}: MonospaceTitleProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  
  const titleStyle = {
    ...styles.base,
    ...(size === 'small' ? styles.small : 
       size === 'large' ? styles.large : 
       styles.medium),
    ...style
  };
  
  return (
    <Text style={titleStyle}>
      {children}
    </Text>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  base: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.colors.text,
    fontWeight: '600',
  },
  small: {
    fontSize: 16,
    marginBottom: 4,
  },
  medium: {
    fontSize: 18,
    marginBottom: 8,
  },
  large: {
    fontSize: 24,
    marginBottom: 12,
  }
}); 