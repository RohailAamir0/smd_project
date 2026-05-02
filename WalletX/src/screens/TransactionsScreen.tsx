// ─── Transactions Screen ──────────────────────────────────────────────────────
// Full paginated list with category chip filters and pull-to-refresh.

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import TransactionItem from "../components/TransactionItem";
import SkeletonLoader from "../components/SkeletonLoader";
import { useWallet } from "../context/WalletContext";
import { CATEGORIES } from "../utils/categories";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import type { TabParamList, AppStackParamList, Transaction } from "../types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Transactions">,
  StackScreenProps<AppStackParamList>
>;

type FilterType = "all" | "income" | "expense";

const ALL_FILTER = {
  id: "all",
  label: "All",
  icon: "format-list-bulleted",
  color: Colors.accent1,
};

export default function TransactionsScreen({ navigation }: Props) {
  const { transactions, loading, deleteTransaction } = useWallet();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Build chip list: All + unique categories that appear in data
  const chips = useMemo(() => {
    const used = new Set(transactions.map((t) => t.category));
    const cats = CATEGORIES.filter((c) => {
      if (!used.has(c.id)) return false;
      if (typeFilter === "all") return true;
      return c.type === typeFilter;
    });
    return [ALL_FILTER, ...cats];
  }, [transactions, typeFilter]);

  useEffect(() => {
    if (!chips.some((c) => c.id === activeFilter)) {
      setActiveFilter("all");
    }
  }, [chips, activeFilter]);

  // Apply filters
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeFilter !== "all" && tx.category !== activeFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, activeFilter, typeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleLongPress = (tx: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(tx.id, tx),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddTransaction", undefined)}
        >
          <MaterialCommunityIcons name="plus" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Type toggle */}
      <View style={styles.typeRow}>
        {(["all", "income", "expense"] as FilterType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, typeFilter === t && styles.typeBtnActive]}
            onPress={() => setTypeFilter(t)}
          >
            <Text
              style={[
                styles.typeBtnText,
                typeFilter === t && styles.typeBtnTextActive,
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips */}
      <FlatList
        data={chips}
        keyExtractor={(c) => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsList}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              activeFilter === item.id && {
                backgroundColor: item.color + "33",
                borderColor: item.color,
              },
            ]}
            onPress={() => setActiveFilter(item.id)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={18}
              color={activeFilter === item.id ? item.color : Colors.textMuted}
            />
            <Text
              style={[
                styles.chipText,
                activeFilter === item.id && { color: item.color },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {loading ? (
        <View style={styles.listPad}>
          <SkeletonLoader count={6} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent1}
              colors={[Colors.accent1]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={52}
                color={Colors.textDim}
              />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => {}}
              onLongPress={() => handleLongPress(item)}
            />
          )}
        />
      )}
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
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent1,
    alignItems: "center",
    justifyContent: "center",
  },
  typeRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: Radius.sm,
  },
  typeBtnActive: { backgroundColor: Colors.accent1 },
  typeBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  typeBtnTextActive: { color: Colors.white },
  chips: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  chipsList: {
    flexGrow: 0,
    paddingVertical: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  listPad: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
