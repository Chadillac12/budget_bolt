import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import types
import { ImportFileFormat } from '@/types/import';
type ImportSource = 'file' | 'bank';

interface ImportConfirmationStepProps {
  data: any[];
  onConfirm: () => void;
  onCancel: () => void;
  importSource?: ImportSource | null;
  bankName?: string;
  accountId?: string | null;
  fileFormat?: ImportFileFormat;
}

const ImportConfirmationStep: React.FC<ImportConfirmationStepProps> = ({
  data,
  onConfirm,
  onCancel,
  importSource = 'file',
  bankName,
  accountId,
  fileFormat = 'csv'
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Import</Text>
      
      {importSource === 'file' ? (
        <>
          <Text style={styles.subtitle}>
            {data.length} transactions ready to import
            {fileFormat !== 'csv' && ` from ${fileFormat.toUpperCase()} file`}
          </Text>

          {fileFormat === 'ofx' || fileFormat === 'qfx' ? (
            <>
              <View style={styles.fileInfoContainer}>
                <Ionicons name="document-text-outline" size={32} color="#2196F3" />
                <Text style={styles.fileInfoText}>
                  {fileFormat.toUpperCase()} file contains structured financial data that will be imported directly.
                </Text>
              </View>
              
              <View style={styles.bulletPoints}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.bulletText}>Transaction IDs will be used to prevent duplicates</Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.bulletText}>Dates and amounts will be preserved exactly</Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.bulletText}>Transactions will be automatically categorized</Text>
                </View>
              </View>
              
              <FlatList
                data={data.slice(0, 5)} // Show first 5 as preview
                renderItem={({ item }) => (
                  <View style={styles.item}>
                    <Text style={styles.itemDate}>{item.date}</Text>
                    <Text style={styles.itemPayee}>{item.payee}</Text>
                    <Text style={styles.itemAmount}>
                      {parseFloat(item.amount) > 0 ? '+' : ''}{item.amount}
                    </Text>
                  </View>
                )}
                keyExtractor={(item, index) => item.id || index.toString()}
                style={styles.list}
              />
            </>
          ) : (
            <FlatList
              data={data.slice(0, 5)} // Show first 5 as preview
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={styles.itemDate}>{item.date}</Text>
                  <Text style={styles.itemPayee}>{item.payee}</Text>
                  <Text style={styles.itemAmount}>
                    {item.amount > 0 ? '+' : ''}{item.amount}
                  </Text>
                </View>
              )}
              keyExtractor={(item, index) => item.id || index.toString()}
              style={styles.list}
            />
          )}
        </>
      ) : (
        <View style={styles.bankImportContainer}>
          <Ionicons name="wallet-outline" size={48} color="#2196F3" style={styles.bankIcon} />
          
          <Text style={styles.bankName}>
            {bankName || 'Bank Connection'}
          </Text>
          
          <Text style={styles.bankDescription}>
            You are about to import transactions from your bank account. This will:
          </Text>
          
          <View style={styles.bulletPoints}>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.bulletText}>Download recent transactions</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.bulletText}>Skip duplicate transactions</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.bulletText}>Automatically categorize based on rules</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]}
          onPress={onConfirm}
        >
          <Text style={styles.buttonText}>Confirm Import</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  fileInfoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0D47A1',
  },
  bankImportContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  bankIcon: {
    marginBottom: 20,
  },
  bankName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#212121',
  },
  bankDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
  },
  bulletPoints: {
    alignSelf: 'stretch',
    marginTop: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bulletText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  list: {
    flex: 1,
    marginBottom: 20
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  itemDate: {
    color: '#666',
    width: 80
  },
  itemPayee: {
    flex: 1
  },
  itemAmount: {
    width: 80,
    textAlign: 'right'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#e0e0e0'
  },
  confirmButton: {
    backgroundColor: '#007AFF'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ImportConfirmationStep;