// ─── CategoryCard ─────────────────────────────────────────────────────────────
// Used in the Statistics screen to show top spending / income per category.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import { formatCurrency } from "../utils/formatCurrency";
import { getCategoryById } from "../utils/categories";
import type { TransactionType } from "../types";

interface CategoryCardProps {
  categoryId: string;
  total: number;
  type: TransactionType;
}

export default function CategoryCard({
  categoryId,
  total,
  type,
}: CategoryCardProps) {
  const category = getCategoryById(categoryId);
  const isIncome = type === "income";
  const amtColor = isIncome ? Colors.income : Colors.expense;

  return (
    <View style={styles.card}>
      <View
        style={[styles.iconWrap, { backgroundColor: category.color + "22" }]}
      >
        <MaterialCommunityIcons
          name={category.icon as any}
          size={20}
          color={category.color}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {category.label}
      </Text>
      <Text style={[styles.amount, { color: amtColor }]}>
        {isIncome ? "+" : "-"} {formatCurrency(total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    width: "47%",
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
