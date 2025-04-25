import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useAppTheme } from './useAppTheme';
import { Theme } from '@/context/theme';

/**
 * Hook to create styles that depend on the current theme
 * Creates styles at render time based on current theme values
 * 
 * @param styleFactory Function that generates styles based on the current theme
 * @returns Memoized StyleSheet with theme-aware styles
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleFactory: (theme: Theme) => T
): T {
  const theme = useAppTheme();
  
  // Create styles based on the current theme, memoized to avoid recalculation
  return useMemo(() => {
    const styles = styleFactory(theme);
    return StyleSheet.create(styles);
  }, [theme, styleFactory]);
}

/**
 * Type for a style factory function that accepts a theme and returns an object of styles
 */
export type ThemedStyleFactory<T> = (theme: Theme) => T;

/**
 * Type for any style (View, Text, or Image)
 */
export type AnyStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Example usage:
 * 
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: theme.spacing.md,
 *   },
 *   title: {
 *     color: theme.colors.text,
 *     fontSize: 18,
 *   },
 * }));
 */ 