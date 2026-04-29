// ─── Authentication Helpers ───────────────────────────────────────────────────
// Thin wrappers around Firebase Auth so screens never import firebase directly.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
  Unsubscribe
} from 'firebase/auth';

import { auth }           from './firebase';
import { createUserDoc }  from './firestore';

/**
 * Register a new user with email + password.
 * Also creates a Firestore user document with initial balance $0.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} name - display name shown in the app
 * @returns {Promise<User>}
 */
export async function registerUser(email: string, password: string, name: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user       = credential.user;

  // Set the display name on the Firebase Auth profile
  await updateProfile(user, { displayName: name });

  // Create corresponding Firestore document
  await createUserDoc(user.uid, { name, email, balance: 0 });

  return user;
}

/**
 * Sign in an existing user.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Send a password-reset email.
 *
 * @param {string} email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes.
 * Call the returned unsubscribe function to stop listening.
 *
 * @param {function} callback - receives (user | null)
 * @returns {function} unsubscribe
 */
export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
