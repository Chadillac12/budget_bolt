import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { Payee, PayeeContact } from '@/types/payee';
import { Check, Plus, Trash2, X } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface PayeeFormProps {
  payee?: Payee;
  onSave: (payee: Payee) => void;
  onCancel: () => void;
}

/**
 * Form for creating or editing payees
 */
export default function PayeeForm({
  payee,
  onSave,
  onCancel
}: PayeeFormProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state } = useAppContext();
  const isEditing = !!payee;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Payee>>({
    id: payee?.id || `payee_${Date.now()}`,
    name: payee?.name || '',
    alias: payee?.alias || [],
    notes: payee?.notes || '',
    contacts: payee?.contacts || [],
    categoryIds: payee?.categoryIds || [],
    isActive: payee?.isActive !== undefined ? payee.isActive : true,
    createdAt: payee?.createdAt || new Date(),
    updatedAt: new Date(),
  });
  
  // UI state
  const [newAlias, setNewAlias] = useState('');
  const [newContactType, setNewContactType] = useState<PayeeContact['type']>('email');
  const [newContactValue, setNewContactValue] = useState('');
  const [newContactLabel, setNewContactLabel] = useState('');
  
  // Handle form field changes
  const handleChange = (field: keyof Payee, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add a new alias
  const handleAddAlias = () => {
    if (!newAlias.trim()) return;
    
    const aliases = formData.alias || [];
    if (aliases.includes(newAlias.trim())) {
      Alert.alert('Duplicate Alias', 'This alias already exists.');
      return;
    }
    
    handleChange('alias', [...aliases, newAlias.trim()]);
    setNewAlias('');
  };
  
  // Remove an alias
  const handleRemoveAlias = (index: number) => {
    const aliases = [...(formData.alias || [])];
    aliases.splice(index, 1);
    handleChange('alias', aliases);
  };
  
  // Add a new contact
  const handleAddContact = () => {
    if (!newContactValue.trim()) return;
    
    const contacts = formData.contacts || [];
    const newContact: PayeeContact = {
      type: newContactType,
      value: newContactValue.trim(),
      label: newContactLabel.trim() || undefined,
      isPrimary: contacts.length === 0 // First contact is primary by default
    };
    
    handleChange('contacts', [...contacts, newContact]);
    setNewContactValue('');
    setNewContactLabel('');
  };
  
  // Remove a contact
  const handleRemoveContact = (index: number) => {
    const contacts = [...(formData.contacts || [])];
    contacts.splice(index, 1);
    handleChange('contacts', contacts);
  };
  
  // Set a contact as primary
  const handleSetPrimaryContact = (index: number) => {
    const contacts = [...(formData.contacts || [])];
    contacts.forEach((contact, i) => {
      contact.isPrimary = i === index;
    });
    handleChange('contacts', contacts);
  };
  
  // Toggle category selection
  const handleToggleCategory = (categoryId: string) => {
    const categoryIds = formData.categoryIds || [];
    if (categoryIds.includes(categoryId)) {
      handleChange('categoryIds', categoryIds.filter(id => id !== categoryId));
    } else {
      handleChange('categoryIds', [...categoryIds, categoryId]);
    }
  };
  
  // Validate the form before saving
  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Please enter a payee name');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(formData as Payee);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Payee' : 'New Payee'}
        </Text>
      </View>
      
      {/* Name Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="Enter payee name"
          />
        </View>
      </View>
      
      {/* Aliases */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Aliases</Text>
        <View style={styles.aliasContainer}>
          {formData.alias?.map((alias, index) => (
            <View key={index} style={styles.aliasItem}>
              <Text style={styles.aliasText}>{alias}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveAlias(index)}
                style={styles.removeButton}
              >
                <X size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addAliasContainer}>
            <TextInput
              style={styles.aliasInput}
              value={newAlias}
              onChangeText={setNewAlias}
              placeholder="Add alias"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddAlias}
            >
              <Plus size={16} color={theme.colors.card} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Contacts */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Contacts</Text>
        <View style={styles.contactsContainer}>
          {formData.contacts?.map((contact, index) => (
            <View key={index} style={styles.contactItem}>
              <View style={styles.contactHeader}>
                <View style={styles.contactTypeContainer}>
                  <Text style={styles.contactType}>{contact.type}</Text>
                  {contact.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryText}>Primary</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveContact(index)}
                  style={styles.removeButton}
                >
                  <Trash2 size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.contactValue}>{contact.value}</Text>
              {contact.label && <Text style={styles.contactLabel}>{contact.label}</Text>}
              
              {!contact.isPrimary && (
                <TouchableOpacity
                  style={styles.setPrimaryButton}
                  onPress={() => handleSetPrimaryContact(index)}
                >
                  <Text style={styles.setPrimaryText}>Set as Primary</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <View style={styles.addContactContainer}>
            <View style={styles.contactTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.contactTypeButton,
                  newContactType === 'email' && styles.activeContactTypeButton
                ]}
                onPress={() => setNewContactType('email')}
              >
                <Text style={styles.contactTypeButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.contactTypeButton,
                  newContactType === 'phone' && styles.activeContactTypeButton
                ]}
                onPress={() => setNewContactType('phone')}
              >
                <Text style={styles.contactTypeButtonText}>Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.contactTypeButton,
                  newContactType === 'address' && styles.activeContactTypeButton
                ]}
                onPress={() => setNewContactType('address')}
              >
                <Text style={styles.contactTypeButtonText}>Address</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.contactTypeButton,
                  newContactType === 'website' && styles.activeContactTypeButton
                ]}
                onPress={() => setNewContactType('website')}
              >
                <Text style={styles.contactTypeButtonText}>Website</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.contactTypeButton,
                  newContactType === 'other' && styles.activeContactTypeButton
                ]}
                onPress={() => setNewContactType('other')}
              >
                <Text style={styles.contactTypeButtonText}>Other</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.contactInput}
              value={newContactValue}
              onChangeText={setNewContactValue}
              placeholder={`Enter ${newContactType}`}
            />
            
            <TextInput
              style={styles.contactInput}
              value={newContactLabel}
              onChangeText={setNewContactLabel}
              placeholder="Label (optional)"
            />
            
            <TouchableOpacity
              style={styles.addContactButton}
              onPress={handleAddContact}
            >
              <Text style={styles.addContactButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Categories */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {state.payeeCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                formData.categoryIds?.includes(category.id) && styles.selectedCategoryItem,
                { borderColor: category.color || theme.colors.border }
              ]}
              onPress={() => handleToggleCategory(category.id)}
            >
              <View 
                style={[
                  styles.categoryIndicator, 
                  { backgroundColor: category.color || theme.colors.border }
                ]}
              />
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
          
          {state.payeeCategories.length === 0 && (
            <Text style={styles.noCategoriesText}>No categories available</Text>
          )}
        </View>
      </View>
      
      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => handleChange('notes', text)}
            placeholder="Add notes about this payee"
            multiline
          />
        </View>
      </View>
      
      {/* Active Toggle */}
      <View style={styles.formGroup}>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Active</Text>
          <Switch
            value={formData.isActive}
            onValueChange={(value) => handleChange('isActive', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.success }}
          />
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
          <Check size={16} color={theme.colors.card} style={styles.buttonIcon} />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  formGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  aliasContainer: {
    marginTop: 8,
  },
  aliasItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  aliasText: {
    flex: 1,
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  addAliasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  aliasInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 8,
  },
  contactsContainer: {
    marginTop: 8,
  },
  contactItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  primaryBadge: {
    backgroundColor: theme.colors.success,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  primaryText: {
    color: theme.colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 16,
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  setPrimaryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  setPrimaryText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addContactContainer: {
    marginTop: 8,
  },
  contactTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  contactTypeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  activeContactTypeButton: {
    backgroundColor: theme.colors.primary,
  },
  contactTypeButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  contactInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 16,
  },
  addContactButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addContactButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryItem: {
    backgroundColor: theme.colors.surface,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
  },
  noCategoriesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});