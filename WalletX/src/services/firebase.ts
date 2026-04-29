// ─── Firebase Initialization ──────────────────────────────────────────────────
//
// HOW TO CONNECT:
//  1. Go to https://console.firebase.google.com
//  2. Create a project → Add a Web App
//  3. Copy your firebaseConfig values into the fields below
//  4. Enable Email/Password auth in Firebase Console → Authentication
//  5. Create a Firestore database in Firebase Console → Firestore Database
//
// See FIREBASE_SETUP.md for the full step-by-step guide.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth }                from 'firebase/auth';
import { getFirestore, Firestore }           from 'firebase/firestore';

// 🔴 Replace these values with your real Firebase project config.
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

// Remind developer if still using placeholder config
if (__DEV__ && firebaseConfig.apiKey === 'YOUR_API_KEY') {
  console.warn(
    '\n🔴 [WalletX] Firebase is NOT configured yet.\n' +
    '   Open src/services/firebase.ts and replace the placeholder values.\n' +
    '   Read FIREBASE_SETUP.md for the full guide.\n'
  );
}

// Prevent re-initializing on hot reload
const app: FirebaseApp  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore   = getFirestore(app);

export { auth, db };
export default app;
