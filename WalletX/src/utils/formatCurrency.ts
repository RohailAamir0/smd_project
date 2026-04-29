/**
 * Formats a number as a USD currency string.
 * e.g.  1234.5  →  "$1,234.50"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale:   string = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Sign-aware display string for transaction cards.
 * Income → "+ $50.00"   Expense → "- $50.00"
 */
export function formatTransactionAmount(amount: number, type: 'income' | 'expense'): string {
  const formatted = formatCurrency(Math.abs(amount));
  return type === 'income' ? `+ ${formatted}` : `- ${formatted}`;
}

/**
 * Compact notation for large numbers on the balance card.
 * e.g. 1234567 → "$1.2M"
 */
export function formatCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style:                'currency',
    currency:             'USD',
    notation:             'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}
