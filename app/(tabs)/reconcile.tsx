import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import { Account } from '@/types/account';
import { ReconciliationSession } from '@/types/reconciliation';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { getReconciliationSummary } from '@/utils/reconciliationUtils';
import { CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react-native';
import ReconciliationWizard from '@/components/reconciliation/ReconciliationWizard';
import ReconciliationHistory from '@/components/reconciliation/ReconciliationHistory';

export default function ReconcileScreen() {
  const { state } = useAppContext();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showReconciliationWizard, setShowReconciliationWizard] = useState(false);
  const [showReconciliationHistory, setShowReconciliationHistory] = useState(false);
  
  // Filter out archived accounts
  const activeAccounts = state.accounts.filter(account => !account.isArchived);
  
  // Get reconciliation summary for each account
  const accountsWithSummary = activeAccounts.map(account => {
    const summary = getReconciliationSummary(
      account,
      state.transactions,
      state.reconciliationSessions
    );
    
    return {
      ...account,
      summary
    };
  });
  
  // Handle account selection for reconciliation
  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setShowReconciliationWizard(true);
  };
  
  // Handle viewing reconciliation history
  const handleViewHistory = (account: Account) => {
    setSelectedAccount(account);
    setShowReconciliationHistory(true);
  };
  
  // Close reconciliation wizard
  const handleCloseWizard = () => {
    setShowReconciliationWizard(false);
  };
  
  // Close reconciliation history
  const handleCloseHistory = () => {
    setShowReconciliationHistory(false);
  };
  
  // Render an account item
  const renderAccountItem = ({ item }: { item: Account & { summary: any } }) => {
    const { summary } = item;
    
    // Determine reconciliation status
    let statusIcon = null;
    let statusText = '';
    let statusColor = '';
    
    if (summary.lastReconciled) {
      const daysSince = summary.daysSinceLastReconciliation || 0;
      
      if (daysSince <= 30) {
        statusIcon = <CheckCircle2 size={18} color="#34C759" />;
        statusText = `Reconciled ${daysSince} days ago`;
        statusColor = '#34C759';
      } else if (daysSince <= 60) {
        statusIcon = <Clock size={18} color="#FF9500" />;
        statusText = `Reconciled ${daysSince} days ago`;
        statusColor = '#FF9500';
      } else {
        statusIcon = <AlertCircle size={18} color="#FF3B30" />;
        statusText = `Reconciled ${daysSince} days ago`;
        statusColor = '#FF3B30';
      }
    } else {
      statusIcon = <AlertCircle size={18} color="#FF3B30" />;
      statusText = 'Never reconciled';
      statusColor = '#FF3B30';
    }
    
    return (
      <View style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={[styles.accountIcon, { backgroundColor: item.color }]}>
            <Text style={styles.accountIconText}>{item.name.charAt(0)}</Text>
          </View>
          
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountType}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
          </View>
          
          <Text style={styles.accountBalance}>{formatCurrency(item.balance)}</Text>
        </View>
        
        <View style={styles.reconcileStatus}>
          <View style={styles.statusContainer}>
            {statusIcon}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          
          <View style={styles.transactionStatus}>
            <Text style={styles.transactionStatusText}>
              {summary.unreconciledTransactionCount} unreconciled transactions
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAccountSelect(item)}
          >
            <Text style={styles.actionButtonText}>Reconcile Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleViewHistory(item)}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render the header with information about reconciliation
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Account Reconciliation</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What is reconciliation?</Text>
        <Text style={styles.infoText}>
          Reconciliation is the process of comparing your recorded transactions with your bank statement
          to ensure they match. Regular reconciliation helps you catch errors and maintain accurate financial records.
        </Text>
      </View>
      
      <Text style={styles.sectionTitle}>Your Accounts</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <FlatList
        data={accountsWithSummary}
        keyExtractor={(item) => item.id}
        renderItem={renderAccountItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Accounts Found</Text>
            <Text style={styles.emptyStateText}>
              Add an account to start reconciling your transactions.
            </Text>
          </View>
        }
      />
      
      {/* Reconciliation Wizard Modal */}
      <Modal
        visible={showReconciliationWizard && selectedAccount !== null}
        animationType="slide"
        onRequestClose={handleCloseWizard}
      >
        {selectedAccount && (
          <ReconciliationWizard
            account={selectedAccount}
            onClose={handleCloseWizard}
          />
        )}
      </Modal>
      
      {/* Reconciliation History Modal */}
      <Modal
        visible={showReconciliationHistory && selectedAccount !== null}
        animationType="slide"
        onRequestClose={handleCloseHistory}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseHistory}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Reconciliation History</Text>
            
            <View style={styles.placeholder} />
          </View>
          
          {selectedAccount && (
            <ReconciliationHistory
              accountId={selectedAccount.id}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  infoBox: {
    backgroundColor: '#E5F1FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0056B3',
  },
  infoText: {
    fontSize: 14,
    color: '#0056B3',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: '#8E8E93',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reconcileStatus: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionStatusText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 50,
  },
});