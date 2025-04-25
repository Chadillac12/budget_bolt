import { useTheme as useThemeContext } from '@/context/ThemeContext';
import { Theme } from '@/context/theme';
import { useTheme as usePaperTheme } from 'react-native-paper';

/**
 * Custom hook that provides the current theme with proper typing
 * This hook allows access to our custom theme properties with strong typing
 * 
 * @returns The current theme object with proper TypeScript types
 */
export const useAppTheme = (): Theme => {
  const { theme } = useThemeContext();
  
  return theme;
}; 