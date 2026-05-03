// ─── Auth Context ─────────────────────────────────────────────────────────────
// Provides the current Firebase user and loading state to the entire app.

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToAuth } from "../services/auth";
import { subscribeToUser } from "../services/firestore";
import type { AuthContextType, UserProfile } from "../types";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Firebase Auth user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Firestore user doc
  const [loading, setLoading] = useState<boolean>(true); // True while resolving

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    let userUnsub: (() => void) | null = null;
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (firebaseUser) {
        // Subscribe to the Firestore user document for live updates
        userUnsub = subscribeToUser(firebaseUser.uid, (profile) => {
          setUserProfile(profile);
        });
      } else {
        if (userUnsub) {
          userUnsub();
          userUnsub = null;
        }
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      if (userUnsub) userUnsub();
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user, // Firebase Auth user object (or null)
    userProfile, // Firestore user doc { name, email, balance, ... }
    loading, // True while auth state is being resolved
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access auth state from any component */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
