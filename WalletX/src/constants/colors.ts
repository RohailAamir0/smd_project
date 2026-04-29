// ─── WalletX Color Palette ────────────────────────────────────────────────────
const Colors = {
  // Backgrounds
  background: '#0A0A0F',
  surface:    '#13131A',
  card:       '#1C1C28',

  // Accents
  accent1:     '#7C3AED',      // Purple — primary
  accent2:     '#3B82F6',      // Blue — secondary
  accentGlow:  '#7C3AED33',   // Purple glow for shadows/overlays

  // Semantic
  income:      '#10B981',      // Green
  incomeLight: '#10B98120',
  expense:     '#EF4444',      // Red
  expenseLight:'#EF444420',

  // Text
  text:        '#FFFFFF',
  textMuted:   '#9CA3AF',
  textDim:     '#6B7280',

  // Borders
  border:      '#2A2A3A',
  divider:     '#1E1E2E',

  // Gradients — pass as `colors` prop to <LinearGradient>
  gradientPrimary: ['#7C3AED', '#3B82F6'] as [string, string],
  gradientCard:    ['#1C1C28', '#13131A'] as [string, string],
  gradientDark:    ['#0A0A0F', '#13131A'] as [string, string],

  // Misc
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
  overlay:     'rgba(0,0,0,0.6)',
} as const;

export type ColorsType = typeof Colors;
export default Colors;
