import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

interface FileSelectStepProps {
  onFileSelect: (result: DocumentPicker.DocumentPickerAsset) => void;
}

const FileSelectStep: React.FC<FileSelectStepProps> = ({ onFileSelect }) => {
  const handlePress = async () => {
    try {
      console.log('[DEBUG] Import: Opening document picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/x-ofx', 'application/ofx', 'application/x-qfx', 'application/qfx'],
        copyToCacheDirectory: true
      });
      
      console.log('[DEBUG] Import: Document picker result:', result);
      
      if (result.canceled) {
        console.log('[DEBUG] Import: File selection cancelled');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('[DEBUG] Import: File selected successfully:', selectedFile.name);
        onFileSelect(selectedFile);
      } else {
        console.log('[DEBUG] Import: No file selected or empty result');
      }
    } catch (error) {
      console.error('[DEBUG] Import: Error in document picker:', error);
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