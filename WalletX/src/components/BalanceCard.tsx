// ─── BalanceCard ──────────────────────────────────────────────────────────────
// Wallet carousel showing balance with gradient bg.

import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import { formatCurrency } from "../utils/formatCurrency";
import type { Wallet } from "../types";

interface BalanceCardProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  selectedIndex: number;
  income?: number;
  expenses?: number;
  onSelectIndex: (index: number) => void;
}

export default function BalanceCard({
  wallets,
  selectedWalletId,
  selectedIndex,
  income = 0,
  expenses = 0,
  onSelectIndex,
}: BalanceCardProps) {
  const listRef = useRef<FlatList<Wallet>>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const cardWidth = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    return screenWidth - Spacing.md * 2;
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    if (!listRef.current) return;
    if (selectedIndex < 0 || selectedIndex >= wallets.length) return;
    listRef.current.scrollToIndex({ index: selectedIndex, animated: true });
  }, [selectedIndex, wallets.length]);

  const goToIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= wallets.length) return;
    onSelectIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  if (wallets.length === 0) {
    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <LinearGradient
          colors={["#7C3AED", "#4F46E5", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { marginHorizontal: Spacing.md }]}
        >
          <Text style={styles.label}>No wallets yet</Text>
          <Text style={styles.balance}>$0.00</Text>
          <View style={styles.row}>
            <Text style={styles.emptyHint}>
              Create a wallet to get started.
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={styles.carouselWrap}>
        <FlatList
          ref={listRef}
          data={wallets}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          getItemLayout={(_, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(
              event.nativeEvent.contentOffset.x / cardWidth,
            );
            onSelectIndex(nextIndex);
          }}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedWalletId;
            return (
              <View style={{ width: cardWidth }}>
                <LinearGradient
                  colors={["#7C3AED", "#4F46E5", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.circleTopRight} />
                  <View style={styles.circleBottomLeft} />

                  <Text style={styles.label}>{item.name}</Text>
                  <Text style={styles.balance}>
                    {formatCurrency(item.initialBalance + item.balance)}
                  </Text>

                  <View style={styles.row}>
                    <StatPill
                      icon="arrow-down-circle"
                      label="Income"
                      value={formatCurrency(isSelected ? income : 0)}
                      color={Colors.income}
                    />
                    <View style={styles.divider} />
                    <StatPill
                      icon="arrow-up-circle"
                      label="Expenses"
                      value={formatCurrency(isSelected ? expenses : 0)}
                      color={Colors.expense}
                    />
                  </View>
                </LinearGradient>
              </View>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.arrowBtn, styles.arrowLeft]}
          onPress={() => goToIndex(selectedIndex - 1)}
          disabled={selectedIndex <= 0}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={selectedIndex <= 0 ? "rgba(255,255,255,0.5)" : Colors.white}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrowBtn, styles.arrowRight]}
          onPress={() => goToIndex(selectedIndex + 1)}
          disabled={selectedIndex >= wallets.length - 1}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={
              selectedIndex >= wallets.length - 1
                ? "rgba(255,255,255,0.5)"
                : Colors.white
            }
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

interface StatPillProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  color: string;
}

function StatPill({ icon, label, value, color }: StatPillProps) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillIcon, { backgroundColor: color + "30" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrap: { position: "relative" },
  carouselContent: { paddingHorizontal: Spacing.md },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  circleTopRight: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  label: {
    color: "rgba(255,255,255,0.75)",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  balance: {
    color: Colors.white,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pill: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pillLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  pillValue: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  emptyHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
