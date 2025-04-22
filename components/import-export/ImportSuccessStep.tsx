import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Import types
import { ImportFileFormat } from '@/types/import';
type ImportSource = 'file' | 'bank';

// Import stats interface
interface ImportStats {
  added: number;
  updated: number;
  duplicates: number;
  errors: number;
}

interface ImportSuccessStepProps {
  stats?: ImportStats | null;
  importSource?: ImportSource | null;
  fileFormat?: ImportFileFormat;
}

const ImportSuccessStep: React.FC<ImportSuccessStepProps> = ({
  stats,
  importSource = 'file',
  fileFormat = 'csv'
}) => {
  const router = useRouter();
  
  const handleViewTransactions = () => {
    router.push('/transactions');
  };
  return (
    <View style={styles.container}>
      <CheckCircle size={48} color="#4CAF50" style={styles.icon} />
      <Text style={styles.title}>Import Successful!</Text>
      
      <Text style={styles.message}>
        Your transactions have been successfully imported.
      </Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.added}</Text>
            <Text style={styles.statLabel}>Added</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.updated}</Text>
            <Text style={styles.statLabel}>Updated</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.duplicates}</Text>
            <Text style={styles.statLabel}>Duplicates</Text>
          </View>
          
          {stats.errors > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.errorText]}>{stats.errors}</Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
          )}
        </View>
      )}
      
      <Text style={styles.sourceText}>
        Source: {importSource === 'file'
          ? (fileFormat === 'csv'
              ? 'CSV File'
              : `${fileFormat.toUpperCase()} File`)
          : 'Bank Connection'}
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleViewTransactions}
      >
        <Text style={styles.buttonText}>View Transactions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  errorText: {
    color: '#F44336',
  },
  sourceText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  icon: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50'
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ImportSuccessStep;