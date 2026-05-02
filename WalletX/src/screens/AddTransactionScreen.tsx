import React, { useState } from "react";
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
  ToastAndroid,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import GradientButton from "../components/GradientButton";
import ErrorMessage from "../components/ErrorMessage";
import { useWallet } from "../context/WalletContext";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/categories";
import { formatDate, formatTime } from "../utils/formatDate";
import { StackScreenProps } from "@react-navigation/stack";
import type {
  AppStackParamList,
  DateLike,
  Transaction,
  TransactionType,
} from "../types";

type Props = StackScreenProps<AppStackParamList, "AddTransaction">;

function toDate(date: DateLike): Date {
  if (date && typeof (date as { toDate?: () => Date }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate();
  }
  return date as Date;
}

export default function AddTransactionScreen({ navigation, route }: Props) {
  const { addTransaction, updateTransaction, deleteTransaction } = useWallet();
  const editingTx: Transaction | undefined = route?.params?.transaction;
  const isEditing = Boolean(editingTx);
  const [type, setType] = useState<TransactionType>(
    editingTx?.type ?? route?.params?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    editingTx ? editingTx.amount.toFixed(2) : "",
  );
  const [category, setCategory] = useState(editingTx?.category ?? "");
  const [note, setNote] = useState(editingTx?.note ?? "");
  const [transactionDate, setTransactionDate] = useState(
    editingTx ? toDate(editingTx.date) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const validate = () => {
    const e: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0)
      e.amount = "Enter a valid amount";
    if (!category) e.category = "Select a category";
    const now = new Date();
    if (transactionDate.getTime() > now.getTime()) {
      e.date = "Date/time cannot be in the future";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (!selectedDate) return;
    const now = new Date();
    const nextDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      transactionDate.getHours(),
      transactionDate.getMinutes(),
      0,
      0,
    );
    setTransactionDate(nextDate > now ? now : nextDate);
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (!selectedTime) return;
    const now = new Date();
    const nextDate = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
    );
    setTransactionDate(nextDate > now ? now : nextDate);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setGeneralError("");
    const payload = {
      type,
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      category,
      note: note.trim(),
      date: transactionDate,
    };
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, payload, {
          type: editingTx.type,
          amount: editingTx.amount,
        });
      } else {
        await addTransaction(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editingTx) return;
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            setGeneralError("");
            try {
              await deleteTransaction(editingTx.id, {
                type: editingTx.type,
                amount: editingTx.amount,
              });
              if (Platform.OS === "android") {
                ToastAndroid.show("Transaction deleted", ToastAndroid.SHORT);
              } else {
                Alert.alert("Deleted", "Transaction deleted.");
              }
              navigation.goBack();
            } catch (err: any) {
              setGeneralError(err.message);
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={Colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </Text>
            {isEditing ? (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteBtn}
                disabled={loading || deleting}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={22}
                  color={Colors.expense}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Type Toggle */}
          <View style={styles.typeRow}>
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeBtn,
                  type === t && {
                    backgroundColor:
                      t === "income" ? Colors.income : Colors.expense,
                  },
                ]}
                onPress={() => {
                  setType(t);
                  setCategory("");
                }}
              >
                <MaterialCommunityIcons
                  name={
                    t === "income" ? "arrow-down-circle" : "arrow-up-circle"
                  }
                  size={18}
                  color={type === t ? Colors.white : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeTxt,
                    type === t && { color: Colors.white },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.amountWrap}>
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textDim}
              keyboardType="decimal-pad"
              selectionColor={Colors.accent1}
            />
          </View>
          {errors.amount && <Text style={styles.errText}>{errors.amount}</Text>}

          {/* Date */}
          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker((prev) => !prev)}
          >
            <MaterialCommunityIcons
              name="calendar-blank"
              size={20}
              color={Colors.textMuted}
            />
            <Text style={styles.dateText}>{formatDate(transactionDate)}</Text>
            <Text style={styles.dateHint}>Backdate only</Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errText}>{errors.date}</Text>}
          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={transactionDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          )}

          {/* Time */}
          <Text style={styles.sectionLabel}>Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker((prev) => !prev)}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={Colors.textMuted}
            />
            <Text style={styles.dateText}>{formatTime(transactionDate)}</Text>
            <Text style={styles.dateHint}>Backdate only</Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errText}>{errors.date}</Text>}
          {showTimePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={transactionDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
                maximumDate={new Date()}
              />
            </View>
          )}

          {/* Category Grid */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catBtn,
                  category === cat.id && {
                    borderColor: cat.color,
                    backgroundColor: cat.color + "22",
                  },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={22}
                  color={category === cat.id ? cat.color : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.catLabel,
                    category === cat.id && { color: cat.color },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errText}>{errors.category}</Text>
          )}

          {/* Note */}
          <Text style={styles.sectionLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Lunch with friends"
            placeholderTextColor={Colors.textDim}
            selectionColor={Colors.accent1}
            multiline
            maxLength={120}
          />

          <ErrorMessage message={generalError} />

          <GradientButton
            label={isEditing ? "Save Changes" : "Save Transaction"}
            onPress={handleSubmit}
            loading={loading}
            disabled={deleting}
            colors={
              type === "income"
                ? [Colors.income, "#059669"]
                : Colors.gradientPrimary
            }
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  typeRow: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  typeTxt: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  currencySign: {
    color: Colors.textMuted,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginRight: 4,
  },
  amountInput: {
    color: Colors.text,
    fontSize: 52,
    fontWeight: FontWeight.extrabold,
    minWidth: 120,
    textAlign: "center",
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  catBtn: {
    width: "30%",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  catLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: "center",
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    minHeight: 80,
  },
  errText: {
    color: Colors.expense,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  dateHint: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
  },
  datePickerWrap: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Platform.OS === "ios" ? Spacing.xs : 0,
  },
  submitBtn: { marginTop: Spacing.lg },
});
