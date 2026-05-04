// ─── Authentication Helpers ───────────────────────────────────────────────────
// Thin wrappers around Firebase Auth so screens never import firebase directly.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  onAuthStateChanged,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  User,
  Unsubscribe,
} from "firebase/auth";

import { auth } from "./firebase";
import { createUserDoc } from "./firestore";

/**
 * Register a new user with email + password.
 * Also creates a Firestore user document with initial balance $0.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} name - display name shown in the app
 * @returns {Promise<User>}
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = credential.user;

  // Set the display name on the Firebase Auth profile
  await updateProfile(user, { displayName: name });

  // Create corresponding Firestore document
  await createUserDoc(user.uid, {
    name,
    email,
    balance: 0,
    role: "member",
    emailVerified: user.emailVerified,
  });

  return user;
}

/**
 * Sign in an existing user.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
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
 * Reauthenticate the user using their current password.
 * Required by Firebase before sensitive updates like email/password.
 */
export async function reauthenticateUser(
  user: User,
  currentPassword: string,
): Promise<void> {
  const email = user.email ?? "";
  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

/**
 * Update the display name on the Firebase Auth profile.
 */
export async function updateUserName(user: User, name: string): Promise<void> {
  await updateProfile(user, { displayName: name });
}

/**
 * Update the email on the Firebase Auth profile.
 */
export async function updateUserEmail(
  user: User,
  email: string,
): Promise<void> {
  await updateEmail(user, email);
}

/**
 * Send a verification email to the current user.
 */
export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

/**
 * Request email change with verification.
 * The email updates only after the user verifies the link.
 */
export async function requestEmailChange(
  user: User,
  newEmail: string,
): Promise<void> {
  await verifyBeforeUpdateEmail(user, newEmail);
}

/**
 * Update the password on the Firebase Auth profile.
 */
export async function updateUserPassword(
  user: User,
  password: string,
): Promise<void> {
  await updatePassword(user, password);
}

/**
 * Delete the current Firebase Auth user.
 */
export async function deleteAuthUser(user: User): Promise<void> {
  await deleteUser(user);
}

/**
 * Subscribe to auth state changes.
 * Call the returned unsubscribe function to stop listening.
 *
 * @param {function} callback - receives (user | null)
 * @returns {function} unsubscribe
 */
export function subscribeToAuth(
  callback: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
