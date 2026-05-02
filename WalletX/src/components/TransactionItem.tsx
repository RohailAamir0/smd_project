// ─── TransactionItem ──────────────────────────────────────────────────────────
// A single row in the transaction list.

import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import { formatTransactionAmount } from "../utils/formatCurrency";
import { formatRelativeDateTime } from "../utils/formatDate";
import { getCategoryById } from "../utils/categories";
import type { Transaction } from "../types";

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
  onLongPress?: () => void;
  selecting?: boolean;
  selected?: boolean;
}

export default function TransactionItem({
  transaction,
  onPress,
  onLongPress,
  selecting = false,
  selected = false,
}: TransactionItemProps) {
  const category = getCategoryById(transaction.category);
  const isIncome = transaction.type === "income";
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        {/* Category Icon */}
        <View
          style={[styles.iconWrap, { backgroundColor: category.color + "25" }]}
        >
          <MaterialCommunityIcons
            name={category.icon as any}
            size={22}
            color={category.color}
          />
        </View>

        {/* Label + date */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {category.label}
          </Text>
          <Text style={styles.date}>
            {transaction.note
              ? `${transaction.note} · ${formatRelativeDateTime(
                  transaction.date,
                )}`
              : formatRelativeDateTime(transaction.date)}
          </Text>
        </View>

        {/* Amount + Selection */}
        <View style={styles.right}>
          <Text
            style={[
              styles.amount,
              { color: isIncome ? Colors.income : Colors.expense },
            ]}
          >
            {formatTransactionAmount(transaction.amount, transaction.type)}
          </Text>
          {selecting && (
            <MaterialCommunityIcons
              name={selected ? "check-circle" : "checkbox-blank-circle-outline"}
              size={20}
              color={selected ? Colors.accent1 : Colors.textDim}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowSelected: {
    borderColor: Colors.accent1,
    backgroundColor: Colors.accent1 + "12",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  date: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
});
