import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ThemedContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'surface' | 'transparent';
  padding?: boolean;
  margin?: boolean;
  rounded?: boolean;
}

/**
 * A themed container component for consistent layout styling
 * Applies appropriate background colors and spacing based on theme
 */
export default function ThemedContainer({
  children,
  style,
  variant = 'surface',
  padding = true,
  margin = false,
  rounded = true,
}: ThemedContainerProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      width: '100%',
    }
  }));

  // Determine background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primaryContainer;
      case 'secondary':
        return theme.colors.secondaryContainer;
      case 'transparent':
        return 'transparent';
      case 'surface':
      default:
        return theme.colors.surface;
    }
  };

  return (
    <View 
      style={[
        styles.container,
        padding && { padding: theme.spacing.md },
        margin && { margin: theme.spacing.md },
        rounded && { borderRadius: theme.borderRadius.md },
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      {children}
    </View>
  );
} 