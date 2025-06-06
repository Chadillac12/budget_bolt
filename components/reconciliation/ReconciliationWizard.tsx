import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { Account } from '@/types/account';
import { Transaction } from '@/types/transaction';
import { ReconciliationSession, ReconciliationStatement } from '@/types/reconciliation';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { 
  calculateActualBalance, 
  calculateDifference,
  getTransactionsForReconciliation,
  batchUpdateTransactionClearedStatus,
  completeReconciliation
} from '@/utils/reconciliationUtils';
import { ArrowLeft, ArrowRight, Check, X, AlertCircle, CheckCircle } from 'lucide-react-native';
import TransactionItem from '@/components/transactions/TransactionItem';
import { v4 as uuidv4 } from 'uuid';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

// Steps in the reconciliation process
type ReconciliationStep = 
  | 'start'
  | 'statement-info'
  | 'transaction-matching'
  | 'verification'
  | 'complete';

interface ReconciliationWizardProps {
  account: Account;
  onClose: () => void;
}

export default function ReconciliationWizard({ account, onClose }: ReconciliationWizardProps) {
  const { state, dispatch } = useAppContext();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [currentStep, setCurrentStep] = useState<ReconciliationStep>('start');
  
  // Statement information
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [endingBalance, setEndingBalance] = useState<number>(0);
  
  // Transaction matching
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  
  // Session tracking
  const [session, setSession] = useState<ReconciliationSession | null>(null);
  const [statement, setStatement] = useState<ReconciliationStatement | null>(null);
  
  // Calculated values
  const [actualBalance, setActualBalance] = useState<number>(0);
  const [difference, setDifference] = useState<number>(0);
  
  // Initialize the reconciliation session
  useEffect(() => {
    if (currentStep === 'start') {
      // Set default starting balance from account
      setStartingBalance(account.balance);
      
      // Set default date range to current month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setStartDate(firstDayOfMonth);
      setEndDate(lastDayOfMonth);
    }
  }, [account, currentStep]);
  
  // Update transactions when date range changes
  useEffect(() => {
    if (currentStep === 'transaction-matching') {
      const accountTransactions = getTransactionsForReconciliation(
        state.transactions,
        account.id,
        startDate,
        endDate
      );
      
      setTransactions(accountTransactions);
      
      // Pre-select already cleared transactions
      const clearedIds = accountTransactions
        .filter(tx => tx.isCleared)
        .map(tx => tx.id);
      
      setSelectedTransactionIds(clearedIds);
    }
  }, [state.transactions, account.id, startDate, endDate, currentStep]);
  
  // Calculate actual balance and difference when selected transactions change
  useEffect(() => {
    if (currentStep === 'transaction-matching' || currentStep === 'verification') {
      const selectedTransactions = transactions.filter(tx => 
        selectedTransactionIds.includes(tx.id)
      );
      
      const calculatedBalance = calculateActualBalance(startingBalance, selectedTransactions);
      setActualBalance(calculatedBalance);
      
      const calculatedDifference = calculateDifference(endingBalance, calculatedBalance);
      setDifference(calculatedDifference);
    }
  }, [selectedTransactionIds, transactions, startingBalance, endingBalance, currentStep]);
  
  // Create session and statement when moving to transaction matching
  useEffect(() => {
    if (currentStep === 'transaction-matching' && !session) {
      // Create a new reconciliation statement
      const newStatement: ReconciliationStatement = {
        id: uuidv4(),
        accountId: account.id,
        startDate,
        endDate,
        startingBalance,
        endingBalance,
        statementDate: new Date(),
      };
      
      // Create a new reconciliation session
      const newSession: ReconciliationSession = {
        id: uuidv4(),
        accountId: account.id,
        statementId: newStatement.id,
        status: 'in-progress',
        startDate: new Date(),
        startingBalance,
        endingBalance,
        clearedTransactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setStatement(newStatement);
      setSession(newSession);
      
      // Save to store
      dispatch({
        type: 'ADD_RECONCILIATION_STATEMENT',
        payload: newStatement,
      });
      
      dispatch({
        type: 'ADD_RECONCILIATION_SESSION',
        payload: newSession,
      });
    }
  }, [currentStep, account.id, startDate, endDate, startingBalance, endingBalance, session, dispatch]);
  
  // Handle transaction selection
  const toggleTransactionSelection = (transaction: Transaction) => {
    setSelectedTransactionIds(prevSelected => {
      if (prevSelected.includes(transaction.id)) {
        return prevSelected.filter(id => id !== transaction.id);
      } else {
        return [...prevSelected, transaction.id];
      }
    });
  };
  
  // Handle navigation between steps
  const goToNextStep = () => {
    switch (currentStep) {
      case 'start':
        setCurrentStep('statement-info');
        break;
      case 'statement-info':
        if (validateStatementInfo()) {
          setCurrentStep('transaction-matching');
        }
        break;
      case 'transaction-matching':
        setCurrentStep('verification');
        break;
      case 'verification':
        completeReconciliationProcess();
        setCurrentStep('complete');
        break;
      case 'complete':
        onClose();
        break;
    }
  };
  
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'statement-info':
        setCurrentStep('start');
        break;
      case 'transaction-matching':
        setCurrentStep('statement-info');
        break;
      case 'verification':
        setCurrentStep('transaction-matching');
        break;
      default:
        // Do nothing for other steps
        break;
    }
  };
  
  // Validation functions
  const validateStatementInfo = () => {
    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date.');
      return false;
    }
    
    if (isNaN(startingBalance) || isNaN(endingBalance)) {
      Alert.alert('Invalid Balance', 'Please enter valid numbers for starting and ending balances.');
      return false;
    }
    
    return true;
  };
  
  // Complete the reconciliation process
  const completeReconciliationProcess = () => {
    if (!session) return;
    
    // Update transactions to mark them as cleared and reconciled
    const updatedTransactions = batchUpdateTransactionClearedStatus(
      transactions,
      selectedTransactionIds,
      true
    );
    
    // Update the store with batch transaction updates
    dispatch({
      type: 'BATCH_UPDATE_TRANSACTIONS',
      payload: updatedTransactions,
    });
    
    // Complete the reconciliation session
    const { session: updatedSession, account: updatedAccount } = completeReconciliation(
      session,
      account,
      selectedTransactionIds
    );
    
    // Update the store
    dispatch({
      type: 'UPDATE_RECONCILIATION_SESSION',
      payload: updatedSession,
    });
    
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: updatedAccount,
    });
    
    // Update local state
    setSession(updatedSession);
  };
  
  // Render different steps of the reconciliation process
  const renderStepContent = () => {
    switch (currentStep) {
      case 'start':
        return renderStartStep();
      case 'statement-info':
        return renderStatementInfoStep();
      case 'transaction-matching':
        return renderTransactionMatchingStep();
      case 'verification':
        return renderVerificationStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };
  
  // Step 1: Introduction and instructions
  const renderStartStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Account Reconciliation</Text>
      <Text style={styles.accountName}>{account.name}</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Reconciliation helps you verify that your recorded transactions match your bank statement.
          This process will guide you through comparing your account with your bank statement.
        </Text>
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>Before you begin:</Text>
        <Text style={styles.instructionText}>1. Have your bank statement ready</Text>
        <Text style={styles.instructionText}>2. Note the statement's start and end dates</Text>
        <Text style={styles.instructionText}>3. Note the opening and closing balances</Text>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Current Account Balance:</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(account.balance)}</Text>
      </View>
    </View>
  );
  
  // Step 2: Enter statement information
  const renderStatementInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Statement Information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Statement Period</Text>
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity style={styles.dateInput}>
            <Text>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateRangeSeparator}>to</Text>
          <TouchableOpacity style={styles.dateInput}>
            <Text>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Starting Balance</Text>
        <TouchableOpacity style={styles.balanceInput}>
          <Text>{formatCurrency(startingBalance)}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Ending Balance</Text>
        <TouchableOpacity style={styles.balanceInput}>
          <Text>{formatCurrency(endingBalance)}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Enter the information exactly as it appears on your bank statement.
          This will be used to verify your transactions.
        </Text>
      </View>
    </View>
  );
  
  // Step 3: Match transactions
  const renderTransactionMatchingStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Match Transactions</Text>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Statement Period:</Text>
          <Text style={styles.summaryValue}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Starting Balance:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(startingBalance)}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ending Balance:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(endingBalance)}</Text>
        </View>
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          Select all transactions that appear on your bank statement.
          Transactions that match should be marked as "cleared".
        </Text>
      </View>
      
      <View style={styles.transactionListContainer}>
        <Text style={styles.sectionTitle}>Transactions ({transactions.length})</Text>
        
        <ScrollView style={styles.transactionList}>
          {transactions.map(transaction => (
            <TouchableOpacity
              key={transaction.id}
              style={[
                styles.transactionItem,
                selectedTransactionIds.includes(transaction.id) && styles.selectedTransaction
              ]}
              onPress={() => toggleTransactionSelection(transaction)}
            >
              <View style={styles.checkboxContainer}>
                {selectedTransactionIds.includes(transaction.id) ? (
                  <Check size={18} color={theme.colors.success} />
                ) : (
                  <View style={styles.emptyCheckbox} />
                )}
              </View>
              
              <View style={styles.transactionDetails}>
                <TransactionItem 
                  transaction={transaction} 
                  onPress={() => toggleTransactionSelection(transaction)} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.balanceSummary}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Cleared Balance:</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(actualBalance)}</Text>
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Statement Balance:</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(endingBalance)}</Text>
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Difference:</Text>
          <Text style={[
            styles.balanceAmount,
            difference !== 0 ? styles.differenceMismatch : styles.differenceMatch
          ]}>
            {formatCurrency(Math.abs(difference))}
          </Text>
        </View>
      </View>
    </View>
  );
  
  // Step 4: Verify and complete
  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Verify Reconciliation</Text>
      
      <View style={styles.verificationContainer}>
        <View style={styles.verificationItem}>
          <Text style={styles.verificationLabel}>Statement Balance:</Text>
          <Text style={styles.verificationValue}>{formatCurrency(endingBalance)}</Text>
        </View>
        
        <View style={styles.verificationItem}>
          <Text style={styles.verificationLabel}>Cleared Balance:</Text>
          <Text style={styles.verificationValue}>{formatCurrency(actualBalance)}</Text>
        </View>
        
        <View style={styles.verificationItem}>
          <Text style={styles.verificationLabel}>Difference:</Text>
          <Text style={[
            styles.verificationValue,
            difference !== 0 ? styles.differenceMismatch : styles.differenceMatch
          ]}>
            {formatCurrency(Math.abs(difference))}
          </Text>
        </View>
      </View>
      
      {difference === 0 ? (
        <View style={styles.successContainer}>
          <CheckCircle size={48} color={theme.colors.success} />
          <Text style={styles.successText}>Your account is reconciled!</Text>
          <Text style={styles.successSubtext}>
            All cleared transactions match your bank statement.
          </Text>
        </View>
      ) : (
        <View style={styles.warningContainer}>
          <AlertCircle size={48} color={theme.colors.error} />
          <Text style={styles.warningText}>Reconciliation Difference</Text>
          <Text style={styles.warningSubtext}>
            There is a difference of {formatCurrency(Math.abs(difference))} between your records and the bank statement.
            You may want to review your transactions again before completing.
          </Text>
        </View>
      )}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Transactions Cleared:</Text>
        <Text style={styles.summaryValue}>{selectedTransactionIds.length}</Text>
      </View>
    </View>
  );
  
  // Step 5: Completion
  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Reconciliation Complete</Text>
      
      <View style={styles.successContainer}>
        <CheckCircle size={64} color={theme.colors.success} />
        <Text style={styles.successText}>Reconciliation Successful!</Text>
        <Text style={styles.successSubtext}>
          Your account has been reconciled successfully.
        </Text>
      </View>
      
      <View style={styles.completionSummary}>
        <View style={styles.completionItem}>
          <Text style={styles.completionLabel}>Account:</Text>
          <Text style={styles.completionValue}>{account.name}</Text>
        </View>
        
        <View style={styles.completionItem}>
          <Text style={styles.completionLabel}>Statement Period:</Text>
          <Text style={styles.completionValue}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </Text>
        </View>
        
        <View style={styles.completionItem}>
          <Text style={styles.completionLabel}>Transactions Cleared:</Text>
          <Text style={styles.completionValue}>{selectedTransactionIds.length}</Text>
        </View>
        
        <View style={styles.completionItem}>
          <Text style={styles.completionLabel}>Ending Balance:</Text>
          <Text style={styles.completionValue}>{formatCurrency(endingBalance)}</Text>
        </View>
        
        {difference !== 0 && (
          <View style={styles.completionItem}>
            <Text style={styles.completionLabel}>Difference:</Text>
            <Text style={[
              styles.completionValue,
              styles.differenceMismatch
            ]}>
              {formatCurrency(Math.abs(difference))}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
  
  // Navigation buttons
  const renderNavigation = () => (
    <View style={styles.navigationContainer}>
      {currentStep !== 'start' && currentStep !== 'complete' && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={goToPreviousStep}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.primaryButton,
          currentStep === 'verification' && difference !== 0 && styles.dangerButton
        ]}
        onPress={goToNextStep}
      >
        <Text style={[
          styles.buttonText,
          currentStep === 'verification' && difference !== 0 && styles.buttonDangerText
        ]}>
          {currentStep === 'complete' ? 'Done' : 
           currentStep === 'verification' ? (difference === 0 ? 'Complete' : 'Complete Anyway') : 
           'Next'}
        </Text>
        {currentStep !== 'complete' && (
          <ArrowRight size={18} color={theme.colors.onPrimary} />
        )}
      </TouchableOpacity>
      
      {currentStep === 'verification' && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={onClose}
        >
          <Text style={[styles.buttonText, styles.buttonDangerText]}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Progress indicator
  const renderProgressIndicator = () => {
    const steps = ['start', 'statement-info', 'transaction-matching', 'verification', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View 
            key={step}
            style={[
              styles.progressStep,
              index <= currentIndex && styles.progressStepActive,
              index === currentIndex && styles.progressStepCurrent
            ]}
          />
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderProgressIndicator()}
      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>
      {renderNavigation()}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: theme.colors.text,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  infoBox: {
    backgroundColor: theme.colors.primaryContainer,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    lineHeight: 20,
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  balanceContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: theme.colors.textSecondary,
  },
  balanceInput: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  transactionListContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  transactionList: {
    maxHeight: 300,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedTransaction: {
    backgroundColor: theme.colors.primaryContainer,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  emptyCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
  },
  transactionDetails: {
    flex: 1,
  },
  balanceSummary: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  differenceMismatch: {
    color: theme.colors.error,
  },
  differenceMatch: {
    color: theme.colors.success,
  },
  verificationContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verificationLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  verificationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningContainer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  completionSummary: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  completionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  completionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  navigationContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 16,
  },
  navButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.warning,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  buttonDangerText: {
    color: theme.colors.onError,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  progressStepActive: {
    backgroundColor: theme.colors.primary,
  },
  progressStepCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});