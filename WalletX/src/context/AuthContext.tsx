// ─── Auth Context ─────────────────────────────────────────────────────────────
// Provides the current Firebase user and loading state to the entire app.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth } from '../services/auth';
import { getUserDoc }       from '../services/firestore';
import type { AuthContextType, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null);  // Firebase Auth user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);  // Firestore user doc
  const [loading,     setLoading]     = useState<boolean>(true);  // True while resolving

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch the Firestore user document when logged in
        const profile = await getUserDoc(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,           // Firebase Auth user object (or null)
    userProfile,    // Firestore user doc { name, email, balance, ... }
    loading,        // True while auth state is being resolved
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access auth state from any component */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
