import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import ImportWizardTest from '@/components/import-export/ImportWizardTest';

/**
 * A test screen for the import wizard functionality
 * This screen helps isolate and debug the CSV import process
 */
export default function ImportTestScreen() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});