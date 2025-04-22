import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

interface ColumnMappingStepProps {
  data: any[];
  headers: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel?: () => void; // Optional cancel handler
}

const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  data,
  headers,
  onMappingComplete,
  onCancel
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const appFields = ['date', 'amount', 'payee', 'category', 'description'];

  const handleMapField = (header: string, field: string) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handleSubmit = () => {
    onMappingComplete(mapping);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map CSV Columns</Text>
      
      <View style={styles.mappingContainer}>
        <View>
          <Text style={styles.subtitle}>CSV Headers:</Text>
          <FlatList
            data={headers}
            renderItem={({ item }) => (
              <Text style={styles.headerItem}>{item}</Text>
            )}
            keyExtractor={(item) => item}
          />
        </View>

        <View>
          <Text style={styles.subtitle}>App Fields:</Text>
          <FlatList
            data={appFields}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.fieldItem}
                onPress={() => handleMapField(headers[0], item)}
              >
                <Text>{item}</Text>
                {mapping[headers[0]] === item && (
                  <Text style={styles.mappedText}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Confirm Mapping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  mappingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10
  },
  headerItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 5
  },
  fieldItem: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  mappedText: {
    color: 'green',
    fontWeight: 'bold'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ColumnMappingStep;