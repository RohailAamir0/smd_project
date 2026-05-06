// ─── Home Screen ──────────────────────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, FontSize, FontWeight, Radius } from "../constants/theme";
import BalanceCard from "../components/BalanceCard.tsx";
import TransactionItem from "../components/TransactionItem";
import ActionButton from "../components/ActionButton";
import SkeletonLoader from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import type { TabParamList, AppStackParamList } from "../types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  StackScreenProps<AppStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const { userProfile } = useAuth();
  const {
    wallets,
    selectedWalletId,
    selectedWalletIndex,
    selectWallet,
    recentTransactions,
    totalIncome,
    totalExpenses,
    loading,
  } = useWallet();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Real-time listeners auto-update; just wait briefly for visual feedback
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleFabPress = () => {
    navigation.navigate("WalletEdit", { mode: "add" });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent1}
            colors={[Colors.accent1]}
          />
        }
      >
        {/* ── Top Bar ───────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{userProfile?.name ?? "Friend"} 👋</Text>
          </View>
        </View>

        {/* ── Balance Card ──────────────────────────────────────────────────── */}
        <BalanceCard
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          selectedIndex={selectedWalletIndex}
          income={totalIncome}
          expenses={totalExpenses}
          onSelectIndex={(index: number) => {
            const wallet = wallets[index];
            if (wallet) selectWallet(wallet.id);
          }}
        />

        {/* ── Action Buttons ────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <ActionButton
            icon="arrow-down-circle-outline"
            label="Income"
            onPress={() =>
              navigation.navigate("AddTransaction", { type: "income" })
            }
            gradient
          />
          <ActionButton
            icon="arrow-up-circle-outline"
            label="Expense"
            onPress={() =>
              navigation.navigate("AddTransaction", { type: "expense" })
            }
          />
          <ActionButton
            icon="wallet-outline"
            label="Wallet Edit"
            onPress={() =>
              navigation.navigate("WalletEdit", {
                walletId: selectedWalletId ?? undefined,
                mode: "edit",
              })
            }
          />
          <ActionButton
            icon="dots-horizontal-circle-outline"
            label="More"
            onPress={() => navigation.navigate("Profile")}
          />
        </View>

        {/* ── Recent Transactions ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Transactions")}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : recentTransactions.length === 0 ? (
            <EmptyState onPress={() => navigation.navigate("AddTransaction")} />
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() =>
                  navigation.navigate("AddTransaction", { transaction: tx })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── FAB: Add Transaction ──────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={30} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.empty} onPress={onPress}>
      <MaterialCommunityIcons
        name="file-document-outline"
        size={48}
        color={Colors.textDim}
      />
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptySubtitle}>Tap + to add your first one</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  seeAll: {
    color: Colors.accent1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
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
