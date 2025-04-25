# Themed Components

This directory contains themed components that should be used throughout the app to ensure consistent styling and proper theming support. These components automatically adapt to the current theme (light or dark) and provide a consistent user experience.

## Available Components

### ThemedScreen

Wrapper for screen components that applies background color and handles safe area insets.

```tsx
import { ThemedScreen } from '@/components/themed';

export default function MyScreen() {
  return (
    <ThemedScreen>
      {/* Your screen content */}
    </ThemedScreen>
  );
}
```

Props:
- `padding`: (boolean) - Add standard padding to the screen
- `safeArea`: (boolean) - Apply safe area insets
- `statusBarStyle`: ('auto' | 'inverted' | 'light' | 'dark') - Control StatusBar style

### ThemedContainer

A themed container for layout sections with appropriate background colors.

```tsx
import { ThemedContainer } from '@/components/themed';

export default function MyComponent() {
  return (
    <ThemedContainer variant="surface" padding rounded>
      {/* Container content */}
    </ThemedContainer>
  );
}
```

Props:
- `variant`: ('primary' | 'secondary' | 'surface' | 'transparent')
- `padding`: (boolean) - Apply theme-consistent padding
- `margin`: (boolean) - Apply theme-consistent margin
- `rounded`: (boolean) - Apply theme-consistent border radius

### ThemedCard

A themed card component for content sections with elevation.

```tsx
import { ThemedCard } from '@/components/themed';

export default function MyComponent() {
  return (
    <ThemedCard elevation={2} onPress={() => console.log('Card pressed')}>
      {/* Card content */}
    </ThemedCard>
  );
}
```

Props:
- `elevation`: (0-5) - Material elevation level
- `onPress`: (function) - Makes the card pressable
- `borderLeftColor`: (string) - Optional color for left border accent

### ThemedText

A themed text component with typography variants.

```tsx
import { ThemedText } from '@/components/themed';

export default function MyComponent() {
  return (
    <>
      <ThemedText variant="title">Title Text</ThemedText>
      <ThemedText variant="subtitle">Subtitle Text</ThemedText>
      <ThemedText variant="body">Body Text</ThemedText>
      <ThemedText variant="caption">Caption Text</ThemedText>
      <ThemedText variant="error">Error Text</ThemedText>
    </>
  );
}
```

Props:
- `variant`: ('title' | 'subtitle' | 'body' | 'caption' | 'label' | 'error')
- `color`: (string) - Optional custom text color

### ThemedButton

A themed button component with consistent styling.

```tsx
import { ThemedButton } from '@/components/themed';

export default function MyComponent() {
  return (
    <>
      <ThemedButton mode="contained" onPress={() => console.log('Pressed')}>
        Primary Button
      </ThemedButton>
      
      <ThemedButton 
        mode="outlined" 
        variant="secondary" 
        onPress={() => console.log('Pressed')}
      >
        Secondary Button
      </ThemedButton>
    </>
  );
}
```

Props:
- `mode`: ('contained' | 'outlined' | 'text')
- `variant`: ('primary' | 'secondary' | 'success' | 'error' | 'warning')

### ThemedInput

A themed text input component with consistent styling.

```tsx
import { ThemedInput } from '@/components/themed';

export default function MyComponent() {
  const [text, setText] = useState('');
  
  return (
    <ThemedInput
      label="Email"
      value={text}
      onChangeText={setText}
      mode="outlined"
      error={!text.includes('@')}
      errorMessage="Please enter a valid email"
    />
  );
}
```

Props:
- `mode`: ('outlined' | 'flat')
- `error`: (boolean)
- `errorMessage`: (string)

## Using the Theme Directly

If you need access to theme values directly, use the `useAppTheme` hook:

```tsx
import { useAppTheme } from '@/hooks/useAppTheme';

export default function MyComponent() {
  const theme = useAppTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.sm
    }}>
      {/* Content */}
    </View>
  );
}
```

## Theme Properties

The theme object provides:

- `colors`: Color palette
- `spacing`: Standard spacing values (xs, sm, md, lg, xl, xxl)
- `borderRadius`: Standard border radius values (sm, md, lg, xl, round)
- `typography`: Font styles
- `shadows`: Shadow styles (sm, md, lg) 