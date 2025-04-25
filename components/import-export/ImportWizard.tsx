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
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
import { ThemedText, ThemedContainer, ThemedButton } from '@/components/themed';

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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
    <ThemedContainer>
      <ThemedText variant="title" style={styles.stepTitle} monospace={true}>
        Import Transactions
      </ThemedText>
      <ThemedText style={styles.stepDescription}>
        Select a source for importing transactions
      </ThemedText>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleSourceSelect('file')}
        >
          <Ionicons name="document-outline" size={36} color={theme.colors.primary} />
          <ThemedText style={styles.optionLabel}>Import from file</ThemedText>
          <ThemedText variant="caption">
            CSV, OFX, or QFX files
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleSourceSelect('bank')}
        >
          <Ionicons name="business-outline" size={36} color={theme.colors.primary} />
          <ThemedText style={styles.optionLabel}>Connect to bank</ThemedText>
          <ThemedText variant="caption">
            Directly import from your bank
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedContainer>
  );
  
  // Render bank connection selection step
  const renderConnectionSelectionStep = () => (
    <ThemedContainer>
      <ThemedText variant="title" style={styles.stepTitle} monospace={true}>
        Select Bank Connection
      </ThemedText>
      
      {bankConnections.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            No bank connections found. Add a connection first.
          </ThemedText>
          <ThemedButton 
            mode="contained"
            onPress={() => {/* Navigate to add connection screen */}}
          >
            Add Bank Connection
          </ThemedButton>
        </View>
      ) : (
        <FlatList
          data={bankConnections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => handleConnectionSelect(item)}
            >
              <ThemedText style={styles.listItemTitle}>{item.institutionName}</ThemedText>
              <ThemedText style={styles.listItemSubtitle}>
                {item.connectedAccountIds.length} {item.connectedAccountIds.length === 1 ? 'account' : 'accounts'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        />
      )}
      
      <View style={styles.buttonsContainer}>
        <ThemedButton onPress={() => setStep(1)}>
          Back
        </ThemedButton>
      </View>
    </ThemedContainer>
  );
  
  // Render account selection step
  const renderAccountSelectionStep = () => {
    if (!selectedConnection) return null;
    
    return (
      <ThemedContainer>
        <ThemedText variant="title" style={styles.stepTitle} monospace={true}>
          Select Account
        </ThemedText>
        <ThemedText style={styles.stepDescription}>
          Choose which account to import transactions from
        </ThemedText>
        
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
                <ThemedText style={styles.accountName}>
                  {account ? account.name : `Account ${item.substring(0, 8)}`}
                </ThemedText>
                {account && (
                  <ThemedText style={styles.accountBalance}>
                    Balance: ${account.balance.toFixed(2)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.accountsList}
        />
        
        <View style={styles.buttonsContainer}>
          <ThemedButton onPress={() => setStep(2)}>
            Back
          </ThemedButton>
        </View>
      </ThemedContainer>
    );
  };

  // Render account selection step for CSV
  const renderCsvAccountSelectionStep = () => (
    <ThemedContainer>
      <ThemedText variant="title" style={styles.stepTitle} monospace={true}>
        Select Account
      </ThemedText>
      <ThemedText style={styles.stepDescription}>
        Choose which account to import these transactions into
      </ThemedText>
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
            <ThemedText style={styles.accountName}>{item.name}</ThemedText>
            <ThemedText style={styles.accountBalance}>Balance: ${item.balance.toFixed(2)}</ThemedText>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.accountsList}
      />
      <View style={styles.buttonsContainer}>
        <ThemedButton onPress={() => setStep(3)}>
          Back
        </ThemedButton>
      </View>
    </ThemedContainer>
  );
  
  // Render loading overlay
  const renderLoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    </View>
  );
  
  // Debug display for troubleshooting (only in development)
  const renderDebugInfo = () => {
    if (__DEV__) {
      return (
        <View style={styles.debugContainer}>
          <ThemedText style={styles.debugTitle}>Debug Info:</ThemedText>
          <ThemedText style={styles.debugText}>Current step: {step}</ThemedText>
          <ThemedText style={styles.debugText}>Import source: {importSource}</ThemedText>
          <ThemedText style={styles.debugText}>File format: {fileFormat}</ThemedText>
          <ThemedText style={styles.debugText}>Has file data: {fileData ? 'Yes' : 'No'}</ThemedText>
          {fileData && (
            <>
              <ThemedText style={styles.debugText}>Headers: {fileData.headers?.length || 0}</ThemedText>
              <ThemedText style={styles.debugText}>Preview rows: {fileData.preview?.length || 0}</ThemedText>
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
          headers={fileData.headers || []}
          data={fileData.preview || []}
          onMappingComplete={handleColumnMapping}
          onCancel={() => setStep(1)}
        />
      )}
      
      {step === 4 && importSource === 'file' && fileFormat === 'csv' && renderCsvAccountSelectionStep()}
      
      {step === 4 && (
        <ImportConfirmationStep
          data={fileData?.preview || []}
          onConfirm={handleImport}
          onCancel={() => setStep(3)}
          importSource={importSource}
          fileFormat={fileFormat}
          accountId={selectedAccount || csvAccountSelection || ''}
        />
      )}
      
      {step === 5 && importStats && (
        <ImportSuccessStep
          stats={importStats}
          importSource={importSource}
          fileFormat={fileFormat}
        />
      )}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  optionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    width: '45%',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemTitle: {
    flex: 1,
    fontWeight: '600',
  },
  listItemSubtitle: {
    marginRight: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  debugContainer: {
    margin: 16,
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
  },
  debugTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  debugText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
  },
  accountsList: {
    marginTop: 8,
  },
  accountItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 14,
    color: theme.colors.text,
  },
});

export default ImportWizard;