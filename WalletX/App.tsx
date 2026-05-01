// ─── App.tsx — WalletX Entry Point ────────────────────────────────────────────
import "react-native-url-polyfill/auto";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, Theme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { WalletProvider } from "./src/context/WalletContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Colors from "./src/constants/colors";

// Navigation theme — keeps the background dark on all navigators
const NAV_THEME: Theme = {
  dark: true,
  colors: {
    primary: Colors.accent1,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent1,
  },
};

export default function App() {
  return (
    // GestureHandlerRootView is required by react-native-gesture-handler
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Auth state provider — must wrap everything */}
        <AuthProvider>
          {/* Wallet/transactions provider — needs auth user available */}
          <WalletProvider>
            <NavigationContainer theme={NAV_THEME}>
              <StatusBar style="light" backgroundColor={Colors.background} />
              <AppNavigator />
            </NavigationContainer>
          </WalletProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
