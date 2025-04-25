import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider as PaperThemeProvider } from 'react-native-paper';
import { useTheme } from '@/context/ThemeContext';
import { lightTheme, darkTheme } from '@/context/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * A centralized theme provider that ensures all child components
 * have access to the same theme instance.
 * 
 * This component:
 * 1. Provides the current theme to Paper components
 * 2. Sets a default background color for the entire app
 * 3. Ensures consistent spacing via container
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDark, theme } = useTheme();
  
  // Use the appropriate Paper theme based on light/dark mode
  const paperTheme = isDark 
    ? { ...darkTheme, colors: { ...darkTheme.colors } } 
    : { ...lightTheme, colors: { ...lightTheme.colors } };

  return (
    <PaperThemeProvider theme={paperTheme}>
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background }
      ]}>
        {children}
      </View>
    </PaperThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 