import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

interface FileSelectStepProps {
  onFileSelect: (result: DocumentPicker.DocumentResult) => void;
}

const FileSelectStep: React.FC<FileSelectStepProps> = ({ onFileSelect }) => {
  const handlePress = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'application/x-ofx', 'application/ofx', 'application/x-qfx', 'application/qfx'],
      copyToCacheDirectory: true
    });
    if (result.type === 'success') {
      onFileSelect(result);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select CSV File</Text>
      <Text style={styles.subtitle}>
        Choose a CSV, OFX, or QFX file containing your transaction data
      </Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>Browse Files</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default FileSelectStep;