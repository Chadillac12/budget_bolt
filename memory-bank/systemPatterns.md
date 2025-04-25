# System Patterns

This file documents the architecture, patterns, and component relationships for the Budget Bolt app.
2025-04-24 09:30:21 - Log of updates made.

## Theme Architecture

The Budget Bolt app uses a comprehensive theme system to ensure consistent visual styling across the application with support for both light and dark modes.

### Theme Management Components

#### Core Theme Components
- **ThemeContext** (context/ThemeContext.tsx): Provides theme state and toggle function throughout the app
- **theme.ts** (context/theme.ts): Defines theme objects with colors, spacing, typography, and other design tokens
- **useAppTheme** (hooks/useAppTheme.ts): Typed hook for accessing the current theme with TypeScript support

#### Themed UI Components
- **ThemedScreen**: Wrapper for screens that applies theme background and StatusBar styling
- **ThemedText**: Text component with variant support (title, subtitle, body, caption, label)
- **ThemedCard**: Card component with consistent styling and optional left border

### Theme Structure

The theme structure in theme.ts includes:

```typescript
interface BaseTheme {
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
  shadows: { /* shadow definitions */ };
}
```

### Current Implementation Patterns

The current theme implementation has the following relationships:

1. **ThemeProvider** (in app/_layout.tsx) wraps the entire application
2. The theme state is initialized based on device settings and stored in AsyncStorage
3. Components can access theme state via the `useTheme()` hook
4. Some screens/components use the theme system properly, while others use hardcoded colors
5. The settings screen provides a toggle for switching between light and dark mode

### Integration with React Native Paper

The app extends Material Design 3 themes from React Native Paper, but currently lacks proper PaperProvider integration. The proper integration pattern should be:

1. PaperProvider wraps the application at the root level
2. The theme from ThemeContext is passed to PaperProvider
3. Components can access the theme via useAppTheme() hook
4. Themed components use the theme for styling

## Component Architecture

### Theming Component Hierarchy

```
App Root
└── ThemeProvider
    └── PaperProvider (to be integrated)
        └── NavigationContainer
            ├── ThemedScreen
            │   ├── ThemedText
            │   ├── ThemedCard
            │   └── Regular components with theme styles
            └── Other screens
```

### Component Relationships

- **ThemeProvider** provides theme state via context
- **ThemeContext** delivers isDark, theme, and toggleTheme
- **_layout.tsx** serves as the app entry point with navigation setup
- **Themed components** consume theme via useAppTheme() hook
- **Regular components** should consume theme for styling

## Best Practices for Theme Usage

### Using Themed Components

1. **Screen Wrapping**: Wrap all screens with `ThemedScreen` for consistent background and StatusBar:
```jsx
export default function MyScreen() {
  return (
    <ThemedScreen>
      {/* Screen content */}
    </ThemedScreen>
  );
}
```

2. **Text Usage**: Use `ThemedText` with appropriate variants:
```jsx
<ThemedText variant="title">Page Title</ThemedText>
<ThemedText variant="body">Regular text</ThemedText>
<ThemedText variant="caption" color={theme.colors.textSecondary}>Secondary text</ThemedText>
```

3. **Card Usage**: Use `ThemedCard` for card elements:
```jsx
<ThemedCard>
  <ThemedText variant="subtitle">Card Title</ThemedText>
  <ThemedText variant="body">Card content</ThemedText>
</ThemedCard>
```

### Direct Theme Usage

For custom styling, retrieve theme using `useAppTheme()`:
```jsx
import { useAppTheme } from '@/hooks/useAppTheme';

export default function MyComponent() {
  const theme = useAppTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md
    }}>
      {/* Component content */}
    </View>
  );
}
```

### Accessing Dark Mode State

To determine if dark mode is active:
```jsx
import { useTheme } from '@/context/ThemeContext';

export default function MyComponent() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <Button 
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
      onPress={toggleTheme} 
    />
  );
}
```

## Improvement Plan

To improve the theme architecture, the following changes will be implemented:

1. **PaperProvider Integration**:
   - Add PaperProvider to app/_layout.tsx
   - Pass combined theme from ThemeContext to PaperProvider

2. **Theme Hook Enhancement**:
   - Create a typed useAppTheme hook with better TypeScript support
   - Ensure all theme properties are properly typed

3. **Themed Component Extensions**:
   - Add more themed variants of common components (Button, Input, etc.)
   - Enhance existing themed components with more options

4. **Migration Strategy**:
   - Create a standard pattern for converting hardcoded styles
   - Systematically update all screens to use the theme system 