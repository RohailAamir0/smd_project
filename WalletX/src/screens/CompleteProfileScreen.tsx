// ─── Complete Profile Screen ───────────────────────────────────────────────

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import GradientButton from "../components/GradientButton";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { deleteAuthUser, updateUserName } from "../services/auth";
import {
  createUserDoc,
  createWallet,
  deleteUserData,
} from "../services/firestore.ts";

export default function CompleteProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const handleSave = async () => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateUserName(user, trimmedName);
      await createUserDoc(user.uid, {
        name: trimmedName,
        email: user.email ?? "",
        balance: 0,
        role: "member",
        emailVerified: user.emailVerified,
      });
      await createWallet(user.uid, {
        name: "Main Wallet",
        initialBalance: 0,
      });
    } catch (e: any) {
      setError(e.message ?? "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }

    Alert.alert(
      "Delete Account",
      "This will remove your account data from this device and Firebase. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            setError("");
            try {
              await deleteUserData(user.uid);
              await deleteAuthUser(user);
            } catch (e: any) {
              setError(
                e.message ??
                  "Failed to delete account. Please sign in again and retry.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="account-alert-outline"
                size={28}
                color={Colors.white}
              />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Your profile data was missing. Add your name to continue.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textDim}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                selectionColor={Colors.accent1}
              />
            </View>

            <ErrorMessage message={error} />

            <GradientButton
              label="Save Profile"
              onPress={handleSave}
              loading={loading}
              disabled={!canSubmit || loading}
              style={styles.saveBtn}
            />

            <TouchableOpacity
              style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleting || loading}
            >
              <Text style={styles.deleteText}>
                {deleting ? "Deleting..." : "Delete Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notice} disabled>
              <Text style={styles.noticeText}>
                Email: {user?.email ?? "Unknown"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    backgroundColor: Colors.accent1,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: "center",
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm,
  },
  saveBtn: { marginTop: Spacing.lg },
  deleteBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.expense,
    alignItems: "center",
    backgroundColor: Colors.expenseLight,
  },
  deleteBtnDisabled: { opacity: 0.7 },
  deleteText: {
    color: Colors.expense,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  notice: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  noticeText: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    textAlign: "center",
  },
});
