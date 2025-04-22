import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, Modal } from 'react-native';
import { Account, AccountClassification } from '@/types/account';
import { useAppContext } from '@/context/AppContext';
import { TrendingUp, TrendingDown, X, Check } from 'lucide-react-native';

interface AccountClassificationFormProps {
  account: Account;
  isVisible: boolean;
  onClose: () => void;
}

export default function AccountClassificationForm({ 
  account, 
  isVisible, 
  onClose 
}: AccountClassificationFormProps) {
  const { dispatch } = useAppContext();
  
  // Local state for form
  const [classification, setClassification] = useState<AccountClassification>(
    account.classification
  );
  const [excludeFromNetWorth, setExcludeFromNetWorth] = useState(
    account.excludeFromNetWorth
  );
  
  // Handle save
  const handleSave = () => {
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: {
        ...account,
        classification,
        excludeFromNetWorth,
        updatedAt: new Date()
      }
    });
    
    onClose();
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
            <Text style={styles.modalTitle}>Account Classification</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Check size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {/* Account Info */}
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountType}>
              {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
            </Text>
          </View>
          
          {/* Classification Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classification</Text>
            <Text style={styles.sectionDescription}>
              Choose how this account affects your net worth calculation
            </Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.classificationOption,
                  styles.assetOption,
                  classification === 'asset' && styles.selectedAssetOption
                ]}
                onPress={() => setClassification('asset')}
              >
                <View style={styles.optionIconContainer}>
                  <TrendingUp 
                    size={24} 
                    color={classification === 'asset' ? 'white' : '#34C759'} 
                  />
                </View>
                <Text style={[
                  styles.optionTitle,
                  classification === 'asset' && styles.selectedOptionText
                ]}>
                  Asset
                </Text>
                <Text style={[
                  styles.optionDescription,
                  classification === 'asset' && styles.selectedOptionText
                ]}>
                  Adds to net worth
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.classificationOption,
                  styles.liabilityOption,
                  classification === 'liability' && styles.selectedLiabilityOption
                ]}
                onPress={() => setClassification('liability')}
              >
                <View style={styles.optionIconContainer}>
                  <TrendingDown 
                    size={24} 
                    color={classification === 'liability' ? 'white' : '#FF3B30'} 
                  />
                </View>
                <Text style={[
                  styles.optionTitle,
                  classification === 'liability' && styles.selectedOptionText
                ]}>
                  Liability
                </Text>
                <Text style={[
                  styles.optionDescription,
                  classification === 'liability' && styles.selectedOptionText
                ]}>
                  Subtracts from net worth
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Exclude from Net Worth */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Exclude from Net Worth</Text>
                <Text style={styles.switchDescription}>
                  This account will not be included in net worth calculations
                </Text>
              </View>
              <Switch
                value={excludeFromNetWorth}
                onValueChange={setExcludeFromNetWorth}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          
          {/* Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              Assets increase your net worth, while liabilities decrease it. Examples of assets include checking accounts, savings accounts, and investments. Examples of liabilities include credit cards, loans, and mortgages.
            </Text>
          </View>
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
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
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
  accountInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  accountName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classificationOption: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  assetOption: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  liabilityOption: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  selectedAssetOption: {
    backgroundColor: '#34C759',
  },
  selectedLiabilityOption: {
    backgroundColor: '#FF3B30',
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#8E8E93',
    maxWidth: '80%',
  },
  infoSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});