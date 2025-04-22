import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { StorageProvider, StorageProviderAuth } from '../../types/sync';
import { saveStorageProviderAuth, getStorageProviderAuth, clearStorageProviderAuth } from '../../utils/syncUtils';
import { useAppContext } from '../../context/AppContext';

interface CloudStorageSelectorProps {
  onSelect: (provider: StorageProvider) => void;
  currentProvider: StorageProvider;
}

/**
 * Component for selecting and authenticating with cloud storage providers
 */
export default function CloudStorageSelector({ onSelect, currentProvider }: CloudStorageSelectorProps) {
  const { state, dispatch } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<Record<StorageProvider, boolean>>({
    [StorageProvider.GOOGLE_DRIVE]: false,
    [StorageProvider.DROPBOX]: false,
    [StorageProvider.ONEDRIVE]: false,
    [StorageProvider.ICLOUD]: false,
    [StorageProvider.CUSTOM]: false,
  });

  // Check authentication status for all providers
  useEffect(() => {
    const checkAuthStatus = async () => {
      const status: Record<StorageProvider, boolean> = {
        [StorageProvider.GOOGLE_DRIVE]: false,
        [StorageProvider.DROPBOX]: false,
        [StorageProvider.ONEDRIVE]: false,
        [StorageProvider.ICLOUD]: false,
        [StorageProvider.CUSTOM]: false,
      };
      
      for (const provider of Object.values(StorageProvider)) {
        const auth = await getStorageProviderAuth(provider as StorageProvider);
        status[provider as StorageProvider] = !!auth;
      }
      
      setAuthStatus(status);
    };
    
    checkAuthStatus();
  }, []);

  // Get provider display name
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

  // Get provider icon
  const getProviderIcon = (provider: StorageProvider) => {
    switch (provider) {
      case StorageProvider.GOOGLE_DRIVE:
        return 'logo-google';
      case StorageProvider.DROPBOX:
        return 'logo-dropbox';
      case StorageProvider.ONEDRIVE:
        return 'cloud';
      case StorageProvider.ICLOUD:
        return 'logo-apple';
      case StorageProvider.CUSTOM:
        return 'cog';
      default:
        return 'help-circle';
    }
  };

  // Handle provider selection
  const handleSelectProvider = async (provider: StorageProvider) => {
    setModalVisible(false);
    
    // If already authenticated, just select the provider
    if (authStatus[provider]) {
      onSelect(provider);
      return;
    }
    
    // Otherwise, start authentication flow
    await authenticateProvider(provider);
  };

  // Authenticate with a provider
  const authenticateProvider = async (provider: StorageProvider) => {
    try {
      setAuthenticating(true);
      
      // This would be replaced with actual OAuth flow in a real app
      // For this example, we'll simulate authentication
      
      // Simulate OAuth redirect
      const redirectUrl = Linking.createURL('sync/auth-callback');
      
      // Show authentication message
      Alert.alert(
        'Authentication Simulation',
        `In a real app, this would open the ${getProviderName(provider)} authentication page. For this example, we'll simulate a successful authentication.`,
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              // Simulate successful authentication
              const mockAuth: StorageProviderAuth = {
                provider,
                accessToken: 'mock-access-token-' + Date.now(),
                refreshToken: 'mock-refresh-token-' + Date.now(),
                expiresAt: Date.now() + 3600000, // 1 hour from now
                userId: 'mock-user-id',
              };
              
              // Save auth info
              await saveStorageProviderAuth(mockAuth);
              
              // Update app context
              dispatch({
                type: 'SET_SYNC_PROVIDER_AUTH',
                payload: mockAuth,
              });
              
              // Update auth status
              setAuthStatus(prev => ({
                ...prev,
                [provider]: true,
              }));
              
              // Select the provider
              onSelect(provider);
              
              setAuthenticating(false);
            },
          },
          {
            text: 'Simulate Failure',
            style: 'cancel',
            onPress: () => {
              // Simulate failed authentication
              Alert.alert('Authentication Failed', 'The authentication process was cancelled or failed.');
              setAuthenticating(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with the provider.');
      setAuthenticating(false);
    }
  };

  // Disconnect from a provider
  const handleDisconnect = async (provider: StorageProvider) => {
    try {
      Alert.alert(
        'Disconnect Provider',
        `Are you sure you want to disconnect from ${getProviderName(provider)}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              await clearStorageProviderAuth(provider);
              
              // Update app context
              dispatch({
                type: 'SET_SYNC_PROVIDER_AUTH',
                payload: null,
              });
              
              // Update auth status
              setAuthStatus(prev => ({
                ...prev,
                [provider]: false,
              }));
              
              // If this was the current provider, select a different one
              if (provider === currentProvider) {
                onSelect(StorageProvider.GOOGLE_DRIVE);
              }
              
              Alert.alert('Provider Disconnected', `Successfully disconnected from ${getProviderName(provider)}.`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Disconnect Error', 'Failed to disconnect from the provider.');
    }
  };

  // Render provider item
  const renderProviderItem = ({ item }: { item: StorageProvider }) => {
    const isSelected = item === currentProvider;
    const isAuthenticated = authStatus[item];
    
    return (
      <TouchableOpacity
        style={[
          styles.providerItem,
          isSelected && styles.selectedProviderItem,
        ]}
        onPress={() => handleSelectProvider(item)}
      >
        <View style={styles.providerIconContainer}>
          <Ionicons
            name={getProviderIcon(item)}
            size={24}
            color={isSelected ? '#2196F3' : '#757575'}
          />
        </View>
        
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{getProviderName(item)}</Text>
          <Text style={styles.providerStatus}>
            {isAuthenticated ? 'Connected' : 'Not connected'}
          </Text>
        </View>
        
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
        )}
        
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={() => handleDisconnect(item)}
          >
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectedProvider}>
          <Ionicons
            name={getProviderIcon(currentProvider)}
            size={20}
            color="#2196F3"
            style={styles.selectedProviderIcon}
          />
          <Text style={styles.selectedProviderText}>
            {getProviderName(currentProvider)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#757575" />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Storage Provider</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.values(StorageProvider)}
              renderItem={renderProviderItem}
              keyExtractor={(item) => item}
              style={styles.providerList}
            />
          </View>
        </View>
      </Modal>
      
      {authenticating && (
        <View style={styles.authOverlay}>
          <View style={styles.authCard}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.authText}>Authenticating...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedProvider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedProviderIcon: {
    marginRight: 8,
  },
  selectedProviderText: {
    fontSize: 16,
    color: '#212121',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  providerList: {
    maxHeight: 400,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedProviderItem: {
    backgroundColor: '#E3F2FD',
  },
  providerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  providerStatus: {
    fontSize: 14,
    color: '#757575',
  },
  disconnectButton: {
    padding: 8,
    marginLeft: 8,
  },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  authCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  authText: {
    fontSize: 16,
    color: '#212121',
    marginTop: 16,
  },
});