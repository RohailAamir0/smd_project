import { StyleSheet } from 'react-native';
import Colors from './colors';

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   20,
  xl:   28,
  full: 9999,
} as const;

// ─── Font Sizes ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   18,
  xl:   22,
  xxl:  28,
  hero: 36,
} as const;

// ─── Font Weights ─────────────────────────────────────────────────────────────
export const FontWeight = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor:   Colors.accent1,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius:  12,
    elevation:     8,
  },
  button: {
    shadowColor:   Colors.accent1,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  16,
    elevation:     12,
  },
} as const;

// ─── Global Reusable Styles ───────────────────────────────────────────────────
export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  rowBetween: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
  },
  sectionTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
    marginBottom: Spacing.md,
  },
  textMuted: {
    fontSize: FontSize.sm,
    color:    Colors.textMuted,
  },
  centered: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});
