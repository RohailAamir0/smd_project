// ─── Statistics Screen ────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView }           from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart }               from 'react-native-gifted-charts';
import Colors  from '../constants/colors';
import { Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import CategoryCard  from '../components/CategoryCard';
import { useWallet } from '../context/WalletContext';
import { formatCurrency }  from '../utils/formatCurrency';
import { formatMonthYear } from '../utils/formatDate';
import type { TransactionType } from '../types';

export default function StatisticsScreen() {
  const { transactions } = useWallet();
  const [tab, setTab] = useState<TransactionType>('expense'); // 'expense' | 'income'

  // ── Month navigation ──────────────────────────────────────────────────────
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month
  const selectedMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(1);
    return d;
  }, [monthOffset]);

  // ── Filter transactions to selected month ─────────────────────────────────
  const monthlyTxs = useMemo(() => {
    return transactions.filter((tx) => {
      const d = tx.date && (tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date as any);
      return (
        d.getMonth()    === selectedMonth.getMonth() &&
        d.getFullYear() === selectedMonth.getFullYear()
      );
    });
  }, [transactions, selectedMonth]);

  // ── Category totals for current tab & month ───────────────────────────────
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTxs.filter((t) => t.type === tab).forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [monthlyTxs, tab]);

  // ── Bar chart data (last 7 days) ──────────────────────────────────────────
  const barData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return days.map((day) => {
      const total = transactions
        .filter((tx) => {
          const txDate = tx.date && (tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date as any);
          return (
            tx.type === tab &&
            txDate.toDateString() === day.toDateString()
          );
        })
        .reduce((s, tx) => s + tx.amount, 0);
      return {
        value: total,
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        frontColor: total > 0 ? Colors.accent1 : Colors.border,
      };
    });
  }, [transactions, tab]);

  const totalForMonth = monthlyTxs
    .filter((t) => t.type === tab)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.pageTitle}>Statistics</Text>

        {/* Month Selector */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setMonthOffset((m) => m - 1)} style={styles.monthBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthYear(selectedMonth)}</Text>
          <TouchableOpacity
            onPress={() => setMonthOffset((m) => Math.min(m + 1, 0))}
            style={styles.monthBtn}
            disabled={monthOffset === 0}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={monthOffset === 0 ? Colors.textDim : Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Type Tab */}
        <View style={styles.tabRow}>
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total {tab === 'income' ? 'Income' : 'Expenses'}</Text>
          <Text style={[styles.totalAmount, { color: tab === 'income' ? Colors.income : Colors.expense }]}>
            {formatCurrency(totalForMonth)}
          </Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 7 Days</Text>
          {barData.some((d) => d.value > 0) ? (
            <BarChart
              data={barData}
              barWidth={28}
              spacing={16}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: Colors.textDim, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value), 1)}
              isAnimated
            />
          ) : (
            <View style={styles.noChart}>
              <MaterialCommunityIcons name="chart-bar" size={40} color={Colors.textDim} />
              <Text style={styles.noChartTxt}>No data for this period</Text>
            </View>
          )}
        </View>

        {/* Category Grid */}
        <Text style={styles.sectionTitle}>
          Top {tab === 'income' ? 'Income' : 'Spending'} Categories
        </Text>
        {categoryTotals.length === 0 ? (
          <View style={styles.noData}>
            <MaterialCommunityIcons name="chart-pie" size={40} color={Colors.textDim} />
            <Text style={styles.noChartTxt}>No data yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {categoryTotals.map((item) => (
              <CategoryCard key={item.category} categoryId={item.category} total={item.total} type={tab} />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  scroll:      { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  pageTitle:   { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, paddingTop: Spacing.md, marginBottom: Spacing.md },
  monthRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  monthBtn:    { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  monthLabel:  { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  tabRow:      { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  tabBtn:      { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabBtnActive:{ backgroundColor: Colors.accent1 },
  tabTxt:      { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tabTxtActive:{ color: Colors.white },
  totalCard:   { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  totalLabel:  { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  totalAmount: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  chartCard:   { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  chartTitle:  { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  noChart:     { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  noChartTxt:  { color: Colors.textMuted, fontSize: FontSize.sm },
  sectionTitle:{ color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  noData:      { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
});
