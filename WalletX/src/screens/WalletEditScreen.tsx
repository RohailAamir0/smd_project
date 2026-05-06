// ─── Wallet Edit Screen ─────────────────────────────────────────────────────

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import GradientButton from "../components/GradientButton";
import ErrorMessage from "../components/ErrorMessage";
import { useWallet } from "../context/WalletContext";
import { StackScreenProps } from "@react-navigation/stack";
import type { AppStackParamList } from "../types";

type Props = StackScreenProps<AppStackParamList, "WalletEdit">;

export default function WalletEditScreen({ navigation, route }: Props) {
  const {
    wallets,
    selectedWalletId,
    createWallet,
    updateWallet,
    deleteWallet,
  } = useWallet();
  const mode = route?.params?.mode ?? "edit";
  const walletId =
    mode === "add"
      ? undefined
      : route?.params?.walletId ?? selectedWalletId ?? undefined;
  const editingWallet = wallets.find((w) => w.id === walletId) ?? null;
  const isEditing = Boolean(editingWallet);

  const [name, setName] = useState(editingWallet?.name ?? "");
  const [initialBalance, setInitialBalance] = useState(
    editingWallet ? editingWallet.initialBalance.toFixed(2) : "0.00",
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  useEffect(() => {
    if (mode === "add") {
      setName("");
      setInitialBalance("0.00");
      return;
    }
    if (editingWallet) {
      setName(editingWallet.name);
      setInitialBalance(editingWallet.initialBalance.toFixed(2));
    }
  }, [mode, editingWallet]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const parsed = parseFloat(initialBalance);
    if (Number.isNaN(parsed)) {
      setError("Enter a valid initial balance.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = { name: name.trim(), initialBalance: parsed };
      if (editingWallet) {
        await updateWallet(
          editingWallet.id,
          payload,
          editingWallet.initialBalance,
        );
      } else {
        await createWallet(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Failed to save wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editingWallet || deleting) return;
    Alert.alert(
      "Delete Wallet",
      "Delete this wallet and all its transactions?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            setError("");
            try {
              await deleteWallet(editingWallet.id);
              navigation.goBack();
            } catch (e: any) {
              setError(e.message ?? "Failed to delete wallet.");
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={Colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditing ? "Edit Wallet" : "Add Wallet"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Wallet Name</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Cash, Savings"
                placeholderTextColor={Colors.textDim}
                autoCapitalize="words"
                selectionColor={Colors.accent1}
              />
            </View>

            <Text style={[styles.label, { marginTop: Spacing.md }]}>
              Initial Balance
            </Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={initialBalance}
                onChangeText={setInitialBalance}
                placeholder="0.00"
                placeholderTextColor={Colors.textDim}
                keyboardType="decimal-pad"
                selectionColor={Colors.accent1}
              />
            </View>

            <ErrorMessage message={error} />

            <GradientButton
              label={isEditing ? "Save Wallet" : "Create Wallet"}
              onPress={handleSubmit}
              loading={loading}
              disabled={!canSubmit || loading}
              style={styles.saveBtn}
            />
            {isEditing && (
              <TouchableOpacity
                style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
                onPress={handleDelete}
                disabled={deleting || loading}
              >
                <Text style={styles.deleteText}>
                  {deleting ? "Deleting..." : "Delete Wallet"}
                </Text>
              </TouchableOpacity>
            )}
            {isEditing && (
              <Text style={styles.helperText}>
                Displayed balance equals initial balance plus net transactions.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  formCard: {
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    height: 48,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  saveBtn: { marginTop: Spacing.lg },
  deleteBtn: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.expense,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteText: {
    color: Colors.expense,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  helperText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});