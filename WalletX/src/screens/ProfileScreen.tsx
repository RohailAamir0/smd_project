// ─── Profile Screen ───────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import ErrorMessage from "../components/ErrorMessage";
import { logoutUser } from "../services/auth";
import { formatCurrency } from "../utils/formatCurrency";
import type { AppStackParamList } from "../types";

export default function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { user, userProfile } = useAuth();
  const { balance, totalIncome, totalExpenses, transactions } = useWallet();
  const [loggingOut, setLoggingOut] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          setGeneralError("");
          try {
            await logoutUser();
          } catch (e: any) {
            setGeneralError(e.message);
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const initials = (user?.displayName ?? userProfile?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    { label: "Balance", value: formatCurrency(balance), color: Colors.accent1 },
    {
      label: "Total Income",
      value: formatCurrency(totalIncome),
      color: Colors.income,
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalExpenses),
      color: Colors.expense,
    },
    {
      label: "Transactions",
      value: `${transactions.length}`,
      color: Colors.accent2,
    },
  ];

  type MenuItem = {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
  };

  const menuItems: MenuItem[] = [
    {
      icon: "account-edit-outline",
      label: "Edit Profile",
      onPress: () => navigation.navigate("EditProfile"),
    },
    { icon: "bell-outline", label: "Notifications", onPress: () => {} },
    {
      icon: "shield-lock-outline",
      label: "Privacy & Security",
      onPress: () => {},
    },
    { icon: "help-circle-outline", label: "Help & Support", onPress: () => {} },
    { icon: "information-outline", label: "About WalletX", onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.initials}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.name}>
            {user?.displayName ?? userProfile?.name ?? "User"}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={Colors.accent1}
                  />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={Colors.textDim}
                />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <ErrorMessage message={generalError} />

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={Colors.expense}
          />
          <Text style={styles.logoutTxt}>
            {loggingOut ? "Signing out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>WalletX v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  avatarSection: { alignItems: "center", paddingVertical: Spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  initials: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  email: { color: Colors.textMuted, fontSize: FontSize.sm },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent1 + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.expense + "15",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.expense + "30",
    marginBottom: Spacing.md,
  },
  logoutTxt: {
    color: Colors.expense,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  version: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    textAlign: "center",
  },
});
