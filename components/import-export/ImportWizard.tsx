import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { importFromCSV, readFileAsString } from '../../utils/csvUtils';
import { importFromOFX, isOFXFile, convertOFXToTransactions, detectDuplicateOFXTransactions } from '../../utils/ofxUtils';
import { useAppContext } from '@/context/AppContext';
import { BankConnection } from '@/types/bankConnection';
import { Transaction, TransactionType } from '@/types/transaction';
import { ImportFileFormat, ImportData } from '@/types/import';
import { importBankTransactions, getBankConnections, detectDuplicateTransactions, categorizeTransactions } from '@/utils/bankApiUtils';
import { Ionicons } from '@expo/vector-icons';
import FileSelectStep from './FileSelectStep';
import ColumnMappingStep from './ColumnMappingStep';
import ImportConfirmationStep from './ImportConfirmationStep';
import ImportSuccessStep from './ImportSuccessStep';

// Import source types
type ImportSource = 'file' | 'bank';

interface ImportStats {
  added: number;
  updated: number;
  duplicates: number;
  errors: number;
}

const ImportWizard = () => {
  const { state, dispatch } = useAppContext();
  const [step, setStep] = useState(1);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [fileData, setFileData] = useState<ImportData | null>(null);
  const [fileFormat, setFileFormat] = useState<ImportFileFormat>('csv');
  const [currentFileUri, setCurrentFileUri] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<BankConnection | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  
  // Load bank connections
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const connections = await getBankConnections();
        setBankConnections(connections);
      } catch (error) {
        console.error('Failed to load bank connections:', error);
      }
    };
    
    loadConnections();
  }, []);

  // Handle source selection
  const handleSourceSelect = (source: ImportSource) => {
    setImportSource(source);
    
    if (source === 'file') {
      // Show file picker
      handleFilePicker();
    } else if (source === 'bank') {
      // Show bank connection selection
      setStep(2);
    }
  };
  
  // Handle file picker
  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/x-ofx', 'application/ofx', 'application/x-qfx', 'application/qfx'],
        copyToCacheDirectory: true,
      });
      
      handleFileSelect(result);
    } catch (error) {
      console.error('File picker error:', error);
    }
  };
  
  // Handle file selection
  const handleFileSelect = async (result: DocumentPicker.DocumentResult) => {
    if (result.type !== 'success') return;
    
    try {
      setLoading(true);
      console.log('[DEBUG] Import: File selected successfully', { fileName: result.name, fileSize: result.size });
      
      // Read file content to detect format
      const fileUri = result.uri;
      setCurrentFileUri(fileUri); // Store the file URI for later use
      console.log('[DEBUG] Import: About to read file content from URI', { fileUri });
      
      try {
        console.log('[DEBUG] Import: Platform is', Platform.OS);
        // Use the cross-platform file reading utility
        const fileContent = await readFileAsString(fileUri);
        console.log('[DEBUG] Import: File content read successfully', { contentLength: fileContent.length });
        
        let importData: ImportData;
        
        // Detect if it's an OFX/QFX file
        if (isOFXFile(fileContent)) {
          console.log('[DEBUG] Import: OFX file detected');
          importData = await importFromOFX(fileUri);
          setFileFormat('ofx');
        } else {
          console.log('[DEBUG] Import: CSV file detected');
          // Assume CSV if not OFX/QFX
          importData = await importFromCSV(fileUri, undefined, true); // true for preview only
          setFileFormat('csv');
        }
        
        setFileData(importData);
      } catch (readError) {
        console.error('[DEBUG] Import: Error reading file content', readError);
        Alert.alert('Import Error', 'Failed to read file. Please check the file format and try again.');
        throw readError;
      }
      
      // Set step to 3 (column mapping for CSV, confirmation for OFX/QFX)
      setStep(3);
    } catch (error) {
      console.error('[DEBUG] Import: Import error:', error);
      Alert.alert('Import Error', 'Failed to import file. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle bank connection selection
  const handleConnectionSelect = (connection: BankConnection) => {
    setSelectedConnection(connection);
    
    if (connection.connectedAccountIds.length === 1) {
      // If only one account, select it automatically
      setSelectedAccount(connection.connectedAccountIds[0]);
      setStep(4); // Skip account selection step
    } else {
      // Show account selection step
      setStep(3);
    }
  };
  
  // Handle account selection
  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);
    setStep(4); // Go to confirmation step
  };

  // Handle column mapping
  const handleColumnMapping = (mapping: Record<string, string>) => {
    setColumnMapping(mapping);
    setStep(4); // Go to confirmation step
  };

  // Handle import from file
  const handleFileImport = async () => {
    if (!fileData) return;
    
    try {
      setLoading(true);
      
      let transactionObjects: Transaction[] = [];
      
      // For CSV files, reload the entire file with column mapping to get all rows
      if (fileFormat === 'csv' && currentFileUri) {
        const fullData = await importFromCSV(currentFileUri, columnMapping, false); // false for all rows
        fileData.preview = fullData.preview;
      }
      
      if (fileFormat === 'ofx' || fileFormat === 'qfx') {
        // For OFX/QFX files, we already have structured data
        // We just need to convert it to Transaction objects
        // First, get the account ID from the user selection or use a default
        const accountId = state.accounts.length > 0 ? state.accounts[0].id : '';
        
        // Convert OFX transactions to app transactions
        transactionObjects = convertOFXToTransactions(
          fileData.preview as any[], // This is actually OFXTransaction[] but we're simplifying the types
          accountId
        );
        
        // Check for duplicates using OFX-specific duplicate detection
        const { duplicates, unique, updated } = detectDuplicateOFXTransactions(
          transactionObjects,
          state.transactions
        );
        
        // Categorize transactions
        const categorizedTransactions = categorizeTransactions(
          unique,
          state.rules,
          {} // Payee categories would be derived from state.payees
        );
        
        // Add transactions to state
        categorizedTransactions.forEach(transaction => {
          dispatch({
            type: 'ADD_TRANSACTION',
            payload: transaction,
          });
        });
        
        // Update existing transactions if needed
        if (updated.length > 0) {
          dispatch({
            type: 'BATCH_UPDATE_TRANSACTIONS',
            payload: updated,
          });
        }
        
        // Set import stats
        setImportStats({
          added: unique.length,
          updated: updated.length,
          duplicates: duplicates.length,
          errors: 0,
        });
      } else {
        // For CSV files, process the mapped data
        const transactions = fileData.preview.map(item => {
          const tx: Record<string, any> = {};
          
          // Process the column mapping
          Object.entries(columnMapping).forEach(([csvHeader, appField]) => {
            // Get the value from the CSV row using the header
            const value = item[csvHeader];
            if (value !== undefined) {
              tx[appField] = value;
            }
          });
          
          return tx;
        });
        
        // Convert the mapped data to Transaction objects
        transactionObjects = transactions.map(item => {
          // Determine transaction type
          let transactionType: TransactionType = 'expense';
          let amount = 0;
          
          // Parse the amount from the mapped data
          if (item.amount) {
            // Remove any non-numeric characters except minus sign and decimal point
            const cleanAmount = item.amount.toString().replace(/[^\d.-]/g, '');
            amount = parseFloat(cleanAmount);
            
            if (!isNaN(amount)) {
              if (amount > 0) {
                transactionType = 'income';
              } else if (item.type === 'transfer') {
                transactionType = 'transfer';
              }
            }
          }
          
          // Find an account to use (use first account if not specified)
          const accountId = item.accountId || (state.accounts.length > 0 ? state.accounts[0].id : '');
          
          // Create a date object from the date string
          let transactionDate = new Date();
          if (item.date) {
            try {
              transactionDate = new Date(item.date);
              // If date is invalid, try different formats
              if (isNaN(transactionDate.getTime())) {
                // Try different date formats
                const dateParts = item.date.split(/[-/]/);
                if (dateParts.length === 3) {
                  transactionDate = new Date(
                    parseInt(dateParts[2]),
                    parseInt(dateParts[1]) - 1,
                    parseInt(dateParts[0])
                  );
                }
              }
            } catch (err) {
              console.error('Error parsing date:', err);
            }
          }
          
          return {
            id: item.id || `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            accountId: accountId,
            date: transactionDate,
            payee: item.payee || '',
            amount: amount,
            type: transactionType,
            categoryId: item.categoryId || (item.category ? item.category : ''),
            description: item.description || '',
            isReconciled: false,
            isCleared: true,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isSplit: false
          } as Transaction;
        });
        
        // Check for duplicates
        const { duplicates, unique } = detectDuplicateTransactions(
          transactionObjects,
          state.transactions
        );
        
        // Categorize transactions
        const categorizedTransactions = categorizeTransactions(
          unique,
          state.rules,
          {} // Payee categories would be derived from state.payees
        );
        
        // Add transactions to state
        categorizedTransactions.forEach(transaction => {
          dispatch({
            type: 'ADD_TRANSACTION',
            payload: transaction,
          });
        });
        
        // Set import stats
        setImportStats({
          added: unique.length,
          updated: 0,
          duplicates: duplicates.length,
          errors: 0,
        });
      }
      
      setStep(5); // Go to success step
    } catch (error) {
      console.error('Final import error:', error);
      Alert.alert('Import Error', 'Failed to import transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle import from bank
  const handleBankImport = async () => {
    if (!selectedConnection || !selectedAccount) return;
    
    try {
      setLoading(true);
      
      // Import transactions from bank
      const result = await importBankTransactions(
        selectedConnection.id,
        selectedAccount
      );
      
      // Check for duplicates
      const { duplicates, unique } = detectDuplicateTransactions(
        result.added,
        state.transactions
      );
      
      // Categorize transactions
      const categorizedTransactions = categorizeTransactions(
        unique,
        state.rules,
        {} // Payee categories would be derived from state.payees
      );
      
      // Add transactions to state
      categorizedTransactions.forEach(transaction => {
        dispatch({
          type: 'ADD_TRANSACTION',
          payload: transaction,
        });
      });
      
      // Update existing transactions
      if (result.updated.length > 0) {
        dispatch({
          type: 'BATCH_UPDATE_TRANSACTIONS',
          payload: result.updated,
        });
      }
      
      // Set import stats
      setImportStats({
        added: unique.length,
        updated: result.updated.length,
        duplicates: duplicates.length,
        errors: result.errors.length,
      });
      
      setStep(5); // Go to success step
    } catch (error) {
      console.error('Bank import error:', error);
      Alert.alert('Import Error', 'Failed to import transactions from bank. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle import based on source
  const handleImport = async () => {
    if (importSource === 'file') {
      await handleFileImport();
    } else if (importSource === 'bank') {
      await handleBankImport();
    }
  };

  // Render source selection step
  const renderSourceSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Import Source</Text>
      <Text style={styles.stepDescription}>
        Choose where you want to import transactions from
      </Text>
      
      <TouchableOpacity
        style={styles.sourceOption}
        onPress={() => handleSourceSelect('file')}
      >
        <Ionicons name="document-outline" size={32} color="#2196F3" />
        <View style={styles.sourceOptionTextContainer}>
          <Text style={styles.sourceOptionTitle}>Import from CSV File</Text>
          <Text style={styles.sourceOptionDescription}>
            Import transactions from a CSV file exported from your bank or financial software
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#757575" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.sourceOption}
        onPress={() => handleSourceSelect('bank')}
        disabled={bankConnections.length === 0}
      >
        <Ionicons name="wallet-outline" size={32} color={bankConnections.length === 0 ? "#9E9E9E" : "#2196F3"} />
        <View style={styles.sourceOptionTextContainer}>
          <Text style={[styles.sourceOptionTitle, bankConnections.length === 0 && styles.disabledText]}>
            Import from Bank Connection
          </Text>
          <Text style={[styles.sourceOptionDescription, bankConnections.length === 0 && styles.disabledText]}>
            {bankConnections.length === 0
              ? "No bank connections available. Add a connection in the Connections tab."
              : "Import transactions directly from your connected bank accounts"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={bankConnections.length === 0 ? "#9E9E9E" : "#757575"} />
      </TouchableOpacity>
    </View>
  );
  
  // Render bank connection selection step
  const renderConnectionSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Bank Connection</Text>
      <Text style={styles.stepDescription}>
        Choose which bank connection to import transactions from
      </Text>
      
      <FlatList
        data={bankConnections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.connectionItem,
              item.status !== 'connected' && styles.disabledConnectionItem
            ]}
            onPress={() => handleConnectionSelect(item)}
            disabled={item.status !== 'connected'}
          >
            <Text style={styles.connectionName}>{item.institutionName}</Text>
            <Text style={[
              styles.connectionStatus,
              item.status === 'connected' ? styles.connectedStatus : styles.disconnectedStatus
            ]}>
              {item.status === 'connected' ? 'Connected' : item.status}
            </Text>
            {item.status === 'connected' && (
              <Text style={styles.connectionDetails}>
                {item.connectedAccountIds.length} account(s) • Last synced: {
                  item.lastSynced
                    ? new Date(item.lastSynced).toLocaleDateString()
                    : 'Never'
                }
              </Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.connectionsList}
      />
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(1)}
      >
        <Ionicons name="arrow-back" size={20} color="#2196F3" />
        <Text style={styles.backButtonText}>Back to Import Options</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render account selection step
  const renderAccountSelectionStep = () => {
    if (!selectedConnection) return null;
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Account</Text>
        <Text style={styles.stepDescription}>
          Choose which account to import transactions from
        </Text>
        
        <FlatList
          data={selectedConnection.connectedAccountIds}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            // In a real app, you would look up the account details
            const account = state.accounts.find(acc => acc.id === item);
            
            return (
              <TouchableOpacity
                style={styles.accountItem}
                onPress={() => handleAccountSelect(item)}
              >
                <Text style={styles.accountName}>
                  {account ? account.name : `Account ${item.substring(0, 8)}`}
                </Text>
                {account && (
                  <Text style={styles.accountBalance}>
                    Balance: ${account.balance.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.accountsList}
        />
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
        >
          <Ionicons name="arrow-back" size={20} color="#2196F3" />
          <Text style={styles.backButtonText}>Back to Connections</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render loading overlay
  const renderLoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Importing transactions...</Text>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {loading && renderLoadingOverlay()}
      
      {step === 1 && renderSourceSelectionStep()}
      
      {step === 2 && importSource === 'bank' && renderConnectionSelectionStep()}
      
      {step === 3 && importSource === 'bank' && renderAccountSelectionStep()}
      
      {step === 3 && importSource === 'file' && fileData && (
        fileFormat === 'csv' ? (
          <ColumnMappingStep
            data={fileData.preview}
            headers={fileData.headers}
            onMappingComplete={handleColumnMapping}
            onCancel={() => setStep(1)}
          />
        ) : (
          // For OFX/QFX files, we can skip the column mapping step
          // and go directly to confirmation
          <ImportConfirmationStep
            data={fileData.preview}
            onConfirm={handleImport}
            onCancel={() => setStep(1)}
            importSource={importSource}
            fileFormat={fileFormat}
          />
        )
      )}
      
      {step === 4 && (
        <ImportConfirmationStep
          data={importSource === 'file' ? fileData?.preview || [] : []}
          onConfirm={handleImport}
          onCancel={() => setStep(importSource === 'file' ? 3 : 3)}
          importSource={importSource}
          bankName={selectedConnection?.institutionName}
          accountId={selectedAccount}
          fileFormat={fileFormat}
        />
      )}
      
      {step === 5 && (
        <ImportSuccessStep
          stats={importStats}
          importSource={importSource}
          fileFormat={fileFormat}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  stepContainer: {
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
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sourceOptionTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  sourceOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  sourceOptionDescription: {
    fontSize: 14,
    color: '#757575',
  },
  disabledText: {
    color: '#9E9E9E',
  },
  connectionsList: {
    marginTop: 8,
  },
  connectionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  disabledConnectionItem: {
    opacity: 0.6,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  connectionStatus: {
    fontSize: 14,
    marginBottom: 4,
  },
  connectedStatus: {
    color: '#4CAF50',
  },
  disconnectedStatus: {
    color: '#F44336',
  },
  connectionDetails: {
    fontSize: 14,
    color: '#757575',
  },
  accountsList: {
    marginTop: 8,
  },
  accountItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 14,
    color: '#757575',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    fontSize: 16,
    color: '#212121',
    marginTop: 16,
  }
});

export default ImportWizard;