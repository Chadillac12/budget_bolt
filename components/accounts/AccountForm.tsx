
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Switch } from 'react-native';
import { Account, AccountType, AccountClassification } from '@/types/account';
import { useAppContext } from '@/context/AppContext';
import { X, Check, DollarSign, CreditCard, Briefcase, Wallet } from 'lucide-react-native';

interface AccountFormProps {
  isVisible: boolean;
  onClose: () => void;
  initialAccount?: Account;
}

export default function AccountForm({
  isVisible,
  onClose,
  initialAccount
}: AccountFormProps) {
  console.log('AccountForm rendered with isVisible:', isVisible);
  console.log('initialAccount:', initialAccount);
  
  const { dispatch } = useAppContext();
  const isEditing = !!initialAccount;
  
  // Default account values
  const defaultAccount: Partial<Account> = {
    name: '',
    type: 'checking',
    balance: 0,
    currency: 'USD',
    color: '#007AFF',
    classification: 'asset',
    isHidden: false,
    isArchived: false,
    excludeFromNetWorth: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Form state
  const [formValues, setFormValues] = useState<Partial<Account>>(
    initialAccount || defaultAccount
  );
  
  // Handle text input changes
  const handleChange = (field: keyof Account, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Handle save
  const handleSave = () => {
    console.log('handleSave called with formValues:', formValues);
    
    if (!formValues.name) {
      // Show error for required fields
      console.log('Validation error: Account name is required');
      alert('Account name is required');
      return;
    }
    
    const now = new Date();
    
    if (isEditing && initialAccount) {
      // Update existing account
      console.log('Updating existing account:', initialAccount.id);
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          ...initialAccount,
          ...formValues,
          updatedAt: now,
        } as Account,
      });
    } else {
      // Create new account
      const newAccount: Account = {
        ...defaultAccount,
        ...formValues,
        id: `account-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      } as Account;
      
      console.log('Creating new account:', newAccount);
      dispatch({
        type: 'ADD_ACCOUNT',
        payload: newAccount,
      });
    }
    
    console.log('Closing form after save');
    onClose();
  };
  
  // Get default classification based on account type
  const getDefaultClassification = (type: AccountType): AccountClassification => {
    switch (type) {
      case 'checking':
      case 'savings':
      case 'investment':
      case 'cash':
        return 'asset';
      case 'credit':
      case 'loan':
        return 'liability';
      default:
        return 'asset';
    }
  };
  
  // Handle account type change and update classification
  const handleTypeChange = (type: AccountType) => {
    setFormValues(prev => ({
      ...prev,
      type,
      classification: getDefaultClassification(type),
    }));
  };
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Account' : 'New Account'}
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Check size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            {/* Account Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={formValues.name}
                onChangeText={(value) => handleChange('name', value)}
                placeholder="Enter account name"
                placeholderTextColor="#C7C7CC"
              />
            </View>
            
            {/* Account Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.pickerContainer}>
                <View style={styles.typeOptions}>
                  {[
                    { label: 'Checking', value: 'checking' },
                    { label: 'Savings', value: 'savings' },
                    { label: 'Credit', value: 'credit' },
                    { label: 'Investment', value: 'investment' },
                    { label: 'Loan', value: 'loan' },
                    { label: 'Cash', value: 'cash' },
                    { label: 'Other', value: 'other' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.typeOption,
                        formValues.type === option.value && styles.selectedTypeOption
                      ]}
                      onPress={() => handleTypeChange(option.value as AccountType)}
                    >
                      <Text style={[
                        styles.typeText,
                        formValues.type === option.value && styles.selectedTypeText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            {/* Starting Balance */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Starting Balance</Text>
              <TextInput
                style={styles.input}
                value={formValues.balance?.toString()}
                onChangeText={(value) => handleChange('balance', parseFloat(value) || 0)}
                placeholder="0.00"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
            
            {/* Currency */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Currency</Text>
              <View style={styles.pickerContainer}>
                <View style={styles.currencyOptions}>
                  {[
                    { label: 'USD ($)', value: 'USD' },
                    { label: 'EUR (€)', value: 'EUR' },
                    { label: 'GBP (£)', value: 'GBP' },
                    { label: 'CAD ($)', value: 'CAD' },
                    { label: 'AUD ($)', value: 'AUD' },
                    { label: 'JPY (¥)', value: 'JPY' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.currencyOption,
                        formValues.currency === option.value && styles.selectedCurrencyOption
                      ]}
                      onPress={() => handleChange('currency', option.value)}
                    >
                      <Text style={[
                        styles.currencyText,
                        formValues.currency === option.value && styles.selectedCurrencyText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            {/* Color */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorOptions}>
                {['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#FF2D55'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formValues.color === color && styles.selectedColorOption
                    ]}
                    onPress={() => handleChange('color', color)}
                  />
                ))}
              </View>
            </View>
            
            {/* Classification */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Classification</Text>
              <View style={styles.classificationOptions}>
                <TouchableOpacity
                  style={[
                    styles.classificationOption,
                    formValues.classification === 'asset' && styles.selectedClassificationOption
                  ]}
                  onPress={() => handleChange('classification', 'asset')}
                >
                  <Text style={[
                    styles.classificationText,
                    formValues.classification === 'asset' && styles.selectedClassificationText
                  ]}>
                    Asset
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.classificationOption,
                    formValues.classification === 'liability' && styles.selectedClassificationOption
                  ]}
                  onPress={() => handleChange('classification', 'liability')}
                >
                  <Text style={[
                    styles.classificationText,
                    formValues.classification === 'liability' && styles.selectedClassificationText
                  ]}>
                    Liability
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Visibility Options */}
            <View style={styles.formGroup}>
              <Text style={styles.sectionTitle}>Visibility Options</Text>
              
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Hide Balance</Text>
                  <Text style={styles.switchDescription}>
                    Hide the balance of this account in the accounts list
                  </Text>
                </View>
                <Switch
                  value={formValues.isHidden}
                  onValueChange={(value) => handleChange('isHidden', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Exclude from Net Worth</Text>
                  <Text style={styles.switchDescription}>
                    This account will not be included in net worth calculations
                  </Text>
                </View>
                <Switch
                  value={formValues.excludeFromNetWorth}
                  onValueChange={(value) => handleChange('excludeFromNetWorth', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              {isEditing && (
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchLabel}>Archive Account</Text>
                    <Text style={styles.switchDescription}>
                      Archive this account to hide it from the main accounts list
                    </Text>
                  </View>
                  <Switch
                    value={formValues.isArchived}
                    onValueChange={(value) => handleChange('isArchived', value)}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 10,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedTypeOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  selectedTypeText: {
    color: '#FFF',
  },
  currencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  currencyOption: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCurrencyOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  selectedCurrencyText: {
    color: '#FFF',
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#000',
  },
  classificationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classificationOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedClassificationOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  classificationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  selectedClassificationText: {
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  switchDescription: {
    fontSize: 14,
    color: '#8E8E93',
    maxWidth: '80%',
  },
});