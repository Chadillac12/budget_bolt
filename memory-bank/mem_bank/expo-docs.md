# Expo Documentation (Summary)

## Creating a New Expo Project
Use `npx create-expo-app@latest` to initialize a new Expo project. This sets up a default project structure for React Native development.

## Example: Checkbox Component
```tsx
import Checkbox from 'expo-checkbox';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [isChecked, setChecked] = useState(false);
  return (
    <View style={styles.container}>
      <Checkbox style={styles.checkbox} value={isChecked} onValueChange={setChecked} />
      <Text>Normal checkbox</Text>
    </View>
  );
}
```

## Example: Accelerometer
```jsx
import { Accelerometer } from 'expo-sensors';
// ...
```

## File Download Example
Use `FileSystem.createDownloadResumable` for downloads with progress tracking.

## Push Notifications
Use `expo-notifications` for registering and handling push notifications.

## More
- Use `npx expo install <package>` for compatible library installation.
- See Expo docs for SafeAreaProvider, screen capture, and more advanced features.
