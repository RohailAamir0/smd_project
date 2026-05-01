# 🔥 Firebase Setup Guide — WalletX

Follow these steps to connect WalletX to a real Firebase backend.

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter a project name (e.g. `walletx-app`)
4. Disable Google Analytics (optional) → Click **"Create project"**

---

## Step 2 — Register a Web App

1. In your project dashboard, click the Add App Button and then the **Web icon `</>`**
2. Give your app a nickname (e.g. `WalletX`)
3. Click **"Register app"**
4. Copy the `firebaseConfig` object shown — you'll need these values

---

## Step 3 — Add Config to the App
1. Copy `.env.example` → `.env`
2. Fill in your values with the `EXPO_PUBLIC_` prefix
3. Refer to the code segment below to see how each environment variable maps

```js
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

---

## Step 4 — Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Click **"Email/Password"** → Enable it → **Save**

---

## Step 5 — Create Firestore Database

1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **"Start in test mode"** (for development)
3. Pick a region closest to your users → **Done**

---

## Step 6 — Set Firestore Security Rules (Production)

In Firebase Console → Firestore → **Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only access their own transactions
    match /transactions/{txId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Step 7 — Install Dependencies & Run

```bash
cd WalletX
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android/iOS device.

---

## Firestore Data Structure

```
users/{userId}
  - name:      string
  - email:     string
  - balance:   number   ← always kept in sync atomically
  - createdAt: timestamp

transactions/{txId}
  - userId:    string
  - type:      'income' | 'expense'
  - category:  string
  - amount:    number
  - note:      string
  - date:      timestamp
  - createdAt: timestamp
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `auth/invalid-api-key` | Check your `firebaseConfig` values in `firebase.js` |
| `permission-denied` | Make sure Firestore rules are set correctly |
| `app/no-app` | Make sure `firebase.js` is imported before auth/firestore |
| Blank screen on start | Check Metro bundler logs with `npx expo start` |
