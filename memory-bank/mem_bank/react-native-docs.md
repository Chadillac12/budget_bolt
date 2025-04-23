# React Native Documentation (Summary)

## Starting the Dev Server
```
npx @react-native-community/cli start [options]
```

## Basic Component
```jsx
import { View, Text } from 'react-native';
export default function App() {
  return <View><Text>Hello</Text></View>;
}
```

## Babel Config
```json
{
  "presets": ["module:@react-native/babel-preset"]
}
```

## ESLint Config
```json
{
  "plugins": ["@react-native"]
}
```

## Feature Flags
```js
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';
```
