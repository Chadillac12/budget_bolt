import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

// Adaptive StatusBar component that changes with theme
function AdaptiveStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

// Layout component that uses the theme
function RootLayoutWithTheme() {
  const { theme, isDark } = useTheme();
  
  // Use Paper's MD3 themes as a base, and override with our theme colors
  const paperTheme = isDark
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...theme.colors } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...theme.colors } };
  
  return (
    <PaperProvider theme={paperTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="csv-test" options={{ headerShown: true, title: "CSV Parser Test" }} />
      </Stack>
      <AdaptiveStatusBar />
    </PaperProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ThemeProvider>
          <RootLayoutWithTheme />
        </ThemeProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}