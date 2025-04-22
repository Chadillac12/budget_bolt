import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  SyncConflict,
  ConflictResolutionStrategy,
  SyncableDataType,
  SyncableDataMap,
  SyncableData
} from '../../types/sync';

interface ConflictResolutionModalProps {
  visible: boolean;
  conflicts: SyncConflict<any>[];
  onResolve: (
    conflict: SyncConflict<any>,
    strategy: ConflictResolutionStrategy,
    customMergedData?: SyncableData<any>
  ) => void;
  onClose: () => void;
}

/**
 * Modal for resolving sync conflicts between local and remote data
 */
export default function ConflictResolutionModal({
  visible,
  conflicts,
  onResolve,
  onClose
}: ConflictResolutionModalProps) {
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict<any> | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy>(
    ConflictResolutionStrategy.MERGE
  );

  // Get a human-readable name for a data type
  const getDataTypeName = (dataType: SyncableDataType): string => {
    switch (dataType) {
      case 'transaction':
        return 'Transaction';
      case 'budget':
        return 'Budget';
      case 'account':
        return 'Account';
      case 'payee':
        return 'Payee';
      case 'rule':
        return 'Rule';
      case 'reconciliation':
        return 'Reconciliation';
      default:
        return 'Unknown';
    }
  };

  // Get a summary of the conflict
  const getConflictSummary = (conflict: SyncConflict<any>): string => {
    const typeName = getDataTypeName(conflict.dataType);
    
    // For deleted items
    if (conflict.localData.deleted !== conflict.remoteData.deleted) {
      return conflict.localData.deleted
        ? `${typeName} was deleted locally but modified remotely`
        : `${typeName} was modified locally but deleted remotely`;
    }
    
    // For modified items
    return `${typeName} was modified both locally and remotely`;
  };

  // Get a description of the conflict fields
  const getConflictFieldsDescription = (conflict: SyncConflict<any>): string => {
    if (conflict.conflictFields.includes('deleted')) {
      return 'Deletion status';
    }
    
    if (conflict.conflictFields.includes('data')) {
      // In a real app, you would provide more specific field information
      return 'Multiple fields have conflicting changes';
    }
    
    return conflict.conflictFields.join(', ');
  };

  // Format a date for display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle resolving the conflict
  const handleResolve = () => {
    if (!selectedConflict) return;
    
    onResolve(selectedConflict, selectedStrategy);
    setSelectedConflict(null);
    setSelectedStrategy(ConflictResolutionStrategy.MERGE);
  };

  // Render a conflict item in the list
  const renderConflictItem = ({ item }: { item: SyncConflict<any> }) => {
    const isSelected = selectedConflict === item;
    
    return (
      <TouchableOpacity
        style={[styles.conflictItem, isSelected && styles.selectedConflictItem]}
        onPress={() => setSelectedConflict(item)}
      >
        <View style={styles.conflictHeader}>
          <Ionicons
            name="alert-circle"
            size={24}
            color="#FF9800"
            style={styles.conflictIcon}
          />
          <View style={styles.conflictInfo}>
            <Text style={styles.conflictType}>{getDataTypeName(item.dataType)}</Text>
            <Text style={styles.conflictSummary}>{getConflictSummary(item)}</Text>
          </View>
        </View>
        
        <View style={styles.conflictDetails}>
          <Text style={styles.conflictDetailLabel}>Conflict in:</Text>
          <Text style={styles.conflictDetailValue}>{getConflictFieldsDescription(item)}</Text>
          
          <Text style={styles.conflictDetailLabel}>Local version:</Text>
          <Text style={styles.conflictDetailValue}>
            Modified {formatDate(item.localData.lastModified)} on {item.localData.deviceId}
          </Text>
          
          <Text style={styles.conflictDetailLabel}>Remote version:</Text>
          <Text style={styles.conflictDetailValue}>
            Modified {formatDate(item.remoteData.lastModified)} on {item.remoteData.deviceId}
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.strategySelector}>
            <Text style={styles.strategySelectorLabel}>Resolution Strategy:</Text>
            
            <TouchableOpacity
              style={[
                styles.strategyOption,
                selectedStrategy === ConflictResolutionStrategy.USE_LOCAL && styles.selectedStrategyOption
              ]}
              onPress={() => setSelectedStrategy(ConflictResolutionStrategy.USE_LOCAL)}
            >
              <Ionicons
                name={selectedStrategy === ConflictResolutionStrategy.USE_LOCAL ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedStrategy === ConflictResolutionStrategy.USE_LOCAL ? '#2196F3' : '#757575'}
              />
              <Text style={styles.strategyOptionText}>Use Local Version</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.strategyOption,
                selectedStrategy === ConflictResolutionStrategy.USE_REMOTE && styles.selectedStrategyOption
              ]}
              onPress={() => setSelectedStrategy(ConflictResolutionStrategy.USE_REMOTE)}
            >
              <Ionicons
                name={selectedStrategy === ConflictResolutionStrategy.USE_REMOTE ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedStrategy === ConflictResolutionStrategy.USE_REMOTE ? '#2196F3' : '#757575'}
              />
              <Text style={styles.strategyOptionText}>Use Remote Version</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.strategyOption,
                selectedStrategy === ConflictResolutionStrategy.MERGE && styles.selectedStrategyOption
              ]}
              onPress={() => setSelectedStrategy(ConflictResolutionStrategy.MERGE)}
            >
              <Ionicons
                name={selectedStrategy === ConflictResolutionStrategy.MERGE ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedStrategy === ConflictResolutionStrategy.MERGE ? '#2196F3' : '#757575'}
              />
              <Text style={styles.strategyOptionText}>Merge Changes (Recommended)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.strategyOption,
                selectedStrategy === ConflictResolutionStrategy.MANUAL && styles.selectedStrategyOption
              ]}
              onPress={() => setSelectedStrategy(ConflictResolutionStrategy.MANUAL)}
            >
              <Ionicons
                name={selectedStrategy === ConflictResolutionStrategy.MANUAL ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedStrategy === ConflictResolutionStrategy.MANUAL ? '#2196F3' : '#757575'}
              />
              <Text style={styles.strategyOptionText}>Resolve Manually</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={handleResolve}
            >
              <Text style={styles.resolveButtonText}>Resolve Conflict</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Resolve Sync Conflicts</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            The following items have conflicting changes between your local device and the cloud.
            Please resolve each conflict to continue syncing.
          </Text>
          
          {conflicts.length === 0 ? (
            <View style={styles.noConflictsContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.noConflictsText}>No conflicts to resolve</Text>
            </View>
          ) : (
            <FlatList
              data={conflicts}
              renderItem={renderConflictItem}
              keyExtractor={(item, index) => `${item.dataType}-${item.localData.id}-${index}`}
              style={styles.conflictList}
              contentContainerStyle={styles.conflictListContent}
            />
          )}
          
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    padding: 16,
    fontSize: 14,
    color: '#757575',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  noConflictsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noConflictsText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 16,
  },
  conflictList: {
    flex: 1,
  },
  conflictListContent: {
    padding: 16,
  },
  conflictItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedConflictItem: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF8E1',
  },
  conflictIcon: {
    marginRight: 12,
  },
  conflictInfo: {
    flex: 1,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  conflictSummary: {
    fontSize: 14,
    color: '#757575',
  },
  conflictDetails: {
    padding: 16,
    backgroundColor: 'white',
  },
  conflictDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 8,
    marginBottom: 4,
  },
  conflictDetailValue: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  strategySelector: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  strategySelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedStrategyOption: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  strategyOptionText: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 8,
  },
  resolveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  resolveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    margin: 16,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});