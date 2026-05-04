// ─── Admin Users Screen ─────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  adminDeleteUserData,
  adminListUsers,
  adminSetUserRole,
} from "../services/firestore";
import ErrorMessage from "../components/ErrorMessage";
import type { AdminUserSummary, AppStackParamList, UserRole } from "../types";

type Nav = StackNavigationProp<AppStackParamList>;

type VerificationLabel = {
  label: string;
  color: string;
  background: string;
};

export default function AdminUsersScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAdmin, isEmailVerified } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const canAccess = isAdmin && isEmailVerified;

  const fetchUsers = useCallback(async () => {
    setError("");
    try {
      const list = await adminListUsers();
      setUsers(list);
    } catch (e: any) {
      setError(e.message ?? "Failed to load users.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!canAccess) {
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setLoading(true);
      await fetchUsers();
      if (mounted) setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [canAccess, fetchUsers]);

  const onRefresh = useCallback(async () => {
    if (!canAccess) return;
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [canAccess, fetchUsers]);

  const handleRoleChange = async (target: AdminUserSummary, role: UserRole) => {
    if (target.role === role) return;
    setBusyUserId(target.uid);
    setError("");
    try {
      await adminSetUserRole(target.uid, role);
      await fetchUsers();
    } catch (e: any) {
      setError(e.message ?? "Failed to update role.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = (target: AdminUserSummary) => {
    Alert.alert(
      "Delete User Data",
      `Delete Firestore data for ${target.name || target.email}? Auth account will remain.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusyUserId(target.uid);
            setError("");
            try {
              await adminDeleteUserData(target.uid);
              await fetchUsers();
            } catch (e: any) {
              setError(e.message ?? "Failed to delete user data.");
            } finally {
              setBusyUserId(null);
            }
          },
        },
      ],
    );
  };

  const accessMessage = useMemo(() => {
    if (!isAdmin) return "Admin access required.";
    if (!isEmailVerified) return "Verify your email to access admin tools.";
    return "";
  }, [isAdmin, isEmailVerified]);

  const resolveVerification = (value: boolean | null): VerificationLabel => {
    if (value === true) {
      return {
        label: "Verified",
        color: Colors.income,
        background: Colors.incomeLight,
      };
    }
    if (value === false) {
      return {
        label: "Unverified",
        color: Colors.expense,
        background: Colors.expenseLight,
      };
    }
    return {
      label: "Unknown",
      color: Colors.textDim,
      background: Colors.surface,
    };
  };

  if (!canAccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={Colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Users</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={36}
            color={Colors.expense}
          />
          <Text style={styles.emptyTitle}>{accessMessage}</Text>
          <Text style={styles.emptySubtitle}>
            Manage verification from your profile screen.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color={Colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Users</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <MaterialCommunityIcons
            name="refresh"
            size={22}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.accent1} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent1}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="account-multiple-outline"
                size={36}
                color={Colors.textDim}
              />
              <Text style={styles.emptyTitle}>No users found.</Text>
              <Text style={styles.emptySubtitle}>
                Pull to refresh or check Firestore rules.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelf = item.uid === user?.uid;
            const busy = busyUserId === item.uid;
            const verification = resolveVerification(item.emailVerified);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.name || item.email).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {item.name || "Unnamed"}
                    </Text>
                    <Text style={styles.cardEmail}>{item.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.verifyBadge,
                      { backgroundColor: verification.background },
                    ]}
                  >
                    <Text
                      style={[styles.verifyText, { color: verification.color }]}
                    >
                      {verification.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.roleRow}>
                  <Text style={styles.roleLabel}>Role</Text>
                  <Text style={styles.roleValue}>{item.role}</Text>
                </View>

                <View style={styles.actions}>
                  {item.role === "member" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.promoteBtn]}
                      onPress={() => handleRoleChange(item, "admin")}
                      disabled={busy}
                    >
                      <Text style={styles.actionText}>Promote</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.demoteBtn]}
                      onPress={() => handleRoleChange(item, "member")}
                      disabled={busy || isSelf}
                    >
                      <Text style={styles.actionText}>Demote</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                    disabled={busy || isSelf}
                  >
                    <Text style={styles.actionText}>Delete Data</Text>
                  </TouchableOpacity>
                </View>

                {isSelf && (
                  <Text style={styles.selfHint}>
                    You cannot delete or demote your own account.
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

      <ErrorMessage message={error} style={styles.error} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent1 + "22",
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  cardInfo: { flex: 1 },
  cardName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  cardEmail: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  verifyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  verifyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  roleLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  roleValue: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: "capitalize",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  promoteBtn: {
    borderColor: Colors.income,
    backgroundColor: Colors.incomeLight,
  },
  demoteBtn: {
    borderColor: Colors.accent2,
    backgroundColor: Colors.accent2 + "22",
  },
  deleteBtn: {
    borderColor: Colors.expense,
    backgroundColor: Colors.expenseLight,
  },
  actionText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  selfHint: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: "center",
  },
  error: {
    textAlign: "center",
    paddingBottom: Spacing.md,
  },
});
