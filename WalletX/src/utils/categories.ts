// ─── Transaction Categories ───────────────────────────────────────────────────
import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  // ── Expense Categories ──────────────────────────────────────────────────────
  { id: 'food',          label: 'Food',           icon: 'food-fork-drink',     color: '#F59E0B', type: 'expense' },
  { id: 'transport',     label: 'Transport',       icon: 'car-outline',         color: '#3B82F6', type: 'expense' },
  { id: 'shopping',      label: 'Shopping',        icon: 'shopping-outline',    color: '#EC4899', type: 'expense' },
  { id: 'entertainment', label: 'Entertainment',   icon: 'gamepad-variant',     color: '#8B5CF6', type: 'expense' },
  { id: 'health',        label: 'Health',          icon: 'heart-pulse',         color: '#EF4444', type: 'expense' },
  { id: 'bills',         label: 'Bills',           icon: 'file-document',       color: '#F97316', type: 'expense' },
  { id: 'education',     label: 'Education',       icon: 'school-outline',      color: '#06B6D4', type: 'expense' },
  { id: 'travel',        label: 'Travel',          icon: 'airplane',            color: '#10B981', type: 'expense' },
  { id: 'other_exp',     label: 'Other',           icon: 'dots-horizontal',     color: '#6B7280', type: 'expense' },

  // ── Income Categories ───────────────────────────────────────────────────────
  { id: 'salary',        label: 'Salary',          icon: 'cash-multiple',       color: '#10B981', type: 'income'  },
  { id: 'freelance',     label: 'Freelance',       icon: 'laptop',              color: '#3B82F6', type: 'income'  },
  { id: 'investment',    label: 'Investment',      icon: 'trending-up',         color: '#7C3AED', type: 'income'  },
  { id: 'gift',          label: 'Gift',            icon: 'gift-outline',        color: '#EC4899', type: 'income'  },
  { id: 'other_inc',     label: 'Other',           icon: 'plus-circle-outline', color: '#6B7280', type: 'income'  },
];

/**
 * Returns category metadata by id.
 * Falls back to a generic "Other" entry if id is unknown.
 */
export function getCategoryById(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) ?? {
      id:    'other_exp',
      label: 'Other',
      icon:  'dots-horizontal',
      color: '#6B7280',
      type:  'expense',
    }
  );
}

/** Returns only expense categories */
export const EXPENSE_CATEGORIES: Category[] = CATEGORIES.filter((c) => c.type === 'expense');

/** Returns only income categories */
export const INCOME_CATEGORIES: Category[] = CATEGORIES.filter((c) => c.type === 'income');
