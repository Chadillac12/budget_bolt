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

  // Find which app field each header is mapped to
  const getFieldForHeader = (header: string) => {
    return mapping[header] || '';
  };

  // Check if a header is already mapped
  const isHeaderMapped = (header: string) => {
    return !!mapping[header];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map CSV Columns</Text>
      <Text style={styles.instructions}>
        Please map each CSV column to the corresponding field in the application
      </Text>
      
      <FlatList
        data={headers}
        renderItem={({ item: header }) => (
          <View style={styles.mappingRow}>
            <View style={styles.headerContainer}>
              <Text style={styles.headerItem}>{header}</Text>
            </View>
            <View style={styles.fieldSelectorContainer}>
              <Text style={styles.arrowText}>→</Text>
              <View style={styles.fieldSelector}>
                <FlatList
                  horizontal
                  data={appFields}
                  renderItem={({ item: field }) => (
                    <TouchableOpacity
                      style={[
                        styles.fieldItem,
                        getFieldForHeader(header) === field && styles.selectedField
                      ]}
                      onPress={() => handleMapField(header, field)}
                    >
                      <Text style={getFieldForHeader(header) === field ? styles.selectedFieldText : styles.fieldText}>
                        {field}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
        )}
        keyExtractor={(item) => item}
        style={styles.mappingList}
      />

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
    marginBottom: 8
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20
  },
  mappingList: {
    flex: 1,
  },
  mappingRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContainer: {
    flex: 0.4,
  },
  headerItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  fieldSelectorContainer: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    marginHorizontal: 10,
    color: '#888',
  },
  fieldSelector: {
    flex: 1,
  },
  fieldItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
  },
  selectedField: {
    backgroundColor: '#007AFF',
  },
  fieldText: {
    fontSize: 13,
    color: '#444',
  },
  selectedFieldText: {
    color: 'white',
    fontWeight: '500',
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