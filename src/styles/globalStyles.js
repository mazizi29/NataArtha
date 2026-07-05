import { Platform, StyleSheet } from 'react-native';

const shadowStyle = Platform.select({
  web: {
    boxShadow: '0px 12px 34px rgba(0, 0, 0, 0.24)',
  },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
});

export const colors = {
  primary: '#C9A84C',
  secondary: '#131C2B',
  accent: '#1A2438',
  sidebar: '#060910',
  success: '#2DD4AE',
  danger: '#FF6B6B',
  warning: '#E8C96A',
  info: '#6B9FFF',
  background: '#080B14',
  surface: '#0E1420',
  surfaceAlt: '#131C2B',
  card: '#0E1420',
  light: '#131C2B',
  lightGray: 'rgba(255,255,255,0.06)',
  mediumGray: '#8B95A9',
  muted: '#8B95A9',
  darkGray: '#8B95A9',
  dark: '#EDF0F7',
  black: '#000000',
  overlay: 'rgba(8, 11, 20, 0.82)',
  white: '#FFFFFF',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(201,168,76,0.18)',
  focusRing: 'rgba(201,168,76,0.42)',
  successSoft: 'rgba(45,212,174,0.12)',
  dangerSoft: 'rgba(255,107,107,0.10)',
  warningSoft: 'rgba(201,168,76,0.12)',
  primarySoft: 'rgba(201,168,76,0.12)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const fontFamily = {
  regular: 'DMSans_400Regular',
  italic: 'DMSans_400Regular_Italic',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 28,
  full: 9999, // For fully rounded elements (pills, circles)
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  screenBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  heading2: {
    fontSize: fontSizes['2xl'],
    fontFamily: fontFamily.bold,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: spacing.md,
  },

  heading3: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: fontSizes.base,
    fontFamily: fontFamily.regular,
    color: colors.darkGray,
    marginBottom: spacing.md,
  },

  label: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.base,
    fontFamily: fontFamily.regular,
    color: colors.dark,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
  },

  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#1A2438',
  },

  // Button styles
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },

  buttonPrimaryText: {
    fontFamily: fontFamily.bold,
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },

  buttonSecondaryText: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginVertical: spacing.sm,
    ...shadowStyle,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    ...shadowStyle,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadowStyle,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },

  chipText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.dark,
  },

  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },

  pillText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.darkGray,
  },

  // Status colors
  textSuccess: {
    color: colors.success,
  },

  textDanger: {
    color: colors.danger,
  },

  textWarning: {
    color: colors.warning,
  },

  textInfo: {
    color: colors.info,
  },

  mutedText: {
    color: colors.mediumGray,
  },

  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  // Loading indicator
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: fontSizes.base,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
});

export default globalStyles;
