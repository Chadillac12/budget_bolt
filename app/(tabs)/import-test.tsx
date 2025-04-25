import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import ImportWizardTest from '@/components/import-export/ImportWizardTest';

/**
 * A test screen for the import wizard functionality
 * This screen helps isolate and debug the CSV import process
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
 */
export default function ImportTestScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Import Test (Debug)',
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerTintColor: '#0366d6',
      }} />
      <ImportWizardTest />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
});