// ─── Firestore CRUD Helpers ───────────────────────────────────────────────────
// All database reads/writes go through this file.

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  updateDoc,
  writeBatch,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import type {
  UserProfile,
  UserRole,
  AdminUserSummary,
  Transaction,
  NewTransactionData,
  NewWalletData,
  Wallet,
} from "../types";

type UserProfileDoc = Omit<UserProfile, "role"> & { role?: UserRole };

function normalizeUserProfile(data: UserProfileDoc): UserProfile {
  return {
    ...data,
    role: data.role ?? "member",
  };
}

// ── Collection references ─────────────────────────────────────────────────────
const legacyTransactionsCol = () => collection(db, "transactions");
const walletsCol = (userId: string) =>
  collection(db, "users", userId, "wallets");
const walletDoc = (userId: string, walletId: string) =>
  doc(db, "users", userId, "wallets", walletId);
const walletTransactionsCol = (userId: string, walletId: string) =>
  collection(db, "users", userId, "wallets", walletId, "transactions");

// ─── User Document ────────────────────────────────────────────────────────────

/**
 * Create a new user document (called once on registration).
 *
 * @param {string} uid
 * @param {Omit<UserProfile, 'id' | 'createdAt'>} data
 */
export async function createUserDoc(
  uid: string,
  data: Omit<UserProfile, "id" | "createdAt" | "role"> & { role?: UserRole },
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
    role: data.role ?? "member",
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch a user document by uid.
 *
 * @param {string} uid
 * @returns {Promise<UserProfile | null>}
 */
export async function getUserDoc(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists()
    ? normalizeUserProfile({ id: snap.id, ...snap.data() } as UserProfileDoc)
    : null;
}

/**
 * Update fields on a user document.
 */
export async function updateUserDoc(
  uid: string,
  data: Partial<Omit<UserProfile, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

/**
 * Real-time listener for the user document.
 *
 * @param {string} uid
 * @param {function} callback - receives the user data object
 * @returns {function} unsubscribe
 */
export function subscribeToUser(
  uid: string,
  callback: (user: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) {
      callback(
        normalizeUserProfile({ id: snap.id, ...snap.data() } as UserProfileDoc),
      );
    } else {
      callback(null);
    }
  });
}

// ─── Admin Helpers (App-only) ───────────────────────────────────────────────

export async function adminListUsers(): Promise<AdminUserSummary[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as UserProfileDoc;
    return {
      uid: docSnap.id,
      name: data.name ?? "",
      email: data.email ?? "",
      role: data.role ?? "member",
      emailVerified:
        typeof data.emailVerified === "boolean" ? data.emailVerified : null,
    };
  });
}

export async function adminSetUserRole(
  uid: string,
  role: UserRole,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function adminDeleteUserData(uid: string): Promise<void> {
  await deleteUserData(uid);
}

export async function deleteUserData(uid: string): Promise<void> {
  const legacySnap = await getDocs(
    query(legacyTransactionsCol(), where("userId", "==", uid)),
  );
  const walletsSnap = await getDocs(walletsCol(uid));

  const batches: ReturnType<typeof writeBatch>[] = [];
  let batch = writeBatch(db);
  let opCount = 0;

  const pushBatchIfNeeded = () => {
    if (opCount >= 400) {
      batches.push(batch);
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  legacySnap.docs.forEach((txDoc) => {
    batch.delete(txDoc.ref);
    opCount += 1;
    pushBatchIfNeeded();
  });

  for (const walletSnap of walletsSnap.docs) {
    const walletId = walletSnap.id;
    const txSnap = await getDocs(walletTransactionsCol(uid, walletId));
    txSnap.docs.forEach((txDoc) => {
      batch.delete(txDoc.ref);
      opCount += 1;
      pushBatchIfNeeded();
    });
    batch.delete(walletSnap.ref);
    opCount += 1;
    pushBatchIfNeeded();
  }

  batch.delete(doc(db, "users", uid));
  batches.push(batch);

  for (const b of batches) {
    await b.commit();
  }
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export async function createWallet(
  userId: string,
  data: NewWalletData,
): Promise<string> {
  const walletRef = doc(walletsCol(userId));
  await setDoc(walletRef, {
    userId,
    name: data.name,
    initialBalance: data.initialBalance,
    balance: 0,
    createdAt: serverTimestamp(),
  });
  return walletRef.id;
}

export async function updateWallet(
  userId: string,
  walletId: string,
  data: NewWalletData,
  _originalInitialBalance: number,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    tx.update(walletDoc(userId, walletId), {
      name: data.name,
      initialBalance: data.initialBalance,
    });
  });
}

export function subscribeToWallets(
  userId: string,
  callback: (wallets: Wallet[]) => void,
): Unsubscribe {
  const q = query(walletsCol(userId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const wallets = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Wallet,
    );
    callback(wallets);
  });
}

export async function deleteWallet(
  userId: string,
  walletId: string,
): Promise<void> {
  const txSnap = await getDocs(walletTransactionsCol(userId, walletId));

  const batches: ReturnType<typeof writeBatch>[] = [];
  let batch = writeBatch(db);
  let opCount = 0;

  const pushBatchIfNeeded = () => {
    if (opCount >= 400) {
      batches.push(batch);
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  txSnap.docs.forEach((txDoc) => {
    batch.delete(txDoc.ref);
    opCount += 1;
    pushBatchIfNeeded();
  });

  batch.delete(walletDoc(userId, walletId));
  batches.push(batch);

  for (const b of batches) {
    await b.commit();
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Add a new transaction AND atomically update the wallet balance.
 *
 * @param {string} userId
 * @param {string} walletId
 * @param {NewTransactionData} txData
 * @returns {Promise<string>} The new transaction document id
 */
export async function addTransaction(
  userId: string,
  walletId: string,
  txData: NewTransactionData,
): Promise<string> {
  const balanceDelta =
    txData.type === "income" ? txData.amount : -txData.amount;

  let newTxId = "";

  await runTransaction(db, async (tx) => {
    // 1. Add the transaction document
    const txRef = doc(walletTransactionsCol(userId, walletId));
    newTxId = txRef.id;
    tx.set(txRef, {
      userId,
      walletId,
      ...txData,
      date: Timestamp.fromDate(txData.date),
      createdAt: serverTimestamp(),
    });

    // 2. Update the wallet balance atomically
    tx.update(walletDoc(userId, walletId), { balance: increment(balanceDelta) });
  });

  return newTxId;
}

/**
 * Update a transaction AND apply the balance delta based on changes.
 *
 * @param {string} txId
 * @param {NewTransactionData} txData
 * @param {Pick<Transaction, 'type' | 'amount'>} original
 * @param {string} userId
 * @param {string} walletId
 */
export async function updateTransaction(
  txId: string,
  txData: NewTransactionData,
  original: Pick<Transaction, "type" | "amount">,
  userId: string,
  walletId: string,
): Promise<void> {
  const originalEffect =
    original.type === "income" ? original.amount : -original.amount;
  const nextEffect = txData.type === "income" ? txData.amount : -txData.amount;
  const balanceDelta = nextEffect - originalEffect;

  await runTransaction(db, async (tx) => {
    tx.update(doc(walletTransactionsCol(userId, walletId), txId), {
      ...txData,
      date: Timestamp.fromDate(txData.date),
    });
    tx.update(walletDoc(userId, walletId), { balance: increment(balanceDelta) });
  });
}

/**
 * Delete a transaction AND reverse its effect on the wallet balance.
 *
 * @param {string} txId
 * @param {Pick<Transaction, 'type' | 'amount'>} txData
 * @param {string} userId
 * @param {string} walletId
 */
export async function deleteTransaction(
  txId: string,
  txData: Pick<Transaction, "type" | "amount">,
  userId: string,
  walletId: string,
): Promise<void> {
  const balanceDelta =
    txData.type === "income" ? -txData.amount : txData.amount;

  await runTransaction(db, async (tx) => {
    tx.delete(doc(walletTransactionsCol(userId, walletId), txId));
    tx.update(walletDoc(userId, walletId), { balance: increment(balanceDelta) });
  });
}

/**
 * Fetch the most recent N transactions for a wallet (one-time read).
 *
 * @param {string} userId
 * @param {string} walletId
 * @param {number} limitCount
 * @returns {Promise<Transaction[]>}
 */
export async function getRecentTransactions(
  userId: string,
  walletId: string,
  limitCount: number = 5,
): Promise<Transaction[]> {
  const q = query(
    walletTransactionsCol(userId, walletId),
    orderBy("date", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

/**
 * Real-time listener for ALL transactions of a wallet, newest first.
 *
 * @param {string} userId
 * @param {string} walletId
 * @param {function} callback - receives array of transaction objects
 * @returns {function} unsubscribe
 */
export function subscribeToTransactions(
  userId: string,
  walletId: string,
  callback: (transactions: Transaction[]) => void,
): Unsubscribe {
  const q = query(
    walletTransactionsCol(userId, walletId),
    orderBy("date", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
    callback(list);
  });
}

/**
 * Fetch transactions filtered by category for the Statistics screen.
 *
 * @param {string} userId
 * @param {string} walletId
 * @param {string} category
 * @returns {Promise<Transaction[]>}
 */
export async function getTransactionsByCategory(
  userId: string,
  walletId: string,
  category: string,
): Promise<Transaction[]> {
  const q = query(
    walletTransactionsCol(userId, walletId),
    where("category", "==", category),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

/**
 * Fetch transactions within a date range (inclusive), oldest first.
 */
export async function getTransactionsInRange(
  userId: string,
  walletId: string,
  startDate: Date,
  endDate: Date,
): Promise<Transaction[]> {
  const q = query(
    walletTransactionsCol(userId, walletId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate)),
    orderBy("date", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

/**
 * Fetch transactions before a date (exclusive), oldest first.
 */
export async function getTransactionsBeforeDate(
  userId: string,
  walletId: string,
  beforeDate: Date,
): Promise<Transaction[]> {
  const q = query(
    walletTransactionsCol(userId, walletId),
    where("date", "<", Timestamp.fromDate(beforeDate)),
    orderBy("date", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

// ─── Migration Helpers ───────────────────────────────────────────────────────

export async function migrateLegacyTransactionsToDefaultWallet(
  userId: string,
): Promise<string> {
  const userSnap = await getDoc(doc(db, "users", userId));
  const userBalance = userSnap.exists()
    ? (userSnap.data().balance as number | undefined)
    : 0;

  const legacySnap = await getDocs(
    query(legacyTransactionsCol(), where("userId", "==", userId)),
  );

  const walletRef = doc(walletsCol(userId));
  const batches: ReturnType<typeof writeBatch>[] = [];
  let batch = writeBatch(db);
  let opCount = 0;

  const pushBatchIfNeeded = () => {
    if (opCount >= 400) {
      batches.push(batch);
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  batch.set(walletRef, {
    userId,
    name: "Main Wallet",
    initialBalance: userBalance ?? 0,
    balance: 0,
    createdAt: serverTimestamp(),
  });
  opCount += 1;
  pushBatchIfNeeded();

  legacySnap.docs.forEach((legacyDoc) => {
    const data = legacyDoc.data();
    const txRef = doc(walletTransactionsCol(userId, walletRef.id));
    batch.set(txRef, {
      ...data,
      userId,
      walletId: walletRef.id,
    });
    opCount += 1;
    pushBatchIfNeeded();
    batch.delete(legacyDoc.ref);
    opCount += 1;
    pushBatchIfNeeded();
  });

  batches.push(batch);
  for (const b of batches) {
    await b.commit();
  }

  return walletRef.id;
}