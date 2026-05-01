// Convenience re-export + category-filtered selector hook

import { useMemo } from "react";
import { useWallet } from "../context/WalletContext";
import type { Transaction, TransactionType } from "../types";

export { useWallet as useTransactions };

interface FilterOptions {
  type?: TransactionType;
  category?: string;
}

/**
 * Returns transactions filtered by type and/or category.
 *
 * @param {FilterOptions} filters
 */
export function useFilteredTransactions(
  filters: FilterOptions = {},
): Transaction[] {
  const { transactions } = useWallet();

  return useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.type && tx.type !== filters.type) return false;
      if (filters.category && tx.category !== filters.category) return false;
      return true;
    });
  }, [transactions, filters.type, filters.category]);
}

/**
 * Groups transactions by category and returns sorted spending totals.
 * Used in the Statistics screen.
 *
 * @param {TransactionType} type
 */
export function useCategoryTotals(
  type: TransactionType,
): { category: string; total: number }[] {
  const { transactions } = useWallet();

  return useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((tx) => tx.type === type)
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      });

    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, type]);
}
