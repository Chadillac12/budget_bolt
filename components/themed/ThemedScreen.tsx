import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ThemedScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: boolean;
  safeArea?: boolean;
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark';
}

/**
 * A wrapper component that applies theming to screens
 * Use this at the root of each screen to ensure consistent theming
 */
export default function ThemedScreen({ 
  children, 
  style, 
  padding = false,
  safeArea = true,
  statusBarStyle = 'auto'
}: ThemedScreenProps) {
  const { isDark } = useTheme();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  
  // Determine status bar style
  const getStatusBarStyle = (): 'light' | 'dark' => {
    if (statusBarStyle === 'auto') {
      return isDark ? 'light' : 'dark';
    } else if (statusBarStyle === 'inverted') {
      return isDark ? 'dark' : 'light';
    }
    return statusBarStyle;
  };
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.background },
        safeArea && { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        padding && { padding: theme.spacing.md },
        style
      ]}
    >
      <StatusBar style={getStatusBarStyle()} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 