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
  const [csvAccountSelection, setCsvAccountSelection] = useState<string | null>(null);
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
      console.log('[DEBUG] Import: Preparing document picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/x-ofx', 'application/ofx', 'application/x-qfx', 'application/qfx'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        console.log('[DEBUG] Import: File selection cancelled');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        handleFileSelect(result.assets[0]);
      } else {
        console.log('[DEBUG] Import: No file selected or empty result');
      }
    } catch (error) {
      console.error('[DEBUG] Import: File picker error:', error);
      Alert.alert(
        'File Selection Error',
        'There was a problem selecting the file. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Handle file selection
  const handleFileSelect = async (file: DocumentPicker.DocumentPickerAsset) => {
    if (!file) {
      console.log('[DEBUG] Import: No file selected');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[DEBUG] Import: File selected successfully', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.mimeType
      });
      
      // Read file content to detect format
      const fileUri = file.uri;
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
        
        console.log('[DEBUG] Import: Setting fileData state with', {
          headers: importData.headers?.length || 0,
          previewRowCount: importData.preview?.length || 0,
          format: importData.format
        });
        
        // Store the data and explicitly move to next step
        setFileData(importData);
        
        // Explicitly set step to 3 (column mapping for CSV, confirmation for OFX/QFX)
        console.log('[DEBUG] Import: Setting step to 3');
        // Ensure we're setting state in the correct order and waiting for the update
        setTimeout(() => {
          console.log('[DEBUG] Import: Moving to step 3 after timeout');
          setStep(3);
        }, 100);
      } catch (readError) {
        console.error('[DEBUG] Import: Error reading file content', readError);
        Alert.alert(
          'Import Error',
          `Failed to read file: ${readError instanceof Error ? readError.message : 'Unknown error'}. Please check the file format and try again.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('[DEBUG] Import: Import error:', error);
      Alert.alert(
        'Import Error',
        `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the file format.`,
        [{ text: 'OK' }]
      );
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
    // If more than one account, require selection; else auto-select
    if (state.accounts.length > 1) {
      setStep(4); // New step: account selection for CSV
    } else {
      setCsvAccountSelection(state.accounts[0].id);
      setStep(5); // Go to confirmation
    }
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
      
      if (fileFormat === 'csv') {
        const accountId = csvAccountSelection || (state.accounts.length > 0 ? state.accounts[0].id : '');
        const transactions = fileData.preview.map(item => {
          const tx: Record<string, any> = {};
          
          // Process the column mapping
          Object.entries(columnMapping).forEach(([appField, csvHeader]) => {
            // Get the value from the CSV row using the header
            const value = item[csvHeader];
            if (value !== undefined) {
              tx[appField] = value;
            }
          });
          
          // Use a default transaction type of expense
          let transactionType: TransactionType = 'expense';
          
          // Parse the amount value
          let transactionAmount = 0;
          if (tx.amount) {
            // Remove any currency symbols or commas and parse
            let amountStr = String(tx.amount).replace(/[$,]/g, '');
            transactionAmount = Math.abs(parseFloat(amountStr) || 0);
            
            // Determine if this is income or expense based on the amount sign or transaction type
            if (tx.type) {
              const typeStr = String(tx.type).toLowerCase();
              if (
                typeStr.includes('deposit') || 
                typeStr.includes('credit') ||
                typeStr === 'income' ||
                typeStr === 'credit'
              ) {
                transactionType = 'income';
              } else {
                transactionType = 'expense';
              }
            } else {
              // If no type specified, determine by sign
              // In most bank exports, positive = deposit, negative = withdrawal
              transactionType = parseFloat(amountStr) >= 0 ? 'income' : 'expense';
            }
          }
          
          // Parse the date value
          let transactionDate = new Date();
          if (tx.date) {
            try {
              // Try standard date parsing first
              const parsedDate = new Date(tx.date);
              
              // Check if the parsed date is valid
              if (!isNaN(parsedDate.getTime())) {
                transactionDate = parsedDate;
              } else {
                // Try different common date formats
                // MM/DD/YYYY or DD/MM/YYYY
                const dateParts = tx.date.split(/[\/\-\.]/);
                if (dateParts.length >= 3) {
                  // Try to determine format based on part sizes
                  if (dateParts[0].length === 4) {
                    // YYYY-MM-DD format
                    transactionDate = new Date(
                      parseInt(dateParts[0]),
                      parseInt(dateParts[1]) - 1,
                      parseInt(dateParts[2])
                    );
                  } else {
                    // Assume MM/DD/YYYY (most common in US exports)
                    transactionDate = new Date(
                      parseInt(dateParts[2]),
                      parseInt(dateParts[0]) - 1,
                      parseInt(dateParts[1])
                    );
                  }
                }
              }
              
              // Verify that the parsed date is valid
              if (isNaN(transactionDate.getTime())) {
                console.log(`[DEBUG] Invalid date after parsing: ${tx.date}, using current date instead`);
                transactionDate = new Date(); // Fallback to current date
              }
            } catch (e) {
              console.log('[DEBUG] Error parsing date:', tx.date, e);
              // Keep default date if parsing fails
              transactionDate = new Date();
            }
          }
          
          // Create the transaction object
          return {
            id: item.id || `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            accountId: accountId,
            date: transactionDate,
            payee: tx.payee || '',
            amount: transactionAmount,
            type: transactionType,
            categoryId: tx.categoryId || (tx.category ? tx.category : ''),
            description: tx.description || tx.notes || '',
            isReconciled: false,
            isCleared: true,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isSplit: false
          } as Transaction;
        });
        
        // Filter out transactions with no amount or invalid data
        const validTransactions = transactions.filter(t => t.amount > 0 && (t.payee || t.description));
        
        console.log(`[DEBUG] Found ${validTransactions.length} valid transactions out of ${transactions.length} total`);
        
        try {
          // Check for duplicates
          const { duplicates, unique } = detectDuplicateTransactions(
            validTransactions,
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
            errors: transactions.length - validTransactions.length,
          });
        } catch (error) {
          console.error('[DEBUG] Error during duplicate detection or categorization:', error);
          // Even if duplicate detection fails, still add all valid transactions
          validTransactions.forEach(transaction => {
            dispatch({
              type: 'ADD_TRANSACTION',
              payload: transaction,
            });
          });
          
          setImportStats({
            added: validTransactions.length,
            updated: 0,
            duplicates: 0,
            errors: transactions.length - validTransactions.length,
          });
        }
      } else if (fileFormat === 'ofx' || fileFormat === 'qfx') {
        // OFX/QFX import logic
        // This would be handled separately as these are structured formats
        console.log('[DEBUG] OFX/QFX import not yet implemented');
        setImportStats({
          added: 0,
          updated: 0,
          duplicates: 0,
          errors: 0,
        });
      }
      
      setStep(6); // Go to success step
    } catch (error) {
      console.error('[DEBUG] Final import error:', error);
      // Include more details in the error message to help with debugging
      const errorDetails = error instanceof Error 
        ? `${error.message}${error.stack ? '\n' + error.stack : ''}` 
        : String(error);
      
      console.error('[DEBUG] Detailed error information:', errorDetails);
      
      Alert.alert(
        'Import Error', 
        'Failed to import transactions. This may be due to an issue with the file format or data. Please try again with a different file or contact support.',
        [{ text: 'OK' }]
      );
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
      
      setStep(6); // Go to success step
    } catch (error) {
      console.error('Bank import error:', error);
      Alert.alert('Import Error', 'Failed to import transactions from bank. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle import based on source
  const handleImport = async () => {
    try {
      if (importSource === 'file') {
        await handleFileImport();
      } else if (importSource === 'bank') {
        await handleBankImport();
      }
    } catch (error) {
      console.error('[DEBUG] Error during import:', error);
      Alert.alert(
        'Import Error',
        `There was a problem during the import process. ${error instanceof Error ? error.message : 'Please try again later.'}`,
        [{ text: 'OK' }]
      );
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

  // Render account selection step for CSV
  const renderCsvAccountSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Account</Text>
      <Text style={styles.stepDescription}>
        Choose which account to import these transactions into
      </Text>
      <FlatList
        data={state.accounts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.accountItem}
            onPress={() => {
              setCsvAccountSelection(item.id);
              setStep(5);
            }}
          >
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountBalance}>Balance: ${item.balance.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.accountsList}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
        <Ionicons name="arrow-back" size={20} color="#2196F3" />
        <Text style={styles.backButtonText}>Back to Mapping</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render loading overlay
  const renderLoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Importing transactions...</Text>
      </View>
    </View>
  );
  
  // Debug display for troubleshooting (only in development)
  const renderDebugInfo = () => {
    if (__DEV__) {
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>Current step: {step}</Text>
          <Text style={styles.debugText}>Import source: {importSource}</Text>
          <Text style={styles.debugText}>File format: {fileFormat}</Text>
          <Text style={styles.debugText}>Has file data: {fileData ? 'Yes' : 'No'}</Text>
          {fileData && (
            <>
              <Text style={styles.debugText}>Headers: {fileData.headers?.length || 0}</Text>
              <Text style={styles.debugText}>Preview rows: {fileData.preview?.length || 0}</Text>
            </>
          )}
        </View>
      );
    }
    return null;
  };
  
  return (
    <View style={styles.container}>
      {loading && renderLoadingOverlay()}
      
      {__DEV__ && renderDebugInfo()}
      
      {step === 1 && renderSourceSelectionStep()}
      
      {step === 2 && importSource === 'bank' && renderConnectionSelectionStep()}
      
      {step === 3 && importSource === 'bank' && renderAccountSelectionStep()}
      
      {step === 3 && importSource === 'file' && fileData && fileFormat === 'csv' && (
        <ColumnMappingStep
          data={fileData.preview || []}
          headers={fileData.headers || []}
          onMappingComplete={handleColumnMapping}
          onCancel={() => setStep(1)}
        />
      )}
      
      {step === 4 && importSource === 'file' && fileFormat === 'csv' && renderCsvAccountSelectionStep()}
      
      {step === 4 && (
        <ImportConfirmationStep
          data={importSource === 'file' ? fileData?.preview || [] : []}
          onConfirm={handleImport}
          onCancel={() => setStep(importSource === 'file' ? 3 : 3)}
          importSource={importSource}
          bankName={selectedConnection?.institutionName}
          accountId={csvAccountSelection || selectedAccount}
          fileFormat={fileFormat}
        />
      )}
      
      {step === 5 && (
        <ImportConfirmationStep
          data={importSource === 'file' ? fileData?.preview || [] : []}
          onConfirm={handleImport}
          onCancel={() => setStep(importSource === 'file' ? 4 : 3)}
          importSource={importSource}
          bankName={selectedConnection?.institutionName}
          accountId={csvAccountSelection || selectedAccount}
          fileFormat={fileFormat}
        />
      )}
      
      {step === 6 && (
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
  },
  // Debug styles
  debugContainer: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }
});

export default ImportWizard;