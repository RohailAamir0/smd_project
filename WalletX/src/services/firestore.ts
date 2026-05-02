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
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import type { UserProfile, Transaction, NewTransactionData } from "../types";

// ── Collection references ─────────────────────────────────────────────────────
const usersCol = () => collection(db, "users");
const transactionsCol = () => collection(db, "transactions");

// ─── User Document ────────────────────────────────────────────────────────────

/**
 * Create a new user document (called once on registration).
 *
 * @param {string} uid
 * @param {Omit<UserProfile, 'id' | 'createdAt'>} data
 */
export async function createUserDoc(
  uid: string,
  data: Omit<UserProfile, "id" | "createdAt">,
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
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
    ? ({ id: snap.id, ...snap.data() } as UserProfile)
    : null;
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
  callback: (user: UserProfile) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as UserProfile);
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Add a new transaction AND atomically update the user's balance.
 *
 * @param {string} userId
 * @param {NewTransactionData} txData
 * @returns {Promise<string>} The new transaction document id
 */
export async function addTransaction(
  userId: string,
  txData: NewTransactionData,
): Promise<string> {
  const balanceDelta =
    txData.type === "income" ? txData.amount : -txData.amount;

  let newTxId = "";

  await runTransaction(db, async (tx) => {
    // 1. Add the transaction document
    const txRef = doc(transactionsCol());
    newTxId = txRef.id;
    tx.set(txRef, {
      userId,
      ...txData,
      date: Timestamp.fromDate(txData.date),
      createdAt: serverTimestamp(),
    });

    // 2. Update the user balance atomically
    const userRef = doc(db, "users", userId);
    tx.update(userRef, { balance: increment(balanceDelta) });
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
 */
export async function updateTransaction(
  txId: string,
  txData: NewTransactionData,
  original: Pick<Transaction, "type" | "amount">,
  userId: string,
): Promise<void> {
  const originalEffect =
    original.type === "income" ? original.amount : -original.amount;
  const nextEffect = txData.type === "income" ? txData.amount : -txData.amount;
  const balanceDelta = nextEffect - originalEffect;

  await runTransaction(db, async (tx) => {
    tx.update(doc(db, "transactions", txId), {
      ...txData,
      date: Timestamp.fromDate(txData.date),
    });
    tx.update(doc(db, "users", userId), { balance: increment(balanceDelta) });
  });
}

/**
 * Delete a transaction AND reverse its effect on the user's balance.
 *
 * @param {string} txId
 * @param {Pick<Transaction, 'type' | 'amount'>} txData
 * @param {string} userId
 */
export async function deleteTransaction(
  txId: string,
  txData: Pick<Transaction, "type" | "amount">,
  userId: string,
): Promise<void> {
  const balanceDelta =
    txData.type === "income" ? -txData.amount : txData.amount;

  await runTransaction(db, async (tx) => {
    tx.delete(doc(db, "transactions", txId));
    tx.update(doc(db, "users", userId), { balance: increment(balanceDelta) });
  });
}

/**
 * Fetch the most recent N transactions for a user (one-time read).
 *
 * @param {string} userId
 * @param {number} limitCount
 * @returns {Promise<Transaction[]>}
 */
export async function getRecentTransactions(
  userId: string,
  limitCount: number = 5,
): Promise<Transaction[]> {
  const q = query(
    transactionsCol(),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

/**
 * Real-time listener for ALL transactions of a user, newest first.
 *
 * @param {string} userId
 * @param {function} callback - receives array of transaction objects
 * @returns {function} unsubscribe
 */
export function subscribeToTransactions(
  userId: string,
  callback: (txs: Transaction[]) => void,
): Unsubscribe {
  const q = query(
    transactionsCol(),
    where("userId", "==", userId),
    orderBy("date", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Transaction,
    );
    callback(txs);
  });
}

/**
 * Fetch transactions filtered by category for the Statistics screen.
 *
 * @param {string} userId
 * @param {string} category
 * @returns {Promise<Transaction[]>}
 */
export async function getTransactionsByCategory(
  userId: string,
  category: string,
): Promise<Transaction[]> {
  const q = query(
    transactionsCol(),
    where("userId", "==", userId),
    where("category", "==", category),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}
