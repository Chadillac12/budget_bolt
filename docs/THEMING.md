# Budget Bolt Theming Guide

This guide explains how to use the Budget Bolt theming system correctly to ensure consistent design across the application in both light and dark modes.

## Theme Architecture

Budget Bolt uses a combination of React Native Paper's Material Design 3 (MD3) with a custom theming layer:

1. **ThemeContext**: Manages theme state (light/dark) and provides theme objects
2. **PaperProvider**: Applies the theme to all Paper components
3. **Themed Components**: Custom components that respect the current theme

## Using Theme Colors

### Method 1: Themed Components (Preferred)

Use the provided themed components whenever possible:

```jsx
import ThemedText from '@/components/themed/ThemedText';
import ThemedCard from '@/components/themed/ThemedCard';
import ThemedScreen from '@/components/themed/ThemedScreen';

function MyScreen() {
  return (
    <ThemedScreen>
      <ThemedCard>
        <ThemedText variant="title">My Card Title</ThemedText>
        <ThemedText variant="body">Card content goes here</ThemedText>
      </ThemedCard>
    </ThemedScreen>
  );
}
```

### Method 2: Direct Theme Access

Use the `useAppTheme` hook to access the current theme:

```jsx
import { View, Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

function MyComponent() {
  const theme = useAppTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md
    }}>
      <Text style={{ color: theme.colors.text }}>
        Theme-aware content
      </Text>
    </View>
  );
}
```

### Method 3: React Native Paper Components

Use Paper components directly which will automatically use the theme:

```jsx
import { Card, Title, Paragraph, Button } from 'react-native-paper';

function MyPaperComponent() {
  return (
    <Card>
      <Card.Content>
        <Title>Card Title</Title>
        <Paragraph>Card content using Paper components</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button>OK</Button>
      </Card.Actions>
    </Card>
  );
}
```

## Theme Properties

### Colors

The theme provides the following color properties:

```typescript
// Base Colors
theme.colors.primary       // Primary brand color
theme.colors.secondary     // Secondary brand color
theme.colors.background    // Screen background
theme.colors.surface       // Surface background (cards, etc)
theme.colors.text          // Primary text color
theme.colors.textSecondary // Secondary text color
theme.colors.border        // Border color
theme.colors.success       // Success/positive color
theme.colors.error         // Error/negative color
theme.colors.warning       // Warning color
theme.colors.card          // Card background

// MD3 Specific Colors
theme.colors.onPrimary            // Text/icons on primary color
theme.colors.primaryContainer     // Container with primary color
theme.colors.onPrimaryContainer   // Text/icons on primary container
// ...and many more
```

### Spacing

The theme provides consistent spacing values:

```typescript
theme.spacing.xs  // 4
theme.spacing.sm  // 8
theme.spacing.md  // 16
theme.spacing.lg  // 24
theme.spacing.xl  // 32
theme.spacing.xxl // 48
```

### Typography

The theme includes Material Design 3 typography variants:

```jsx
<ThemedText variant="title">Title text</ThemedText>
<ThemedText variant="subtitle">Subtitle text</ThemedText>
<ThemedText variant="body">Body text</ThemedText>
<ThemedText variant="caption">Caption text</ThemedText>
<ThemedText variant="label">Label text</ThemedText>
<ThemedText variant="error">Error text</ThemedText>
```

### Border Radius

The theme provides consistent border radius values:

```typescript
theme.borderRadius.sm    // 4
theme.borderRadius.md    // 8
theme.borderRadius.lg    // 16
theme.borderRadius.xl    // 24
theme.borderRadius.round // 9999 (fully rounded)
```

## Toggling Dark Mode

To toggle between light and dark mode:

```jsx
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <Button onPress={toggleTheme}>
      Switch to {isDark ? 'Light' : 'Dark'} Mode
    </Button>
  );
}
```

## Custom Components with Theming

When creating new components, ensure they respect the theme:

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from '@/components/themed/ThemedText';

function MyCustomComponent({ title, description }) {
  const theme = useAppTheme();
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }
    ]}>
      <ThemedText variant="subtitle">{title}</ThemedText>
      <ThemedText variant="body">{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
  },
});
```

## Best Practices

1. **Always use themed components** when available
2. **Never use hardcoded colors** - always use theme colors
3. **Test in both light and dark modes** to ensure proper contrast
4. **Use Paper components** for complex UI elements (Buttons, TextInputs, etc.)
5. **Use proper semantic color properties** (e.g., use `error` for error states, not just any red color)
6. **Consider accessibility** by maintaining good contrast ratios
7. **Use the theme's spacing values** for consistent layout

## Examples

### Card with colored border

```jsx
<ThemedCard borderLeftColor="#FF0000">
  <ThemedText variant="subtitle">Card with colored border</ThemedText>
</ThemedCard>
```

### Screen with themed elements

```jsx
<ThemedScreen>
  <ThemedText variant="title">Screen Title</ThemedText>
  
  <ThemedCard>
    <ThemedText variant="subtitle">Card Title</ThemedText>
    <ThemedText variant="body">
      This card uses themed components for consistent styling.
    </ThemedText>
  </ThemedCard>
  
  <Button 
    mode="contained" 
    onPress={() => {}}
    style={{ margin: 16 }}
  >
    Paper Button
  </Button>
</ThemedScreen>
```

### Custom component with theme awareness

```jsx
function StatCard({ label, value, trend }) {
  const theme = useAppTheme();
  const trendColor = trend > 0 ? theme.colors.success : theme.colors.error;
  
  return (
    <ThemedCard>
      <ThemedText variant="label">{label}</ThemedText>
      <ThemedText 
        variant="title" 
        style={{ marginVertical: theme.spacing.xs }}
      >
        {value}
      </ThemedText>
      <ThemedText style={{ color: trendColor }}>
        {trend > 0 ? '+' : ''}{trend}%
      </ThemedText>
    </ThemedCard>
  );
}
``` 