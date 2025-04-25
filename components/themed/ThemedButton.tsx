import React from 'react';
import { StyleProp, ViewStyle, TextStyle, Platform } from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ThemedButtonProps extends Omit<ButtonProps, 'theme'> {
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  useMonospace?: boolean;
}

/**
 * A themed button component that wraps React Native Paper's Button
 * Applies consistent theming to buttons throughout the app
 */
export default function ThemedButton({
  style,
  labelStyle,
  variant = 'primary',
  mode = 'contained',
  useMonospace = true, // Default to true for monospace text
  ...rest
}: ThemedButtonProps) {
  const theme = useAppTheme();
  
  // Monospace font for buttons
  const monospaceStyle: TextStyle = {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600'
  };

  // Get color based on variant
  const getColorForVariant = () => {
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary;
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'primary':
      default:
        return theme.colors.primary;
    }
  };

  // Determine button and text colors based on mode and variant
  const buttonColor = mode === 'contained' ? getColorForVariant() : undefined;
  const textColor = mode !== 'contained' ? getColorForVariant() : undefined;

  // Apply monospace style to label if useMonospace is true
  const combinedLabelStyle = [
    useMonospace ? monospaceStyle : null,
    labelStyle
  ];

  return (
    <Button
      mode={mode}
      buttonColor={buttonColor}
      textColor={textColor}
      style={style}
      labelStyle={combinedLabelStyle}
      {...rest}
    />
  );
} 