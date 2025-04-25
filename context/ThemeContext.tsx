import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './theme';

const THEME_STORAGE_KEY = '@budget_bolt/theme_mode';

// Define the ThemeContextType
export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// Create the context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        console.log('Loaded theme from storage:', savedTheme);
        if (savedTheme !== null) {
          console.log('Setting theme from storage to:', savedTheme);
          setIsDark(savedTheme === 'dark');
        } else {
          console.log('No saved theme, using system theme:', systemColorScheme);
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    if (!isLoading) {
      console.log('Saving theme to storage:', isDark ? 'dark' : 'light');
      AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
        .then(() => console.log('Theme saved successfully'))
        .catch(error => console.error('Error saving theme:', error));
    }
  }, [isDark, isLoading]);

  const toggleTheme = useCallback(() => {
    console.log('Theme toggled from', isDark ? 'dark' : 'light', 'to', !isDark ? 'dark' : 'light');
    setIsDark(prev => !prev);
  }, [isDark]);

  // Compute the current theme based on isDark state
  const theme = isDark ? darkTheme : lightTheme;

  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};