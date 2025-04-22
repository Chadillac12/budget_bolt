import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function BudgetScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Budget' }} />
      <Text style={styles.title}>Budget</Text>
      <Text style={styles.description}>Budget management coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});