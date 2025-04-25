# Technical Context

This file documents the technologies, setup instructions, and technical constraints for the Budget Bolt app.
2025-04-24 09:35:12 - Log of updates made.

## Tech Stack Overview

- **Framework**: React Native with Expo SDK 49+
- **Language**: TypeScript (strict mode)
- **State Management**: Context API with reducers
- **Navigation**: Expo Router v2
- **UI/Theming**: React Native Paper (Material Design 3)
- **Data Persistence**: AsyncStorage
- **Styling**: StyleSheet API with theme integration

## Theming System

The app uses a custom theming system built on React Native Paper's Material Design 3 implementation:

### Core Libraries

- **React Native Paper**: Material Design component library
  - Version: 5.x
  - Used for: UI components, theming infrastructure, icons
  - Integration: Currently partial, needs full PaperProvider implementation

- **AsyncStorage**: Local data persistence
  - Used for: Storing theme preferences
  - Pattern: Save/load theme mode (dark/light)

### Theme Files & Structure

- **context/ThemeContext.tsx**: Theme context provider
  ```typescript
  export interface ThemeContextProps {
    isDark: boolean;
    toggleTheme: () => void;
    theme: ReactNativePaper.Theme;
  }
  ```

- **context/theme.ts**: Theme definitions
  ```typescript
  import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
  
  export const lightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#007AFF',
      // other customizations
    }
  };
  
  export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#0A84FF',
      // other customizations
    }
  };
  ```

- **hooks/useAppTheme.ts**: Custom typed theme hook
  ```typescript
  import { useTheme } from '@/context/ThemeContext';
  
  export function useAppTheme() {
    const { theme } = useTheme();
    return theme;
  }
  ```

### Themed Components

- **ThemedScreen**: Screen wrapper component
- **ThemedText**: Text component with variants
- **ThemedCard**: Card component with theme support

## Development Environment

- **Node.js**: v16.x or higher
- **npm/yarn**: Latest stable version
- **Expo CLI**: Latest version

## Dependencies

### Primary Dependencies

- expo ~49.0.0
- expo-router ~2.0.0
- react 18.2.0
- react-native 0.72.3
- react-native-paper ^5.10.4
- react-native-safe-area-context 4.6.3
- react-native-screens 3.22.0
- typescript ^5.1.3

### UI & Theming Dependencies

- **react-native-paper**: ^5.10.4
  - Material Design component library
  - Provides MD3 theme objects

- **@expo/vector-icons**: ^13.0.0
  - Icon library for Expo apps

- **lucide-react-native**: ^0.279.0
  - Additional icon library used throughout the app

- **react-native-safe-area-context**: 4.6.3
  - Handles safe area insets for different devices

## Future Theming Improvements

1. **Integration with PaperProvider**:
   ```typescript
   // In app/_layout.tsx
   import { PaperProvider } from 'react-native-paper';
   import { ThemeProvider, useTheme } from '@/context/ThemeContext';
   
   function Layout() {
     const { theme } = useTheme();
     
     return (
       <PaperProvider theme={theme}>
         <RootLayoutNav />
       </PaperProvider>
     );
   }
   
   export default function RootLayout() {
     return (
       <ThemeProvider>
         <Layout />
       </ThemeProvider>
     );
   }
   ```

2. **Enhanced Typed Theme**:
   ```typescript
   // Enhanced useAppTheme hook
   import { useTheme } from '@/context/ThemeContext';
   import { Theme } from 'react-native-paper/lib/typescript/types';
   
   export interface AppTheme extends Theme {
     // Additional custom theme properties
     spacing: {
       xs: number;
       sm: number;
       md: number;
       lg: number;
       xl: number;
     };
     // Other extensions
   }
   
   export function useAppTheme(): AppTheme {
     const { theme } = useTheme();
     return theme as AppTheme;
   }
   ```

## Project Structure

The app follows a feature-focused directory structure:

- **app/**: Main application screens and navigation (Expo Router)
  - **(tabs)/**: Main tab screens
  - **modal/**: Modal screens
  - **_layout.tsx**: Root layout with navigation setup

- **components/**: Reusable UI components
  - **themed/**: Theme-aware components
  - Other feature-specific components

- **context/**: Context providers
  - **AppContext.tsx**: Main app state
  - **ThemeContext.tsx**: Theme management

- **hooks/**: Custom React hooks
  - **useAppTheme.ts**: Theme access hook

- **types/**: TypeScript type definitions

- **utils/**: Utility functions

## Constraints & Best Practices

- **Theme Access**: Always access theme via useAppTheme() or useTheme() hooks
- **Component Styling**: Use theme colors and spacing instead of hardcoded values
- **Custom Components**: Extend existing themed components when possible
- **Testing**: Ensure components render correctly in both light and dark themes
- **Accessibility**: Maintain proper contrast ratios in both themes 