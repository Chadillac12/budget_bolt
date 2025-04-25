import React, { forwardRef } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ThemedInputProps extends Omit<TextInputProps, 'theme'> {
  containerStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
  error?: boolean;
  errorMessage?: string;
}

/**
 * A themed text input component that wraps React Native Paper's TextInput
 * Applies consistent theming to text inputs throughout the app
 */
const ThemedInput = forwardRef<any, ThemedInputProps>(({
  containerStyle,
  inputStyle,
  error = false,
  errorMessage,
  mode = 'outlined',
  ...rest
}, ref) => {
  const theme = useAppTheme();

  return (
    <TextInput
      ref={ref}
      mode={mode}
      style={[{ marginBottom: error && errorMessage ? 0 : theme.spacing.md }, containerStyle]}
      outlineStyle={{ borderRadius: theme.borderRadius.md }}
      contentStyle={inputStyle}
      activeOutlineColor={theme.colors.primary}
      textColor={theme.colors.text}
      placeholderTextColor={theme.colors.textSecondary}
      error={error}
      {...rest}
    />
  );
});

export default ThemedInput; 