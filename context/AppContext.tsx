import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Account } from '@/types/account';
import { Transaction, TransactionCategory } from '@/types/transaction';
import { Budget } from '@/types/budget';
import { storeData, getData } from '@/utils/storage';

// App state interface
interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: TransactionCategory[];
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AppState = {
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
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
  | { type: 'ADD_CATEGORY'; payload: TransactionCategory }
  | { type: 'UPDATE_CATEGORY'; payload: TransactionCategory }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Storage keys
const STORAGE_KEYS = {
  ACCOUNTS: 'budget_tracker_accounts',
  TRANSACTIONS: 'budget_tracker_transactions',
  CATEGORIES: 'budget_tracker_categories',
  BUDGETS: 'budget_tracker_budgets',
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
        budgets: state.budgets.map(budget => 
          budget.id === action.payload.id ? action.payload : budget
        ),
      };
      
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(budget => budget.id !== action.payload),
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
        
        dispatch({
          type: 'SET_INITIAL_DATA',
          payload: {
            accounts,
            transactions,
            categories,
            budgets,
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
  }, []);

  // Save data to storage when state changes
  useEffect(() => {
    if (!state.isLoading) {
      storeData(STORAGE_KEYS.ACCOUNTS, state.accounts);
      storeData(STORAGE_KEYS.TRANSACTIONS, state.transactions);
      storeData(STORAGE_KEYS.CATEGORIES, state.categories);
      storeData(STORAGE_KEYS.BUDGETS, state.budgets);
    }
  }, [
    state.accounts, 
    state.transactions, 
    state.categories, 
    state.budgets, 
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