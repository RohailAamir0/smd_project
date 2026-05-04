// ─── App Navigator ────────────────────────────────────────────────────────────
// Root navigator — gates between Auth and Main (tab) based on auth state.

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Colors from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import AdminUsersScreen from "../screens/AdminUsersScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import type { AppStackParamList } from "../types";

const Stack = createStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { isLoggedIn, loading, needsProfileSetup } = useAuth();

  // Show a centered spinner while Firebase resolves the auth state
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.accent1} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        // ── Authenticated routes ──────────────────────────────────────────────
        needsProfileSetup ? (
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ presentation: "modal", animationEnabled: true }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminUsers"
              component={AdminUsersScreen}
              options={{ headerShown: false }}
            />
          </>
        )
      ) : (
        // ── Unauthenticated routes ────────────────────────────────────────────
        <Stack.Screen name="Auth" component={AuthNavigator as any} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
