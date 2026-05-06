// ─── Wallets List Screen ───────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from "react";
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
import SkeletonLoader from "../components/SkeletonLoader";
import { useWallet } from "../context/WalletContext";
import { StackScreenProps } from "@react-navigation/stack";
import type { AppStackParamList, Wallet } from "../types";
import { formatCurrency } from "../utils/formatCurrency";

type Props = StackScreenProps<AppStackParamList, "WalletsList">;

export default function WalletsListScreen({ navigation }: Props) {
  const { wallets, loading, deleteWallet, selectWallet } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = new Set(wallets.map((w) => w.id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (current.has(id)) next.add(id);
      });
      return next;
    });
  }, [wallets]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const enterSelectMode = (wallet: Wallet) => {
    setSelectMode(true);
    setSelectedIds(new Set([wallet.id]));
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (walletId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) next.delete(walletId);
      else next.add(walletId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0 || deleting) return;
    Alert.alert(
      "Delete Wallets",
      `Delete ${selectedIds.size} selected wallet${
        selectedIds.size === 1 ? "" : "s"
      } and all transactions?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const targets = wallets.filter((w) => selectedIds.has(w.id));
              await Promise.all(targets.map((w) => deleteWallet(w.id)));
              exitSelectMode();
            } catch (err: any) {
              Alert.alert("Delete failed", err?.message ?? "Try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const listData = useMemo(() => wallets, [wallets]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {selectMode ? (
          <TouchableOpacity style={styles.iconBtn} onPress={exitSelectMode}>
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={Colors.text}
            />
          </TouchableOpacity>
        ) : (
          <Text style={styles.title}>My Wallets</Text>
        )}
        {selectMode ? (
          <View style={styles.selectHeaderRight}>
            <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleting}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color={
                  selectedIds.size === 0 || deleting
                    ? Colors.textDim
                    : Colors.expense
                }
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("WalletEdit", { mode: "add" })}
          >
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={Colors.white}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.listPad}>
          <SkeletonLoader count={4} />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={48}
            color={Colors.textDim}
          />
          <Text style={styles.emptyTitle}>No wallets yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap + to add your first wallet
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent1}
              colors={[Colors.accent1]}
            />
          }
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  if (selectMode) {
                    toggleSelection(item.id);
                    return;
                  }
                  selectWallet(item.id);
                  navigation.navigate("WalletEdit", {
                    walletId: item.id,
                    mode: "edit",
                  });
                }}
                onLongPress={() => enterSelectMode(item)}
                activeOpacity={0.85}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="wallet"
                    size={22}
                    color={Colors.accent1}
                  />
                </View>
                <View style={styles.info}>
                  <Text style={styles.walletName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.walletMeta}>
                    Initial {formatCurrency(item.initialBalance)}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.amount}>
                    {formatCurrency(item.initialBalance + item.balance)}
                  </Text>
                  {selectMode && (
                    <MaterialCommunityIcons
                      name={
                        selected
                          ? "check-circle"
                          : "checkbox-blank-circle-outline"
                      }
                      size={20}
                      color={selected ? Colors.accent1 : Colors.textDim}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
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
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent1,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  selectHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  selectCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listPad: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
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
    backgroundColor: Colors.accent1 + "1F",
  },
  info: { flex: 1 },
  walletName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  walletMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  emptySubtitle: { color: Colors.textDim, fontSize: FontSize.sm },
});
