import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { PayeeCategory } from '@/types/payee';
import { Check, X } from 'lucide-react-native';

interface PayeeCategoryFormProps {
  category?: PayeeCategory;
  onSave: (category: PayeeCategory) => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing payee categories
 */
export default function PayeeCategoryForm({ 
  category, 
  onSave, 
  onCancel 
}: PayeeCategoryFormProps) {
  const isEditing = !!category;
  
  // Form state
  const [formData, setFormData] = useState<Partial<PayeeCategory>>({
    id: category?.id || `payee_cat_${Date.now()}`,
    name: category?.name || '',
    color: category?.color || getRandomColor(),
  });
  
  // Handle form field changes
  const handleChange = (field: keyof PayeeCategory, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Generate a random color
  function getRandomColor() {
    const colors = [
      '#FF3B30', // Red
      '#FF9500', // Orange
      '#FFCC00', // Yellow
      '#34C759', // Green
      '#5AC8FA', // Light Blue
      '#007AFF', // Blue
      '#5856D6', // Purple
      '#AF52DE', // Pink
      '#FF2D55', // Rose
      '#8E8E93', // Gray
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Predefined colors for selection
  const colorOptions = [
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#5AC8FA', // Light Blue
    '#007AFF', // Blue
    '#5856D6', // Purple
    '#AF52DE', // Pink
    '#FF2D55', // Rose
    '#8E8E93', // Gray
  ];
  
  // Validate the form before saving
  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return false;
    }
    
    if (!formData.color) {
      Alert.alert('Error', 'Please select a color');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(formData as PayeeCategory);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Category' : 'New Category'}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
        >
          <X size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>
      
      {/* Name Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="Enter category name"
          />
        </View>
      </View>
      
      {/* Color Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorContainer}>
          {colorOptions.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                formData.color === color && styles.selectedColorOption
              ]}
              onPress={() => handleChange('color', color)}
            />
          ))}
        </View>
      </View>
      
      {/* Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View 
          style={[
            styles.previewBadge,
            { backgroundColor: formData.color || '#E5E5EA' }
          ]}
        >
          <Text style={styles.previewText}>{formData.name || 'Category'}</Text>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
        >
          <Check size={16} color="white" style={styles.buttonIcon} />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxWidth: 400,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});