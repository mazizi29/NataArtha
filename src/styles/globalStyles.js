import { Platform, StyleSheet } from 'react-native';

const shadowStyle = Platform.select({
  web: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.10)',
  },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export const colors = {
  primary: '#1E88E5',
  secondary: '#64B5F6', // Changed from FFC107 (yellow) to light blue for distinction
  success: '#10B981',
  danger: '#EF4444',
  warning: '#FFC107',
  // Removed 'info' alias (was duplicate of primary)
  light: '#F8F9FA',
  lightGray: '#DEE2E6',
  mediumGray: '#ADB5BD',
  darkGray: '#495057',
  dark: '#212529',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.45)',
  white: '#FFFFFF',
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
  // Note: For actual font loading, use expo-font in App.js or AppNavigator
  // import * as Font from 'expo-font';
  // await Font.loadAsync({ 'inter-regular': require('./assets/Inter-Regular.ttf') });
  regular: 'System', // Fallback to system font; override with Inter when loaded
  medium: 'System', // Fallback
  semibold: 'System', // Fallback
  bold: 'System', // Fallback
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20, // For card corners and larger rounded elements
  full: 9999, // For fully rounded elements (pills, circles)
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },

  heading2: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.md,
  },

  heading3: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: fontSizes.base,
    color: colors.darkGray,
    marginBottom: spacing.md,
  },

  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
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
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.dark,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },

  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.light,
  },

  // Button styles
  button: {
    // Base button style - reuse for consistent padding and layout
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },

  buttonPrimary: {
    // Extends button with primary color
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },

  buttonPrimaryText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  buttonSecondary: {
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },

  buttonSecondaryText: {
    color: colors.primary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadowStyle,
    elevation: 3,
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

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
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
  },
});

export default globalStyles;
