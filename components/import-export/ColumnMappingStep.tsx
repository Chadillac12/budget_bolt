import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { detectTransactionFormat } from '@/utils/csvUtils';
import { Ionicons } from '@expo/vector-icons';

interface ColumnMappingStepProps {
  headers: string[];
  data: Record<string, string>[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

// Define app fields and their descriptions
const APP_FIELDS = [
  { key: 'date', label: 'Date', required: true, description: 'Transaction date' },
  { key: 'amount', label: 'Amount', required: true, description: 'Transaction amount' },
  { key: 'payee', label: 'Payee', required: false, description: 'Who you paid or who paid you' },
  { key: 'category', label: 'Category', required: false, description: 'Transaction category' },
  { key: 'type', label: 'Type', required: false, description: 'Transaction type (income/expense)' },
  { key: 'description', label: 'Description', required: false, description: 'Additional notes' }
];

const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  headers,
  data,
  onMappingComplete,
  onCancel
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

  // Initialize with suggested mappings and preview data
  useEffect(() => {
    // Auto-detect possible mapping
    const suggestedMapping = detectTransactionFormat(headers) || {};
    
    // If we have suggested mappings, use them as default
    if (Object.keys(suggestedMapping).length > 0) {
      setMapping(suggestedMapping);
      console.log('[DEBUG] Auto-detected mappings:', suggestedMapping);
    }
    
    // Set preview data (limit to 5 rows for performance)
    setPreviewData(data.slice(0, 5));
  }, [headers, data]);

  // Helper function to check if a field is mapped
  const isFieldMapped = (field: string): boolean => {
    return Object.keys(mapping).includes(field);
  };

  // Helper function to get the mapped header for a field
  const getMappedHeader = (field: string): string => {
    return mapping[field] || '';
  };

  // Handle field mapping
  const handleMapField = (field: string, header: string) => {
    setMapping(prev => {
      // If the header is already mapped to another field, remove that mapping
      const updatedMapping = { ...prev };
      Object.keys(updatedMapping).forEach(key => {
        if (updatedMapping[key] === header) {
          delete updatedMapping[key];
        }
      });
      
      // If header is empty, remove the mapping
      if (!header) {
        delete updatedMapping[field];
        return updatedMapping;
      }
      
      // Add the new mapping
      return {
        ...updatedMapping,
        [field]: header
      };
    });
  };

  // Handle completion
  const handleComplete = () => {
    // Check if required fields are mapped
    const requiredFields = APP_FIELDS.filter(field => field.required).map(field => field.key);
    const missingFields = requiredFields.filter(field => !isFieldMapped(field));
    
    if (missingFields.length > 0) {
      // In a real app, show an alert about missing required fields
      console.warn(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    onMappingComplete(mapping);
  };

  // Render field mapping picker
  const renderFieldMapping = (field: { key: string, label: string, required: boolean, description: string }) => {
    return (
      <View style={styles.fieldMappingContainer} key={field.key}>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          {field.required && <Text style={styles.requiredBadge}>Required</Text>}
          <Text style={styles.fieldDescription}>{field.description}</Text>
        </View>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={getMappedHeader(field.key)}
            onValueChange={(value) => handleMapField(field.key, value)}
            style={styles.picker}
            mode="dropdown"
          >
            <Picker.Item label="Not mapped" value="" />
            {headers.map(header => (
              <Picker.Item key={header} label={header} value={header} />
            ))}
          </Picker>
          
          {isFieldMapped(field.key) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleMapField(field.key, '')}
            >
              <Ionicons name="close-circle" size={20} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render preview table
  const renderPreviewTable = () => {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Data Preview</Text>
        
        <ScrollView horizontal style={styles.tableContainer}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              {headers.map(header => (
                <View key={header} style={styles.headerCell}>
                  <Text style={styles.headerText} numberOfLines={2}>
                    {header}
                    {Object.entries(mapping).find(([_, val]) => val === header) && (
                      <Text style={styles.mappedBadge}> (Mapped)</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Table Body */}
            <ScrollView style={styles.tableBody}>
              {previewData.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.tableRow}>
                  {headers.map(header => (
                    <View key={`cell-${rowIndex}-${header}`} style={styles.tableCell}>
                      <Text style={styles.cellText} numberOfLines={2}>
                        {row[header] || ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Get status counts for feedback
  const requiredFieldCount = APP_FIELDS.filter(field => field.required).length;
  const mappedRequiredFieldCount = APP_FIELDS.filter(field => field.required && isFieldMapped(field.key)).length;
  const optionalFieldCount = APP_FIELDS.filter(field => !field.required).length;
  const mappedOptionalFieldCount = APP_FIELDS.filter(field => !field.required && isFieldMapped(field.key)).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Map CSV Columns</Text>
      <Text style={styles.stepDescription}>
        Match each column from your CSV file to the appropriate field in Budget Bolt
      </Text>
      
      {/* Mapping Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>Required Fields</Text>
          <Text style={styles.progressValue}>
            {mappedRequiredFieldCount}/{requiredFieldCount} mapped
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(mappedRequiredFieldCount / requiredFieldCount) * 100}%`,
                  backgroundColor: mappedRequiredFieldCount === requiredFieldCount ? '#4CAF50' : '#FFC107'
                }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>Optional Fields</Text>
          <Text style={styles.progressValue}>
            {mappedOptionalFieldCount}/{optionalFieldCount} mapped
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(mappedOptionalFieldCount / optionalFieldCount) * 100}%`,
                  backgroundColor: '#2196F3'
                }
              ]}
            />
          </View>
        </View>
      </View>
      
      {/* Field Mappings */}
      <View style={styles.mappingsContainer}>
        {APP_FIELDS.map(renderFieldMapping)}
      </View>
      
      {/* Preview Table */}
      {renderPreviewTable()}
      
      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            mappedRequiredFieldCount < requiredFieldCount && styles.disabledButton
          ]}
          onPress={handleComplete}
          disabled={mappedRequiredFieldCount < requiredFieldCount}
        >
          <Text style={[
            styles.continueButtonText,
            mappedRequiredFieldCount < requiredFieldCount && styles.disabledButtonText
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  stepDescription: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBox: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  mappingsContainer: {
    marginBottom: 24,
  },
  fieldMappingContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  fieldInfo: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 4,
  },
  fieldDescription: {
    fontSize: 14,
    color: '#757575',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  picker: {
    flex: 1,
    height: 48,
  },
  clearButton: {
    padding: 8,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  tableContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    width: 150,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  mappedBadge: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#4CAF50',
  },
  tableBody: {
    maxHeight: 250,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableCell: {
    width: 150,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  cellText: {
    fontSize: 14,
    color: '#212121',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  }
});

export default ColumnMappingStep;