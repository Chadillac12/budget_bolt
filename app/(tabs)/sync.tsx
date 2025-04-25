import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

import CloudStorageSelector from '../../components/sync/CloudStorageSelector';
import ConflictResolutionModal from '../../components/sync/ConflictResolutionModal';

import {
  SyncStatus,
  SyncState,
  SyncConfig,
  StorageProvider,
  ConflictResolutionStrategy,
  SyncConflict,
  SyncableData
} from '../../types/sync';
import {
  getSyncState,
  getSyncConfig,
  updateSyncConfig,
  performSync,
  getDeviceInfo,
  setupSync
} from '../../utils/syncUtils';
import { useAppContext } from '../../context/AppContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

/**
 * Sync Settings and Status Screen
 * Allows users to configure sync settings and view sync status
 */
export default function SyncScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ deviceName: string; deviceType: string; platform: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);

  // Load sync state and config
  const loadSyncData = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await getSyncState();
      const config = await getSyncConfig();
      const info = await getDeviceInfo();
      
      setSyncState(state);
      setSyncConfig(config);
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to load sync data:', error);
      Alert.alert('Error', 'Failed to load sync settings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initialize sync on first load
  useEffect(() => {
    const initSync = async () => {
      try {
        await setupSync();
        await loadSyncData();
      } catch (error) {
        console.error('Failed to initialize sync:', error);
        Alert.alert('Error', 'Failed to initialize sync system');
        setIsLoading(false);
      }
    };
    
    initSync();
  }, [loadSyncData]);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSyncData();
    }, [loadSyncData])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSyncData();
  }, [loadSyncData]);

  // Toggle a boolean sync config setting
  const toggleSetting = async (setting: keyof SyncConfig) => {
    if (!syncConfig) return;
    
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const newValue = !syncConfig[setting as keyof SyncConfig];
      const updatedConfig = await updateSyncConfig({ [setting]: newValue } as any);
      setSyncConfig(updatedConfig);
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error);
      Alert.alert('Error', `Failed to update sync settings`);
    }
  };

  // Update a sync config setting
  const updateSetting = async <K extends keyof SyncConfig>(setting: K, value: SyncConfig[K]) => {
    if (!syncConfig) return;
    
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const updatedConfig = await updateSyncConfig({ [setting]: value } as any);
      setSyncConfig(updatedConfig);
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error);
      Alert.alert('Error', `Failed to update sync settings`);
    }
  };

  // Handle resolving a sync conflict
  const handleResolveConflict = async (
    conflict: SyncConflict<any>,
    strategy: ConflictResolutionStrategy,
    customMergedData?: SyncableData<any>
  ) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // In a real app, this would call a function to resolve the conflict
      // For this example, we'll just remove the conflict from the list
      
      if (syncState && syncState.conflicts) {
        const updatedConflicts = syncState.conflicts.filter(c =>
          c.dataType !== conflict.dataType ||
          c.localData.id !== conflict.localData.id
        );
        
        // Update sync state with resolved conflicts
        const updatedSyncState = {
          ...syncState,
          conflicts: updatedConflicts,
          status: updatedConflicts.length === 0 ? SyncStatus.COMPLETED : SyncStatus.CONFLICT
        };
        
        // Update app context
        dispatch({
          type: 'SET_SYNC_STATE',
          payload: updatedSyncState
        });
        
        setSyncState(updatedSyncState);
        
        // Show success message
        Alert.alert('Conflict Resolved', 'The conflict has been successfully resolved.');
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      Alert.alert('Error', 'Failed to resolve the conflict. Please try again.');
    }
  };
  
  // Trigger a manual sync
  const handleManualSync = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Update UI immediately to show sync in progress
      setSyncState(prev => prev ? {
        ...prev,
        status: SyncStatus.IN_PROGRESS,
        currentOperation: 'Starting sync',
        progress: 0
      } : null);
      
      const result = await performSync();
      
      // Refresh sync state after sync completes
      await loadSyncData();
      
      if (result.status === SyncStatus.COMPLETED) {
        Alert.alert('Sync Complete', `Successfully synced ${result.itemsSynced} items`);
      } else if (result.status === SyncStatus.CONFLICT) {
        Alert.alert('Sync Conflicts', 'There were conflicts during sync. Please resolve them in the conflicts section.');
      } else if (result.status === SyncStatus.FAILED) {
        Alert.alert('Sync Failed', result.errors.join('\n'));
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      Alert.alert('Sync Error', error instanceof Error ? error.message : 'Unknown error during sync');
      
      // Refresh sync state to show error
      await loadSyncData();
    }
  };

  // Format timestamp as readable date
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Get status indicator color
  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.COMPLETED:
        return '#4CAF50'; // Green
      case SyncStatus.IN_PROGRESS:
        return '#2196F3'; // Blue
      case SyncStatus.FAILED:
        return '#F44336'; // Red
      case SyncStatus.CONFLICT:
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Get storage provider name
  const getProviderName = (provider: StorageProvider) => {
    switch (provider) {
      case StorageProvider.GOOGLE_DRIVE:
        return 'Google Drive';
      case StorageProvider.DROPBOX:
        return 'Dropbox';
      case StorageProvider.ONEDRIVE:
        return 'OneDrive';
      case StorageProvider.ICLOUD:
        return 'iCloud';
      case StorageProvider.CUSTOM:
        return 'Custom Provider';
      default:
        return 'Unknown';
    }
  };

  // Get conflict strategy name
  const getStrategyName = (strategy: ConflictResolutionStrategy) => {
    switch (strategy) {
      case ConflictResolutionStrategy.USE_LOCAL:
        return 'Use Local Version';
      case ConflictResolutionStrategy.USE_REMOTE:
        return 'Use Remote Version';
      case ConflictResolutionStrategy.MERGE:
        return 'Merge Changes';
      case ConflictResolutionStrategy.MANUAL:
        return 'Resolve Manually';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading sync settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* Sync Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sync Status</Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: syncState ? getStatusColor(syncState.status) : '#9E9E9E' }]} />
          <Text style={styles.statusText}>{syncState?.status || 'Unknown'}</Text>
        </View>
        
        {syncState?.currentOperation && (
          <View style={styles.operationContainer}>
            <Text style={styles.operationText}>{syncState.currentOperation}</Text>
            {syncState.progress > 0 && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${syncState.progress}%` }]} />
              </View>
            )}
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Sync Attempt:</Text>
          <Text style={styles.infoValue}>{syncState ? formatTimestamp(syncState.lastSyncAttempt) : 'Never'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Successful Sync:</Text>
          <Text style={styles.infoValue}>{syncState ? formatTimestamp(syncState.lastSuccessfulSync) : 'Never'}</Text>
        </View>
        
        {syncState?.pendingChanges !== undefined && syncState.pendingChanges > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pending Changes:</Text>
            <Text style={styles.infoValue}>{syncState.pendingChanges}</Text>
          </View>
        )}
        
        {syncState?.error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={theme.colors.textSecondary} />
            <Text style={styles.errorText}>{syncState.error}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleManualSync}
          disabled={syncState?.status === SyncStatus.IN_PROGRESS}
        >
          <Ionicons name="sync" size={20} color="#FFFFFF" />
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      </View>
      
      {/* Device Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device Name:</Text>
          <Text style={styles.infoValue}>{deviceInfo?.deviceName || 'Unknown'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device Type:</Text>
          <Text style={styles.infoValue}>{deviceInfo?.deviceType || 'Unknown'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform:</Text>
          <Text style={styles.infoValue}>{deviceInfo?.platform || 'Unknown'}</Text>
        </View>
      </View>
      
      {/* Sync Settings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sync Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Auto Sync</Text>
            <Text style={styles.settingDescription}>Automatically sync data in the background</Text>
          </View>
          <Switch
            value={syncConfig?.autoSync || false}
            onValueChange={() => toggleSetting('autoSync')}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Sync on Startup</Text>
            <Text style={styles.settingDescription}>Sync when the app is launched</Text>
          </View>
          <Switch
            value={syncConfig?.syncOnStartup || false}
            onValueChange={() => toggleSetting('syncOnStartup')}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Sync Only on WiFi</Text>
            <Text style={styles.settingDescription}>Only sync when connected to WiFi</Text>
          </View>
          <Switch
            value={syncConfig?.syncOnlyOnWifi || false}
            onValueChange={() => toggleSetting('syncOnlyOnWifi')}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Enable Encryption</Text>
            <Text style={styles.settingDescription}>Encrypt data before syncing</Text>
          </View>
          <Switch
            value={syncConfig?.enableEncryption || false}
            onValueChange={() => toggleSetting('enableEncryption')}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Sync Interval</Text>
            <Text style={styles.settingDescription}>How often to sync (in minutes)</Text>
          </View>
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={styles.intervalButton}
              onPress={() => {
                if (syncConfig && syncConfig.syncInterval > 5) {
                  updateSetting('syncInterval', syncConfig.syncInterval - 5);
                }
              }}
            >
              <Text style={styles.intervalButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.intervalValue}>{syncConfig?.syncInterval || 15}</Text>
            
            <TouchableOpacity
              style={styles.intervalButton}
              onPress={() => {
                if (syncConfig) {
                  updateSetting('syncInterval', syncConfig.syncInterval + 5);
                }
              }}
            >
              <Text style={styles.intervalButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Storage Provider</Text>
            <Text style={styles.settingDescription}>Where to store synced data</Text>
          </View>
          <CloudStorageSelector
            currentProvider={syncConfig?.storageProvider || StorageProvider.GOOGLE_DRIVE}
            onSelect={(provider) => updateSetting('storageProvider', provider)}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Conflict Resolution</Text>
            <Text style={styles.settingDescription}>How to handle conflicting changes</Text>
          </View>
          <TouchableOpacity
            style={styles.providerButton}
            onPress={() => {
              // In a real app, this would open a strategy selection screen
              Alert.alert('Select Strategy', 'This would open a conflict resolution strategy selection screen');
            }}
          >
            <Text style={styles.providerButtonText}>
              {syncConfig ? getStrategyName(syncConfig.conflictStrategy) : 'Select'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Conflicts Card - Only show if there are conflicts */}
      {syncState?.conflicts && syncState.conflicts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conflicts</Text>
          
          <Text style={styles.conflictsText}>
            {syncState.conflicts.length} conflict{syncState.conflicts.length !== 1 ? 's' : ''} need{syncState.conflicts.length === 1 ? 's' : ''} resolution
          </Text>
          
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => setConflictModalVisible(true)}
          >
            <Ionicons name="git-merge" size={20} color="#FFFFFF" />
            <Text style={styles.resolveButtonText}>Resolve Conflicts</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        visible={conflictModalVisible}
        conflicts={syncState?.conflicts || []}
        onResolve={handleResolveConflict}
        onClose={() => setConflictModalVisible(false)}
      />
      
      {/* Advanced Options Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Advanced Options</Text>
        
        <TouchableOpacity 
          style={styles.advancedButton}
          onPress={() => {
            Alert.alert(
              'Reset Sync',
              'This will reset all sync settings and data. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset', 
                  style: 'destructive',
                  onPress: () => {
                    // In a real app, this would reset sync settings and data
                    Alert.alert('Reset Complete', 'Sync settings and data have been reset');
                    loadSyncData();
                  }
                }
              ]
            );
          }}
        >
          <RefreshCw size={48} color={theme.colors.textSecondary} />
          <Text style={styles.advancedButtonText}>Reset Sync</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.advancedButton}
          onPress={() => {
            // In a real app, this would export sync logs
            Alert.alert('Export Logs', 'This would export sync logs for troubleshooting');
          }}
        >
          <Ionicons name="document-text" size={20} color="#2196F3" />
          <Text style={styles.advancedButtonText}>Export Sync Logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212121',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  operationContainer: {
    marginBottom: 16,
  },
  operationText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  syncButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intervalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  intervalValue: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerButtonText: {
    fontSize: 16,
    color: '#2196F3',
    marginRight: 4,
  },
  conflictsText: {
    fontSize: 16,
    color: '#FF9800',
    marginBottom: 16,
  },
  resolveButton: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  resolveButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  advancedButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#212121',
  },
});