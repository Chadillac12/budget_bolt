import React from 'react';
import { View, StyleSheet } from 'react-native';
import CSVParserTest from '@/components/import-export/CSVParserTest';

export default function CSVTestScreen() {
  return (
    <View style={styles.container}>
      <CSVParserTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 