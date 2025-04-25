# Budget Bolt Theming Guide

This guide explains Budget Bolt's theming system and how to use it to ensure your components adapt properly to light and dark modes.

## Table of Contents

- [Overview](#overview)
- [Theme Structure](#theme-structure)
- [Using Themes](#using-themes)
  - [Hooks](#hooks)
  - [Themed Components](#themed-components)
  - [Dynamic Styling](#dynamic-styling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Budget Bolt uses a React Context-based theming system that provides both light and dark themes. The theming system is built to:

- Provide consistent styling across the app
- Support both light and dark modes
- Follow system preferences
- Allow user theme overrides
- Provide type safety

## Theme Structure

Our theme structure is defined in `context/theme.ts` and includes:

```typescript
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    card: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondaryContainer: string;
    // ... additional colors
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    // React Native Paper typography
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  shadows: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  };
}
```

## Using Themes

### Hooks

Budget Bolt provides several hooks for accessing and using themes:

#### `useAppTheme()`

This hook provides the current theme object with proper typing:

```typescript
import { useAppTheme } from '@/hooks/useAppTheme';

function MyComponent() {
  const theme = useAppTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      {/* Component content */}
    </View>
  );
}
```

#### `useThemedStyles()`

This hook creates memoized styles that depend on the theme:

```typescript
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

function MyComponent() {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
}

// Define styles function outside component to avoid recreation
const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  text: {
    color: theme.colors.text,
    ...theme.typography.bodyMedium,
  },
});
```

### Themed Components

The app provides pre-themed components in the `components/themed` directory:

#### `ThemedScreen`

A wrapper for screens with proper theming:

```tsx
import { ThemedScreen } from '@/components/themed';

export default function HomeScreen() {
  return (
    <ThemedScreen>
      {/* Screen content */}
    </ThemedScreen>
  );
}
```

#### `ThemedText`

For themed text with variants:

```tsx
import { ThemedText } from '@/components/themed';

<ThemedText>Regular text</ThemedText>
<ThemedText variant="title">Title text</ThemedText>
<ThemedText variant="subtitle">Subtitle text</ThemedText>
<ThemedText variant="caption" color={theme.colors.error}>Error caption</ThemedText>
```

#### `ThemedCard`

For card elements:

```tsx
import { ThemedCard } from '@/components/themed';

<ThemedCard elevation={2} onPress={() => console.log('Pressed')}>
  <ThemedText>Card content</ThemedText>
</ThemedCard>
```

#### `ThemedContainer`

A general-purpose container:

```tsx
import { ThemedContainer } from '@/components/themed';

<ThemedContainer variant="surface" padding rounded>
  {/* Container content */}
</ThemedContainer>
```

#### `ThemedButton`

Themed button component:

```tsx
import { ThemedButton } from '@/components/themed';

<ThemedButton mode="contained" onPress={handlePress}>
  Press Me
</ThemedButton>

<ThemedButton mode="outlined" variant="error" onPress={handleCancel}>
  Cancel
</ThemedButton>
```

### Dynamic Styling

For more dynamic styling based on theme values, you can use the `useAppTheme` hook directly:

```tsx
import { useAppTheme } from '@/hooks/useAppTheme';

function DynamicComponent() {
  const theme = useAppTheme();
  
  return (
    <View style={{ 
      backgroundColor: someCondition 
        ? theme.colors.success 
        : theme.colors.error,
      padding: someValue ? theme.spacing.lg : theme.spacing.sm,
    }}>
      {/* Dynamic content */}
    </View>
  );
}
```

## Best Practices

1. **Never hardcode colors** - Always use theme colors instead of hardcoded hex values

2. **Use themed components** - Prefer using the pre-themed components whenever possible

3. **Define styles outside components** - Define `createStyles` functions outside your component to avoid recreation on render

4. **Type your styles** - Always type your theme parameter:
   ```typescript
   const createStyles = (theme: Theme) => StyleSheet.create({ ... });
   ```

5. **Consistent naming** - Use consistent naming for style properties that match the theme structure

6. **Test both themes** - Always test your components in both light and dark mode

7. **Use memoization** - Especially for complex style calculations, leverage memoization:
   ```typescript
   const styles = useThemedStyles(React.useCallback((theme) => ({
     // Complex calculations here
   }), [dependencies]));
   ```

## Troubleshooting

### Common Issues

1. **Styles not updating on theme change**
   - Make sure you're using `useThemedStyles` instead of `StyleSheet.create` directly
   - Check that the theme object is being passed to your style function

2. **TypeScript errors**
   - Ensure you're importing the `Theme` type and using it to type your style function
   - Make sure you're using `StyleSheet.create` inside your style function

3. **Performance issues**
   - Make sure your style functions are defined outside of components
   - Consider memoizing complex style calculations with `useCallback`

### Theme Conversion

If you need to convert an existing component to use theming, you can use the themify script:

```
node scripts/themify.js path/to/component
```

This script will automatically:
- Add theme imports
- Replace hardcoded colors with theme references
- Convert StyleSheet.create to use theming
- Add the theme hook to your component

For manual conversion, follow these steps:
1. Import the necessary hooks
2. Replace hardcoded colors with theme references
3. Convert StyleSheet.create to themed styles function
4. Add the theme hooks to your component

## Example

A complete example of a themed component:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

export default function ThemedExample() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.container}>
      <ThemedText variant="title" style={styles.title}>
        Themed Example
      </ThemedText>
      
      <View style={styles.card}>
        <ThemedText>
          This component adapts to the current theme
        </ThemedText>
      </View>
      
      <View 
        style={[
          styles.colorBlock, 
          { backgroundColor: theme.colors.primary }
        ]}
      >
        <ThemedText color={theme.colors.onPrimary}>
          Primary Color
        </ThemedText>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  colorBlock: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
});
``` 