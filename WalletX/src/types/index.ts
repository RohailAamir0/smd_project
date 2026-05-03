// ─── WalletX — Shared Types ───────────────────────────────────────────────────

import type { User } from "firebase/auth";

// ── Firestore helpers ─────────────────────────────────────────────────────────

/** Duck-typed Firestore Timestamp (has .toDate()) */
export interface FirestoreTimestamp {
  toDate(): Date;
}

export type DateLike = Date | FirestoreTimestamp;

// ── Domain models ─────────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: DateLike;
  createdAt?: DateLike;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt?: DateLike;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  type: TransactionType;
}

// ── Auth Context ───────────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
}

// ── Wallet Context ─────────────────────────────────────────────────────────────

export interface NewTransactionData {
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: Date;
}

export interface WalletState {
  transactions: Transaction[];
  balance: number;
  loading: boolean;
  error: string | null;
}

export type WalletAction =
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_BALANCE"; payload: number }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

export interface WalletContextType extends WalletState {
  recentTransactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  addTransaction: (data: NewTransactionData) => Promise<void>;
  updateTransaction: (
    txId: string,
    data: NewTransactionData,
    original: Pick<Transaction, "type" | "amount">,
  ) => Promise<void>;
  deleteTransaction: (
    txId: string,
    txData: Pick<Transaction, "type" | "amount">,
  ) => Promise<void>;
}

// ── Navigation ────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  AddTransaction:
    | { type?: TransactionType; transaction?: Transaction }
    | undefined;
  EditProfile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Statistics: undefined;
  Profile: undefined;
};
