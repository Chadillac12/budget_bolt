import React, { ReactNode } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ThemedIconContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  size?: number;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'surface';
  backgroundColor?: string;
}

/**
 * A themed container for icons with consistent styling
 * Provides a circular background with proper theme colors
 */
export default function ThemedIconContainer({
  children,
  style,
  size = 36,
  variant = 'primary',
  backgroundColor,
}: ThemedIconContainerProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    }
  }));

  // Get background color based on variant
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    switch (variant) {
      case 'success':
        return theme.colors.success + '20'; // 20% opacity
      case 'error':
        return theme.colors.error + '20'; // 20% opacity
      case 'warning':
        return theme.colors.warning + '20'; // 20% opacity
      case 'surface':
        return theme.colors.surface;
      case 'primary':
      default:
        return theme.colors.primary + '20'; // 20% opacity
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
} 