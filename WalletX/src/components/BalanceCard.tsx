// ─── BalanceCard ──────────────────────────────────────────────────────────────
// The hero card on the Home screen showing total balance with gradient bg.

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient }  from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors              from '../constants/colors';
import { Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { formatCurrency }  from '../utils/formatCurrency';

interface BalanceCardProps {
  balance?: number;
  income?: number;
  expenses?: number;
}

export default function BalanceCard({ balance = 0, income = 0, expenses = 0 }: BalanceCardProps) {
  // Fade-in animation on mount
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <LinearGradient
        colors={['#7C3AED', '#4F46E5', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative circles */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>

        {/* Income / Expense row */}
        <View style={styles.row}>
          <StatPill
            icon="arrow-down-circle"
            label="Income"
            value={formatCurrency(income)}
            color={Colors.income}
          />
          <View style={styles.divider} />
          <StatPill
            icon="arrow-up-circle"
            label="Expenses"
            value={formatCurrency(expenses)}
            color={Colors.expense}
          />
        </View>
      </LinearGradient>
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
      <View style={[styles.pillIcon, { backgroundColor: color + '30' }]}>
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
  card: {
    borderRadius:   Radius.xl,
    padding:        Spacing.lg,
    marginHorizontal: Spacing.md,
    overflow:       'hidden',
    shadowColor:    '#7C3AED',
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.4,
    shadowRadius:   20,
    elevation:      12,
  },
  circleTopRight: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleBottomLeft: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    color:      'rgba(255,255,255,0.75)',
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  balance: {
    color:        Colors.white,
    fontSize:     FontSize.hero,
    fontWeight:   FontWeight.extrabold,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius:   Radius.md,
    padding:        Spacing.sm,
  },
  divider: {
    width: 1, height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pillIcon: {
    width: 36, height: 36,
    borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  pillLabel: {
    color:      'rgba(255,255,255,0.65)',
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  pillValue: {
    color:      Colors.white,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
