import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

// Define color type that accepts any valid color string
type ColorValue = string;

// Define custom typography with monospace font for headings
const customTypography = {
  ...MD3LightTheme.fonts,
  headlineLarge: {
    ...MD3LightTheme.fonts.headlineLarge,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headlineMedium: {
    ...MD3LightTheme.fonts.headlineMedium,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headlineSmall: {
    ...MD3LightTheme.fonts.headlineSmall,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  titleLarge: {
    ...MD3LightTheme.fonts.titleLarge,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  titleMedium: {
    ...MD3LightTheme.fonts.titleMedium,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  titleSmall: {
    ...MD3LightTheme.fonts.titleSmall,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
};

// Define the base theme structure
export interface BaseTheme {
  version: 3; // Explicitly type as 3 for MD3 compatibility
  colors: {
    primary: ColorValue;
    secondary: ColorValue;
    background: ColorValue;
    surface: ColorValue;
    text: ColorValue;
    textSecondary: ColorValue;
    border: ColorValue;
    success: ColorValue;
    error: ColorValue;
    warning: ColorValue;
    card: ColorValue;
    // Paper MD3 required color properties
    onPrimary: ColorValue;
    primaryContainer: ColorValue;
    onPrimaryContainer: ColorValue;
    secondaryContainer: ColorValue;
    onSecondaryContainer: ColorValue;
    tertiary: ColorValue;
    onTertiary: ColorValue;
    tertiaryContainer: ColorValue;
    onTertiaryContainer: ColorValue;
    onError: ColorValue;
    errorContainer: ColorValue;
    onErrorContainer: ColorValue;
    surfaceVariant: ColorValue;
    onSurfaceVariant: ColorValue;
    outline: ColorValue;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: typeof MD3LightTheme.fonts;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// Define base themes
export const lightTheme: BaseTheme = {
  ...MD3LightTheme,
  version: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6C6C6C',
    border: '#C6C6C8',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    card: '#FFFFFF',
    // Additional MD3 colors
    onPrimary: '#FFFFFF',
    primaryContainer: '#D1E4FF',
    onPrimaryContainer: '#001D36',
    secondaryContainer: '#E8E7FF',
    onSecondaryContainer: '#1A1563',
    tertiary: '#6F5DA7',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#ECDDFF',
    onTertiaryContainer: '#251A3D',
    onError: '#FFFFFF',
    errorContainer: '#FFDDDC',
    onErrorContainer: '#410002',
    surfaceVariant: '#E1E2EC',
    onSurfaceVariant: '#44464F',
    outline: '#74777F',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: customTypography,
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export const darkTheme: BaseTheme = {
  ...MD3DarkTheme,
  version: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#0A84FF',
    secondary: '#0A84FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    card: '#1C1C1E',
    // Additional MD3 colors
    onPrimary: '#001D36',
    primaryContainer: '#004A83',
    onPrimaryContainer: '#D1E4FF',
    secondaryContainer: '#4343CE',
    onSecondaryContainer: '#E8E7FF',
    tertiary: '#D0BCFF',
    onTertiary: '#371E73',
    tertiaryContainer: '#4F378B',
    onTertiaryContainer: '#ECDDFF',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    surfaceVariant: '#313033',
    onSurfaceVariant: '#C4C7C5',
    outline: '#8E9099',
  },
  spacing: lightTheme.spacing,
  typography: customTypography,
  borderRadius: lightTheme.borderRadius,
  shadows: lightTheme.shadows,
};

// Export theme type
export type Theme = BaseTheme; 