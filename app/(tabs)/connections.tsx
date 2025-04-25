import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { 
  BankConnection, 
  BankInstitution, 
  ConnectionStatus 
} from '@/types/bankConnection';
import { 
  fetchBankInstitutions, 
  getBankConnections, 
  syncBankConnection,
  deleteBankConnection,
  initiateOAuthConnection,
  initiateCredentialConnection
} from '@/utils/bankApiUtils';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TextInput, Button, Dialog, Portal, Modal } from 'react-native-paper';

// Status indicator component
const ConnectionStatusIndicator = ({ status }: { status: ConnectionStatus }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4CAF50'; // Green
      case 'connecting':
        return '#FFC107'; // Yellow
      case 'disconnected':
        return '#9E9E9E'; // Gray
      case 'error':
      case 'reconnect_required':
        return '#F44336'; // Red
      case 'expired':
        return '#FF9800'; // Orange
      case 'maintenance':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      case 'expired':
        return 'Expired';
      case 'maintenance':
        return 'Maintenance';
      case 'reconnect_required':
        return 'Reconnect Required';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{getStatusText()}</Text>
    </View>
  );
};

// Bank connection item component
const ConnectionItem = ({ 
  connection, 
  onSync, 
  onDelete 
}: { 
  connection: BankConnection; 
  onSync: (id: string) => void; 
  onDelete: (id: string) => void; 
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <View style={styles.connectionItem}>
      <View style={styles.connectionHeader}>
        <Text style={styles.connectionName}>{connection.institutionName}</Text>
        <ConnectionStatusIndicator status={connection.status} />
      </View>
      
      <View style={styles.connectionDetails}>
        <Text style={styles.detailLabel}>Last Synced:</Text>
        <Text style={styles.detailValue}>{formatDate(connection.lastSynced)}</Text>
      </View>
      
      <View style={styles.connectionDetails}>
        <Text style={styles.detailLabel}>Connected Accounts:</Text>
        <Text style={styles.detailValue}>{connection.connectedAccountIds.length}</Text>
      </View>
      
      {connection.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {connection.error.message}</Text>
        </View>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onSync(connection.id)}
        >
          <Ionicons name="sync" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Sync</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onDelete(connection.id)}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Add connection modal component
const AddConnectionModal = ({ 
  visible, 
  onDismiss, 
  institutions, 
  onConnect 
}: { 
  visible: boolean; 
  onDismiss: () => void; 
  institutions: BankInstitution[]; 
  onConnect: (institutionId: string, credentials?: { username: string; password: string }) => void; 
}) => {
  const [selectedInstitution, setSelectedInstitution] = useState<BankInstitution | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleConnect = () => {
    if (!selectedInstitution) {
      Alert.alert('Error', 'Please select a bank institution');
      return;
    }

    if (selectedInstitution.connectionType === 'credentials') {
      if (!username || !password) {
        Alert.alert('Error', 'Please enter your credentials');
        return;
      }
      onConnect(selectedInstitution.id, { username, password });
    } else {
      // OAuth or API Key
      onConnect(selectedInstitution.id);
    }
  };

  const resetForm = () => {
    setSelectedInstitution(null);
    setUsername('');
    setPassword('');
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Connect to Bank</Text>
        
        <Text style={styles.sectionTitle}>Select Bank</Text>
        <FlatList
          data={institutions}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.institutionItem,
                selectedInstitution?.id === item.id && styles.selectedInstitution
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedInstitution(item);
              }}
            >
              <Text style={styles.institutionName}>{item.name}</Text>
              {item.status !== 'active' && (
                <Text style={styles.institutionStatus}>{item.status}</Text>
              )}
            </TouchableOpacity>
          )}
        />
        
        {selectedInstitution?.connectionType === 'credentials' && (
          <View style={styles.credentialsContainer}>
            <Text style={styles.sectionTitle}>Enter Credentials</Text>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>
        )}
        
        <View style={styles.modalButtons}>
          <Button 
            mode="outlined" 
            onPress={handleDismiss}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleConnect}
            style={styles.modalButton}
            disabled={!selectedInstitution}
          >
            Connect
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

// Main component
export default function ConnectionsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, dispatch } = useAppContext();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Load connections and institutions
  const loadData = async () => {
    try {
      setLoading(true);
      const bankConnections = await getBankConnections();
      const bankInstitutions = await fetchBankInstitutions();
      
      setConnections(bankConnections);
      setInstitutions(bankInstitutions);
    } catch (error) {
      console.error('Failed to load bank connections:', error);
      Alert.alert('Error', 'Failed to load bank connections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle sync
  const handleSync = async (connectionId: string) => {
    try {
      setSyncingId(connectionId);
      const result = await syncBankConnection(connectionId);
      
      if (result.status === 'completed') {
        Alert.alert('Success', 'Bank connection synced successfully');
      } else {
        Alert.alert('Error', `Sync failed: ${result.error?.message || 'Unknown error'}`);
      }
      
      // Reload connections to show updated status
      loadData();
    } catch (error) {
      console.error('Failed to sync bank connection:', error);
      Alert.alert('Error', 'Failed to sync bank connection');
    } finally {
      setSyncingId(null);
    }
  };

  // Handle delete
  const handleDelete = (connectionId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this bank connection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteBankConnection(connectionId);
              
              if (success) {
                // Remove from local state
                setConnections(connections.filter(conn => conn.id !== connectionId));
                Alert.alert('Success', 'Bank connection deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete bank connection');
              }
            } catch (error) {
              console.error('Failed to delete bank connection:', error);
              Alert.alert('Error', 'Failed to delete bank connection');
            }
          }
        }
      ]
    );
  };

  // Handle connect
  const handleConnect = async (
    institutionId: string, 
    credentials?: { username: string; password: string }
  ) => {
    try {
      setModalVisible(false);
      setLoading(true);
      
      const institution = institutions.find(inst => inst.id === institutionId);
      
      if (!institution) {
        throw new Error(`Institution with ID ${institutionId} not found`);
      }
      
      let result;
      
      if (institution.connectionType === 'credentials' && credentials) {
        result = await initiateCredentialConnection(
          institutionId,
          credentials.username,
          credentials.password
        );
      } else {
        result = await initiateOAuthConnection(institutionId);
      }
      
      if (result.success) {
        Alert.alert('Success', 'Bank connection added successfully');
        loadData(); // Reload connections
      } else {
        Alert.alert('Error', `Failed to connect: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to connect to bank:', error);
      Alert.alert('Error', 'Failed to connect to bank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Bank Connections',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={24} color="#2196F3" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading bank connections...</Text>
        </View>
      ) : (
        <>
          {connections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#9E9E9E" />
              <Text style={styles.emptyText}>No bank connections</Text>
              <Text style={styles.emptySubtext}>
                Connect your bank accounts to automatically import transactions
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
              </Text>
              <Button
                mode="contained"
                onPress={() => setModalVisible(true)}
                style={styles.addButton}
              >
                Add Bank Connection
              </Button>
            </View>
          ) : (
            <FlatList
              data={connections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ConnectionItem
                  connection={item}
                  onSync={handleSync}
                  onDelete={handleDelete}
                />
              )}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            />
          )}
        </>
      )}
      
      {/* Syncing overlay */}
      {syncingId && (
        <View style={styles.syncingOverlay}>
          <View style={styles.syncingContent}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.syncingText}>Syncing bank data...</Text>
          </View>
        </View>
      )}
      
      {/* Add connection modal */}
      <AddConnectionModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        institutions={institutions}
        onConnect={handleConnect}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    marginRight: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#424242',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    marginTop: 20,
  },
  listContainer: {
    padding: 16,
  },
  connectionItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.card,
    fontWeight: 'bold',
  },
  connectionDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
    width: 140,
  },
  detailValue: {
    fontSize: 14,
    color: '#212121',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#616161',
  },
  syncingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  syncingContent: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#212121',
  },
  modalContainer: {
    backgroundColor: theme.colors.card,
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#212121',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#424242',
  },
  institutionItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedInstitution: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  institutionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  institutionStatus: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  credentialsContainer: {
    marginTop: 20,
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    marginLeft: 10,
  },
});