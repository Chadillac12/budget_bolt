import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import ImportWizard from '@/components/import-export/ImportWizard';

export default function ImportScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Import Transactions' }} />
      <ImportWizard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});