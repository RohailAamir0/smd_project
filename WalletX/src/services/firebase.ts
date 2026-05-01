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

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your_api_key_here",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "your_project_id.firebaseapp.com",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id_here",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "your_project_id.appspot.com",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "your_sender_id_here",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your_app_id_here",
};

// Remind developer if still using placeholder config
if (__DEV__ && firebaseConfig.apiKey === "your_api_key_here") {
  console.warn(
    "\n🔴 [WalletX] Firebase is NOT configured yet.\n" +
      "   Open .env and set up your environment variables.\n" +
      "   Read FIREBASE_SETUP.md for the full guide.\n",
  );
}

// Prevent re-initializing on hot reload
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db };
export default app;
