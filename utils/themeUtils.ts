import { Platform } from 'react-native';
import { Theme } from '@/context/theme';

/**
 * Applies alpha transparency to a hex color
 * @param hexColor Hex color code (with or without #)
 * @param alpha Alpha value between 0 and 1
 * @returns RGBA color string
 */
export function applyAlpha(hexColor: string, alpha: number): string {
  // Ensure alpha is between 0 and 1
  const validAlpha = Math.max(0, Math.min(1, alpha));
  
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

  // Convert hex to rgb
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Return rgba format
  return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
}

/**
 * Create a shadow style object based on the theme and elevation
 * @param theme Current theme object
 * @param elevation Elevation level (1-5)
 * @returns Shadow style object
 */
export function createShadow(theme: Theme, elevation: 1 | 2 | 3 | 4 | 5 = 1): object {
  // Get shadow from theme based on elevation
  let shadow;
  switch (elevation) {
    case 5:
    case 4:
      shadow = theme.shadows.lg;
      break;
    case 3:
    case 2:
      shadow = theme.shadows.md;
      break;
    case 1:
    default:
      shadow = theme.shadows.sm;
      break;
  }

  // Adjust shadow for platform
  if (Platform.OS === 'ios') {
    return {
      shadowColor: shadow.shadowColor,
      shadowOffset: shadow.shadowOffset,
      shadowOpacity: shadow.shadowOpacity,
      shadowRadius: shadow.shadowRadius,
    };
  } else {
    return {
      elevation: shadow.elevation,
    };
  }
}

/**
 * Helper to create conditional styles based on theme
 * @param condition Boolean condition
 * @param styles Styles to apply if condition is true
 * @returns Styles or null
 */
export function conditionalStyle<T>(condition: boolean, styles: T): T | null {
  return condition ? styles : null;
}

/**
 * Adjusts a color's lightness
 * @param hexColor Hex color code (with or without #)
 * @param amount Amount to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
export function adjustColorLightness(hexColor: string, amount: number): string {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

  // Convert hex to rgb
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);

  // Convert RGB to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  // Adjust lightness
  l = Math.max(0, Math.min(1, l + amount / 100));

  // Convert back to RGB
  let r1, g1, b1;
  if (s === 0) {
    r1 = g1 = b1 = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r1 = hue2rgb(p, q, h + 1 / 3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1 / 3);
  }

  // Convert back to hex
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

/**
 * Maps hardcoded color values to theme colors
 * @param theme Current theme object
 * @param hexColor Original hex color
 * @returns Theme-compatible color
 */
export function mapColorToTheme(theme: Theme, hexColor: string): string {
  const colorMap: Record<string, keyof Theme['colors']> = {
    // Light mode colors and their theme equivalents
    '#007AFF': 'primary',
    '#0066cc': 'primary',
    '#5856D6': 'secondary',
    '#34C759': 'success',
    '#FF3B30': 'error',
    '#FF9500': 'warning',
    '#F2F2F7': 'surface',
    '#E5E5EA': 'border',
    '#E5F1FF': 'primaryContainer',
    '#F2F9FF': 'primaryContainer',
    '#F9F9F9': 'surface',
    '#8E8E93': 'textSecondary',
    '#000000': 'text',
    '#FFFFFF': 'card',
    '#fff': 'card',
    '#000': 'text',
    
    // Dark mode equivalents for testing
    '#2196F3': 'primary',
    '#4CAF50': 'success',
    '#F44336': 'error',
    '#FF9800': 'warning',
    '#212121': 'text',
    '#757575': 'textSecondary',
    '#F5F5F5': 'surface',
    '#E0E0E0': 'border',
    '#E3F2FD': 'primaryContainer',
  };

  // Return theme color if mapping exists, otherwise return original color
  return theme.colors[colorMap[hexColor] as keyof Theme['colors']] || hexColor;
}

/**
 * Creates a base set of themed style properties for commonly used styles
 * @param theme Current theme object
 * @returns Object with common themed styles
 */
export function getBaseThemedStyles(theme: Theme) {
  return {
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    surface: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      width: '100%',
    },
    text: {
      color: theme.colors.text,
      ...theme.typography.bodyMedium,
    },
    textSecondary: {
      color: theme.colors.textSecondary,
      ...theme.typography.bodySmall,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    secondaryButtonText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
    padding: {
      padding: theme.spacing.md,
    },
    margin: {
      margin: theme.spacing.md,
    },
    marginVertical: {
      marginVertical: theme.spacing.md,
    },
    marginHorizontal: {
      marginHorizontal: theme.spacing.md,
    },
  };
} 