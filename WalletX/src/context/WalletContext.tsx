// ─── Wallet Context ───────────────────────────────────────────────────────────
// Manages transactions list, balance, and related operations.

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import {
  subscribeToTransactions,
  addTransaction as addTx,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  subscribeToWallets,
  createWallet as createWalletDoc,
  updateWallet as updateWalletDoc,
  deleteWallet as deleteWalletDoc,
  migrateLegacyTransactionsToDefaultWallet,
} from "../services/firestore.ts";
import type {
  WalletState,
  WalletAction,
  WalletContextType,
  NewTransactionData,
  Transaction,
  NewWalletData,
  Wallet,
} from "../types";

// ── State shape ───────────────────────────────────────────────────────────────
const initialState: WalletState = {
  transactions: [], // All transactions for the current user
  wallets: [],
  selectedWalletId: null,
  loading: true,
  error: null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload, loading: false };
    case "SET_WALLETS":
      return { ...state, wallets: action.payload };
    case "SET_SELECTED_WALLET":
      return { ...state, selectedWalletId: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_LOADING":
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
  const migrationInFlight = useRef(false);

  // Subscribe to real-time transactions when user is logged in
  useEffect(() => {
    if (!user) {
      dispatch({ type: "SET_TRANSACTIONS", payload: [] });
      dispatch({ type: "SET_WALLETS", payload: [] });
      dispatch({ type: "SET_SELECTED_WALLET", payload: null });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    const unsubWallets = subscribeToWallets(
      user.uid,
      async (wallets: Wallet[]) => {
        dispatch({ type: "SET_WALLETS", payload: wallets });

        if (wallets.length === 0 && !migrationInFlight.current) {
          migrationInFlight.current = true;
          try {
            const newWalletId = await migrateLegacyTransactionsToDefaultWallet(
              user.uid,
            );
            dispatch({ type: "SET_SELECTED_WALLET", payload: newWalletId });
          } catch (e: any) {
            dispatch({ type: "SET_ERROR", payload: e.message ?? String(e) });
          } finally {
            migrationInFlight.current = false;
          }
        }
      },
    );

    return () => {
      unsubWallets();
    };
  }, [user]);

  useEffect(() => {
    if (state.wallets.length === 0) return;
    const hasSelected = state.wallets.some(
      (wallet) => wallet.id === state.selectedWalletId,
    );
    if (!hasSelected) {
      dispatch({ type: "SET_SELECTED_WALLET", payload: state.wallets[0].id });
    }
  }, [state.selectedWalletId, state.wallets]);

  useEffect(() => {
    if (!user || !state.selectedWalletId) {
      dispatch({ type: "SET_TRANSACTIONS", payload: [] });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    const unsubTx = subscribeToTransactions(
      user.uid,
      state.selectedWalletId,
      (txs: Transaction[]) => {
        dispatch({ type: "SET_TRANSACTIONS", payload: txs });
      },
    );

    return () => {
      unsubTx();
    };
  }, [user, state.selectedWalletId]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Add a new transaction and update balance atomically via Firestore */
  const addTransaction = useCallback(
    async (txData: NewTransactionData) => {
      if (!user) return;
      if (!state.selectedWalletId) {
        throw new Error("Select a wallet before adding a transaction.");
      }
      try {
        await addTx(user.uid, state.selectedWalletId, txData);
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        throw e;
      }
    },
    [user, state.selectedWalletId],
  );

  /** Delete a transaction and reverse balance effect */
  const deleteTransaction = useCallback(
    async (txId: string, txData: Pick<Transaction, "type" | "amount">) => {
      if (!user) return;
      if (!state.selectedWalletId) {
        throw new Error("Select a wallet before deleting a transaction.");
      }
      try {
        await deleteTx(txId, txData, user.uid, state.selectedWalletId);
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        throw e;
      }
    },
    [user, state.selectedWalletId],
  );

  /** Update a transaction and adjust balance based on changes */
  const updateTransaction = useCallback(
    async (
      txId: string,
      txData: NewTransactionData,
      original: Pick<Transaction, "type" | "amount">,
    ) => {
      if (!user) return;
      if (!state.selectedWalletId) {
        throw new Error("Select a wallet before updating a transaction.");
      }
      try {
        await updateTx(
          txId,
          txData,
          original,
          user.uid,
          state.selectedWalletId,
        );
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        throw e;
      }
    },
    [user, state.selectedWalletId],
  );

  const createWallet = useCallback(
    async (data: NewWalletData) => {
      if (!user) return;
      try {
        const walletId = await createWalletDoc(user.uid, data);
        dispatch({ type: "SET_SELECTED_WALLET", payload: walletId });
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        throw e;
      }
    },
    [user],
  );

  const updateWallet = useCallback(
    async (walletId: string, data: NewWalletData, original: number) => {
      if (!user) return;
      try {
        await updateWalletDoc(user.uid, walletId, data, original);
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        throw e;
      }
    },
    [user],
  );

  const deleteWallet = useCallback(
    async (walletId: string) => {
      if (!user) return;
      try {
        await deleteWalletDoc(user.uid, walletId);
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        throw e;
      }
    },
    [user],
  );

  // ── Derived data ─────────────────────────────────────────────────────────────

  /** Last 5 transactions for the Home screen */
  const recentTransactions = state.transactions.slice(0, 5);

  /** Total income (all time) */
  const totalIncome = state.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  /** Total expenses (all time) */
  const totalExpenses = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const selectedWallet =
    state.wallets.find((wallet) => wallet.id === state.selectedWalletId) ??
    null;
  const selectedWalletIndex = Math.max(
    0,
    state.wallets.findIndex((wallet) => wallet.id === state.selectedWalletId),
  );

  const selectWallet = useCallback((walletId: string) => {
    dispatch({ type: "SET_SELECTED_WALLET", payload: walletId });
  }, []);

  const value: WalletContextType = {
    ...state,
    selectedWallet,
    selectedWalletIndex,
    recentTransactions,
    totalIncome,
    totalExpenses,
    selectWallet,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    createWallet,
    updateWallet,
    deleteWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

/** Hook to access wallet state from any component */
export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
