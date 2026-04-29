// ─── Wallet Context ───────────────────────────────────────────────────────────
// Manages transactions list, balance, and related operations.

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import { useAuth }                   from './AuthContext';
import { subscribeToTransactions,
         addTransaction as addTx,
         deleteTransaction as deleteTx,
         subscribeToUser }           from '../services/firestore';
import type { WalletState, WalletAction, WalletContextType, NewTransactionData, Transaction } from '../types';

// ── State shape ───────────────────────────────────────────────────────────────
const initialState: WalletState = {
  transactions: [],   // All transactions for the current user
  balance:      0,    // Pulled from Firestore user doc (always accurate)
  loading:      true,
  error:        null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, loading: false };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Subscribe to real-time transactions when user is logged in
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_BALANCE', payload: 0 });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    // Real-time transactions listener
    const unsubTx = subscribeToTransactions(user.uid, (txs) => {
      dispatch({ type: 'SET_TRANSACTIONS', payload: txs });
    });

    // Real-time balance listener (from user doc — source of truth)
    const unsubUser = subscribeToUser(user.uid, (profile) => {
      dispatch({ type: 'SET_BALANCE', payload: profile.balance ?? 0 });
    });

    return () => {
      unsubTx();
      unsubUser();
    };
  }, [user]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Add a new transaction and update balance atomically via Firestore */
  const addTransaction = useCallback(async (txData: NewTransactionData) => {
    if (!user) return;
    try {
      await addTx(user.uid, txData);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      throw e;
    }
  }, [user]);

  /** Delete a transaction and reverse balance effect */
  const deleteTransaction = useCallback(async (txId: string, txData: Pick<Transaction, 'type' | 'amount'>) => {
    if (!user) return;
    try {
      await deleteTx(txId, txData, user.uid);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      throw e;
    }
  }, [user]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  /** Last 5 transactions for the Home screen */
  const recentTransactions = state.transactions.slice(0, 5);

  /** Total income (all time) */
  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  /** Total expenses (all time) */
  const totalExpenses = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const value: WalletContextType = {
    ...state,
    recentTransactions,
    totalIncome,
    totalExpenses,
    addTransaction,
    deleteTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/** Hook to access wallet state from any component */
export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
}
