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

export type UserRole = "member" | "admin";

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: DateLike;
  createdAt?: DateLike;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  balance: number;
  initialBalance: number;
  createdAt?: DateLike;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  balance: number;
  role: UserRole;
  emailVerified?: boolean;
  createdAt?: DateLike;
}

export interface AdminUserSummary {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean | null;
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
  isAdmin: boolean;
  isEmailVerified: boolean;
  needsProfileSetup: boolean;
}

// ── Wallet Context ─────────────────────────────────────────────────────────────

export interface NewTransactionData {
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: Date;
}

export interface NewWalletData {
  name: string;
  initialBalance: number;
}

export interface WalletState {
  transactions: Transaction[];
  wallets: Wallet[];
  selectedWalletId: string | null;
  loading: boolean;
  error: string | null;
}

export type WalletAction =
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_WALLETS"; payload: Wallet[] }
  | { type: "SET_SELECTED_WALLET"; payload: string | null }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

export interface WalletContextType extends WalletState {
  selectedWallet: Wallet | null;
  selectedWalletIndex: number;
  recentTransactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  selectWallet: (walletId: string) => void;
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
  createWallet: (data: NewWalletData) => Promise<void>;
  updateWallet: (
    walletId: string,
    data: NewWalletData,
    originalInitialBalance: number,
  ) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
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
  WalletEdit: { walletId?: string; mode?: "add" | "edit" } | undefined;
  WalletsList: undefined;
  EditProfile: undefined;
  AdminUsers: undefined;
  CompleteProfile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Statistics: undefined;
  Profile: undefined;
};
