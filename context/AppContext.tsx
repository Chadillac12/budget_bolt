import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Account } from '@/types/account';
import { Transaction, TransactionCategory } from '@/types/transaction';
import { Budget, BudgetCategory } from '@/types/budget'; // Import BudgetCategory
import { Rule } from '@/types/rule'; // Import Rule type
import { Payee, PayeeCategory } from '@/types/payee'; // Import Payee types
import { ReconciliationSession, ReconciliationStatement } from '@/types/reconciliation'; // Import Reconciliation types
import { NetWorthDataPoint, NetWorthSnapshotSettings } from '@/types/netWorth'; // Import Net Worth types
import { SavedTrendAnalysis } from '@/types/trends'; // Import Trend Analysis types
import { ReportTemplate, SavedReport } from '@/types/reports'; // Import Report types
import { BankConnection, BankInstitution, BankSyncSession } from '@/types/bankConnection'; // Import Bank Connection types
import { SyncState, SyncConfig, StorageProviderAuth } from '@/types/sync'; // Import Sync types
import { storeData, getData } from '@/utils/storage';
import { setupSync } from '@/utils/syncUtils'; // Import sync setup function

// App state interface
interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: TransactionCategory[];
  budgets: Budget[];
  rules: Rule[]; // Added rules to the app state
  payees: Payee[]; // Added payees to the app state
  payeeCategories: PayeeCategory[]; // Added payee categories
  reconciliationSessions: ReconciliationSession[]; // Added reconciliation sessions
  reconciliationStatements: ReconciliationStatement[]; // Added reconciliation statements
  netWorthHistory: NetWorthDataPoint[]; // Net worth history data points
  netWorthSettings: NetWorthSnapshotSettings; // Settings for automatic net worth snapshots
  savedTrendAnalyses: SavedTrendAnalysis[]; // Saved trend analysis configurations
  reportTemplates: ReportTemplate[]; // Custom report templates
  savedReports: SavedReport[]; // Saved custom reports
  bankConnections: BankConnection[]; // Bank connections
  bankInstitutions: BankInstitution[]; // Bank institutions
  bankSyncSessions: BankSyncSession[]; // Bank sync sessions
  syncState: SyncState | null; // Sync state
  syncConfig: SyncConfig | null; // Sync configuration
  syncProviderAuth: StorageProviderAuth | null; // Sync provider authentication
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AppState = {
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  rules: [], // Initialize empty rules array
  payees: [], // Initialize empty payees array
  payeeCategories: [], // Initialize empty payee categories array
  reconciliationSessions: [], // Initialize empty reconciliation sessions array
  reconciliationStatements: [], // Initialize empty reconciliation statements array
  netWorthHistory: [], // Initialize empty net worth history array
  netWorthSettings: {
    frequency: 'monthly',
    enabled: true,
    dayOfMonth: 1, // Default to 1st day of month
  },
  savedTrendAnalyses: [], // Initialize empty saved trend analyses array
  reportTemplates: [], // Initialize empty report templates array
  savedReports: [], // Initialize empty saved reports array
  bankConnections: [], // Initialize empty bank connections array
  bankInstitutions: [], // Initialize empty bank institutions array
  bankSyncSessions: [], // Initialize empty bank sync sessions array
  syncState: null, // Initialize sync state as null
  syncConfig: null, // Initialize sync config as null
  syncProviderAuth: null, // Initialize sync provider auth as null
  isLoading: true,
  error: null,
};

// Action types
type AppAction =
  | { type: 'SET_INITIAL_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'BATCH_UPDATE_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_CATEGORY'; payload: TransactionCategory }
  | { type: 'UPDATE_CATEGORY'; payload: TransactionCategory }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_RULE'; payload: Rule }
  | { type: 'UPDATE_RULE'; payload: Rule }
  | { type: 'DELETE_RULE'; payload: string }
  | { type: 'REORDER_RULES'; payload: Rule[] }
  | { type: 'ADD_PAYEE'; payload: Payee }
  | { type: 'UPDATE_PAYEE'; payload: Payee }
  | { type: 'DELETE_PAYEE'; payload: string }
  | { type: 'ADD_PAYEE_CATEGORY'; payload: PayeeCategory }
  | { type: 'UPDATE_PAYEE_CATEGORY'; payload: PayeeCategory }
  | { type: 'DELETE_PAYEE_CATEGORY'; payload: string }
  | { type: 'ADD_RECONCILIATION_SESSION'; payload: ReconciliationSession }
  | { type: 'UPDATE_RECONCILIATION_SESSION'; payload: ReconciliationSession }
  | { type: 'DELETE_RECONCILIATION_SESSION'; payload: string }
  | { type: 'ADD_RECONCILIATION_STATEMENT'; payload: ReconciliationStatement }
  | { type: 'UPDATE_RECONCILIATION_STATEMENT'; payload: ReconciliationStatement }
  | { type: 'DELETE_RECONCILIATION_STATEMENT'; payload: string }
  | { type: 'ADD_NET_WORTH_SNAPSHOT'; payload: NetWorthDataPoint }
  | { type: 'DELETE_NET_WORTH_SNAPSHOT'; payload: string }
  | { type: 'UPDATE_NET_WORTH_SETTINGS'; payload: NetWorthSnapshotSettings }
  | { type: 'ADD_SAVED_TREND_ANALYSIS'; payload: SavedTrendAnalysis }
  | { type: 'UPDATE_SAVED_TREND_ANALYSIS'; payload: SavedTrendAnalysis }
  | { type: 'DELETE_SAVED_TREND_ANALYSIS'; payload: string }
  | { type: 'ADD_REPORT_TEMPLATE'; payload: ReportTemplate }
  | { type: 'UPDATE_REPORT_TEMPLATE'; payload: ReportTemplate }
  | { type: 'DELETE_REPORT_TEMPLATE'; payload: string }
  | { type: 'ADD_SAVED_REPORT'; payload: SavedReport }
  | { type: 'UPDATE_SAVED_REPORT'; payload: SavedReport }
  | { type: 'DELETE_SAVED_REPORT'; payload: string }
  | { type: 'ADD_BANK_CONNECTION'; payload: BankConnection }
  | { type: 'UPDATE_BANK_CONNECTION'; payload: BankConnection }
  | { type: 'DELETE_BANK_CONNECTION'; payload: string }
  | { type: 'SET_BANK_INSTITUTIONS'; payload: BankInstitution[] }
  | { type: 'ADD_BANK_SYNC_SESSION'; payload: BankSyncSession }
  | { type: 'SET_SYNC_STATE'; payload: SyncState }
  | { type: 'UPDATE_SYNC_STATE'; payload: Partial<SyncState> }
  | { type: 'SET_SYNC_CONFIG'; payload: SyncConfig }
  | { type: 'UPDATE_SYNC_CONFIG'; payload: Partial<SyncConfig> }
  | { type: 'SET_SYNC_PROVIDER_AUTH'; payload: StorageProviderAuth | null }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Storage keys
const STORAGE_KEYS = {
  ACCOUNTS: 'budget_tracker_accounts',
  TRANSACTIONS: 'budget_tracker_transactions',
  CATEGORIES: 'budget_tracker_categories',
  BUDGETS: 'budget_tracker_budgets',
  RULES: 'budget_tracker_rules',
  PAYEES: 'budget_tracker_payees',
  PAYEE_CATEGORIES: 'budget_tracker_payee_categories',
  RECONCILIATION_SESSIONS: 'budget_tracker_reconciliation_sessions',
  RECONCILIATION_STATEMENTS: 'budget_tracker_reconciliation_statements',
  NET_WORTH_HISTORY: 'budget_tracker_net_worth_history',
  NET_WORTH_SETTINGS: 'budget_tracker_net_worth_settings',
  SAVED_TREND_ANALYSES: 'budget_tracker_saved_trend_analyses',
  REPORT_TEMPLATES: 'budget_tracker_report_templates',
  SAVED_REPORTS: 'budget_tracker_saved_reports',
  BANK_CONNECTIONS: 'budget_tracker_bank_connections',
  BANK_INSTITUTIONS: 'budget_tracker_bank_institutions',
  BANK_SYNC_SESSIONS: 'budget_tracker_bank_sync_sessions',
  SYNC_STATE: 'budget_tracker_sync_state',
  SYNC_CONFIG: 'budget_tracker_sync_config',
  SYNC_PROVIDER_AUTH: 'budget_tracker_sync_provider_auth',
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
      
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
      };
      
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(account => 
          account.id === action.payload.id ? action.payload : account
        ),
      };
      
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(account => account.id !== action.payload),
      };
      
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
      
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(transaction => 
          transaction.id === action.payload.id ? action.payload : transaction
        ),
      };
      
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.payload),
      };
      
    case 'BATCH_UPDATE_TRANSACTIONS':
      return {
        ...state,
        transactions: state.transactions.map(transaction => {
          const updatedTransaction = action.payload.find(tx => tx.id === transaction.id);
          return updatedTransaction || transaction;
        }),
      };
      
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
      
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category => 
          category.id === action.payload.id ? action.payload : category
        ),
      };
      
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };
      
    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, action.payload],
      };
      
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(updatedBudget => {
          if (updatedBudget.id === action.payload.id) {
            // Calculate rollover for each category if rollover is enabled
            if (updatedBudget.rolloverSettings.enabled) {
              return {
                ...action.payload,
                categories: updatedBudget.categories.map(category => {
                  if (category.hasOwnProperty('categoryId')) { // Check if it's a BudgetCategory
                    const budgetCategory = category as BudgetCategory; // Type assertion
                    // Find corresponding category in the previous month's budget (assuming budgets are monthly)
                    const previousMonthBudget = state.budgets.find(b => {
                      // Basic check if budget is from the previous month (needs more robust date comparison)
                      return b.endDate < updatedBudget.startDate;
                    });
                    const previousMonthCategory = previousMonthBudget?.categories.find(c => (c as BudgetCategory).categoryId === budgetCategory.categoryId) as BudgetCategory | undefined;


                    // Calculate previous month's remaining amount
                    const previousMonthRemaining = previousMonthCategory ? previousMonthCategory.remaining : 0;
                    const rolloverAmount = Math.max(0, previousMonthRemaining); // Rollover can't be negative
                    
                    return {
                      ...budgetCategory,
                      rollover: {
                        amount: rolloverAmount,
                        fromPreviousMonth: true,
                      },
                    };
                  }
                  return category; // Don't calculate rollover for category groups
                }),
              };
            }
            return action.payload;
          }
          return updatedBudget;
        }),
      };
      
    case 'DELETE_BUDGET':
    return {
      ...state,
      budgets: state.budgets.filter(budget => budget.id !== action.payload),
    };
    
  case 'ADD_RULE':
    return {
      ...state,
      rules: [...state.rules, action.payload],
    };
    
  case 'UPDATE_RULE':
    return {
      ...state,
      rules: state.rules.map(rule =>
        rule.id === action.payload.id ? action.payload : rule
      ),
    };
    
  case 'DELETE_RULE':
    return {
      ...state,
      rules: state.rules.filter(rule => rule.id !== action.payload),
    };
    
  case 'REORDER_RULES':
    return {
      ...state,
      rules: action.payload,
    };
    
  case 'ADD_PAYEE':
    return {
      ...state,
      payees: [...state.payees, action.payload],
    };
    
  case 'UPDATE_PAYEE':
    return {
      ...state,
      payees: state.payees.map(payee =>
        payee.id === action.payload.id ? action.payload : payee
      ),
    };
    
  case 'DELETE_PAYEE':
    return {
      ...state,
      payees: state.payees.filter(payee => payee.id !== action.payload),
    };
    
  case 'ADD_PAYEE_CATEGORY':
    return {
      ...state,
      payeeCategories: [...state.payeeCategories, action.payload],
    };
    
  case 'UPDATE_PAYEE_CATEGORY':
    return {
      ...state,
      payeeCategories: state.payeeCategories.map(category =>
        category.id === action.payload.id ? action.payload : category
      ),
    };
    
  case 'DELETE_PAYEE_CATEGORY':
    return {
      ...state,
      payeeCategories: state.payeeCategories.filter(category => category.id !== action.payload),
    };
    
  case 'ADD_RECONCILIATION_SESSION':
    return {
      ...state,
      reconciliationSessions: [...state.reconciliationSessions, action.payload],
    };
    
  case 'UPDATE_RECONCILIATION_SESSION':
    return {
      ...state,
      reconciliationSessions: state.reconciliationSessions.map(session =>
        session.id === action.payload.id ? action.payload : session
      ),
    };
    
  case 'DELETE_RECONCILIATION_SESSION':
    return {
      ...state,
      reconciliationSessions: state.reconciliationSessions.filter(session => session.id !== action.payload),
    };
    
  case 'ADD_RECONCILIATION_STATEMENT':
    return {
      ...state,
      reconciliationStatements: [...state.reconciliationStatements, action.payload],
    };
    
  case 'UPDATE_RECONCILIATION_STATEMENT':
    return {
      ...state,
      reconciliationStatements: state.reconciliationStatements.map(statement =>
        statement.id === action.payload.id ? action.payload : statement
      ),
    };
    
  case 'DELETE_RECONCILIATION_STATEMENT':
    return {
      ...state,
      reconciliationStatements: state.reconciliationStatements.filter(statement => statement.id !== action.payload),
    };
    
  case 'ADD_NET_WORTH_SNAPSHOT':
    return {
      ...state,
      netWorthHistory: [...state.netWorthHistory, action.payload],
    };
    
  case 'DELETE_NET_WORTH_SNAPSHOT':
    return {
      ...state,
      netWorthHistory: state.netWorthHistory.filter(snapshot => snapshot.id !== action.payload),
    };
    
  case 'UPDATE_NET_WORTH_SETTINGS':
    return {
      ...state,
      netWorthSettings: action.payload,
    };
    
  case 'ADD_SAVED_TREND_ANALYSIS':
    return {
      ...state,
      savedTrendAnalyses: [...state.savedTrendAnalyses, action.payload],
    };
    
  case 'UPDATE_SAVED_TREND_ANALYSIS':
    return {
      ...state,
      savedTrendAnalyses: state.savedTrendAnalyses.map(analysis =>
        analysis.id === action.payload.id ? action.payload : analysis
      ),
    };
    
  case 'DELETE_SAVED_TREND_ANALYSIS':
    return {
      ...state,
      savedTrendAnalyses: state.savedTrendAnalyses.filter(analysis => analysis.id !== action.payload),
    };
    
  case 'ADD_REPORT_TEMPLATE':
    return {
      ...state,
      reportTemplates: [...state.reportTemplates, action.payload],
    };
    
  case 'UPDATE_REPORT_TEMPLATE':
    return {
      ...state,
      reportTemplates: state.reportTemplates.map(template =>
        template.id === action.payload.id ? action.payload : template
      ),
    };
    
  case 'DELETE_REPORT_TEMPLATE':
    return {
      ...state,
      reportTemplates: state.reportTemplates.filter(template => template.id !== action.payload),
    };
    
  case 'ADD_SAVED_REPORT':
    return {
      ...state,
      savedReports: [...state.savedReports, action.payload],
    };
    
  case 'UPDATE_SAVED_REPORT':
    return {
      ...state,
      savedReports: state.savedReports.map(report =>
        report.id === action.payload.id ? action.payload : report
      ),
    };
    
  case 'DELETE_SAVED_REPORT':
    return {
      ...state,
      savedReports: state.savedReports.filter(report => report.id !== action.payload),
    };
    
  case 'ADD_BANK_CONNECTION':
    return {
      ...state,
      bankConnections: [...state.bankConnections, action.payload],
    };
    
  case 'UPDATE_BANK_CONNECTION':
    return {
      ...state,
      bankConnections: state.bankConnections.map(connection =>
        connection.id === action.payload.id ? action.payload : connection
      ),
    };
    
  case 'DELETE_BANK_CONNECTION':
    return {
      ...state,
      bankConnections: state.bankConnections.filter(connection => connection.id !== action.payload),
    };
    
  case 'SET_BANK_INSTITUTIONS':
    return {
      ...state,
      bankInstitutions: action.payload,
    };
    
  case 'ADD_BANK_SYNC_SESSION':
    return {
      ...state,
      bankSyncSessions: [...state.bankSyncSessions, action.payload],
    };
    
  case 'SET_SYNC_STATE':
    return {
      ...state,
      syncState: action.payload,
    };
    
  case 'UPDATE_SYNC_STATE':
    return {
      ...state,
      syncState: state.syncState ? { ...state.syncState, ...action.payload } : action.payload as SyncState,
    };
    
  case 'SET_SYNC_CONFIG':
    return {
      ...state,
      syncConfig: action.payload,
    };
    
  case 'UPDATE_SYNC_CONFIG':
    return {
      ...state,
      syncConfig: state.syncConfig ? { ...state.syncConfig, ...action.payload } : action.payload as SyncConfig,
    };
    
  case 'SET_SYNC_PROVIDER_AUTH':
    return {
      ...state,
      syncProviderAuth: action.payload,
    };
    
  case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
      
    default:
      return state;
  }
};

// Create context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data from storage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const accounts = await getData(STORAGE_KEYS.ACCOUNTS) || [];
        const transactions = await getData(STORAGE_KEYS.TRANSACTIONS) || [];
        const categories = await getData(STORAGE_KEYS.CATEGORIES) || [];
        const budgets = await getData(STORAGE_KEYS.BUDGETS) || [];
        const rules = await getData(STORAGE_KEYS.RULES) || [];
        const payees = await getData(STORAGE_KEYS.PAYEES) || [];
        const payeeCategories = await getData(STORAGE_KEYS.PAYEE_CATEGORIES) || [];
        const reconciliationSessions = await getData(STORAGE_KEYS.RECONCILIATION_SESSIONS) || [];
        const reconciliationStatements = await getData(STORAGE_KEYS.RECONCILIATION_STATEMENTS) || [];
        const netWorthHistory = await getData(STORAGE_KEYS.NET_WORTH_HISTORY) || [];
        const netWorthSettings = await getData(STORAGE_KEYS.NET_WORTH_SETTINGS) || {
          frequency: 'monthly',
          enabled: true,
          dayOfMonth: 1,
        };
        const savedTrendAnalyses = await getData(STORAGE_KEYS.SAVED_TREND_ANALYSES) || [];
        const reportTemplates = await getData(STORAGE_KEYS.REPORT_TEMPLATES) || [];
        const savedReports = await getData(STORAGE_KEYS.SAVED_REPORTS) || [];
        const bankConnections = await getData(STORAGE_KEYS.BANK_CONNECTIONS) || [];
        const bankInstitutions = await getData(STORAGE_KEYS.BANK_INSTITUTIONS) || [];
        const bankSyncSessions = await getData(STORAGE_KEYS.BANK_SYNC_SESSIONS) || [];
        const syncState = await getData(STORAGE_KEYS.SYNC_STATE) || null;
        const syncConfig = await getData(STORAGE_KEYS.SYNC_CONFIG) || null;
        const syncProviderAuth = await getData(STORAGE_KEYS.SYNC_PROVIDER_AUTH) || null;
        
        dispatch({
          type: 'SET_INITIAL_DATA',
          payload: {
            accounts,
            transactions,
            categories,
            budgets,
            rules,
            payees,
            payeeCategories,
            reconciliationSessions,
            reconciliationStatements,
            netWorthHistory,
            netWorthSettings,
            savedTrendAnalyses,
            reportTemplates,
            savedReports,
            bankConnections,
            bankInstitutions,
            bankSyncSessions,
            syncState,
            syncConfig,
            syncProviderAuth,
          },
        });
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to load data from storage' 
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadInitialData();
    
    // Initialize sync system
    const initSync = async () => {
      try {
        // Setup sync system and get a function to cancel scheduled syncs
        const cancelSync = await setupSync();
        
        // Return cleanup function to cancel scheduled syncs when component unmounts
        return () => {
          cancelSync();
        };
      } catch (error) {
        console.error('Failed to initialize sync system:', error);
      }
    };
    
    // Initialize sync and get cleanup function
    const syncCleanup = initSync();
    
    // Return cleanup function
    return () => {
      if (syncCleanup) {
        syncCleanup.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, []);

  // Save data to storage when state changes
  useEffect(() => {
    if (!state.isLoading) {
      storeData(STORAGE_KEYS.ACCOUNTS, state.accounts);
      storeData(STORAGE_KEYS.TRANSACTIONS, state.transactions);
      storeData(STORAGE_KEYS.CATEGORIES, state.categories);
      storeData(STORAGE_KEYS.BUDGETS, state.budgets);
      storeData(STORAGE_KEYS.RULES, state.rules);
      storeData(STORAGE_KEYS.PAYEES, state.payees);
      storeData(STORAGE_KEYS.PAYEE_CATEGORIES, state.payeeCategories);
      storeData(STORAGE_KEYS.RECONCILIATION_SESSIONS, state.reconciliationSessions);
      storeData(STORAGE_KEYS.RECONCILIATION_STATEMENTS, state.reconciliationStatements);
      storeData(STORAGE_KEYS.NET_WORTH_HISTORY, state.netWorthHistory);
      storeData(STORAGE_KEYS.NET_WORTH_SETTINGS, state.netWorthSettings);
      storeData(STORAGE_KEYS.SAVED_TREND_ANALYSES, state.savedTrendAnalyses);
      storeData(STORAGE_KEYS.REPORT_TEMPLATES, state.reportTemplates);
      storeData(STORAGE_KEYS.SAVED_REPORTS, state.savedReports);
      storeData(STORAGE_KEYS.BANK_CONNECTIONS, state.bankConnections);
      storeData(STORAGE_KEYS.BANK_INSTITUTIONS, state.bankInstitutions);
      storeData(STORAGE_KEYS.BANK_SYNC_SESSIONS, state.bankSyncSessions);
      
      // Only store sync state and config if they exist
      if (state.syncState) {
        storeData(STORAGE_KEYS.SYNC_STATE, state.syncState);
      }
      
      if (state.syncConfig) {
        storeData(STORAGE_KEYS.SYNC_CONFIG, state.syncConfig);
      }
      
      if (state.syncProviderAuth) {
        storeData(STORAGE_KEYS.SYNC_PROVIDER_AUTH, state.syncProviderAuth);
      }
    }
  }, [
    state.accounts,
    state.transactions,
    state.categories,
    state.budgets,
    state.rules,
    state.payees,
    state.payeeCategories,
    state.reconciliationSessions,
    state.reconciliationStatements,
    state.netWorthHistory,
    state.netWorthSettings,
    state.savedTrendAnalyses,
    state.reportTemplates,
    state.savedReports,
    state.bankConnections,
    state.bankInstitutions,
    state.bankSyncSessions,
    state.syncState,
    state.syncConfig,
    state.syncProviderAuth,
    state.isLoading
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};