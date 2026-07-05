import React from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';

const shadowStyle = Platform.select({
  web: {
    boxShadow: '0px 10px 24px rgba(201, 168, 76, 0.20)',
  },
  default: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
});

const ButtonPrimary = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'danger':
        return styles.buttonDanger;
      case 'success':
        return styles.buttonSuccess;
      default:
        return styles.buttonPrimary;
    }
  };

  const getVariantTextStyle = () => {
    if (variant === 'secondary') return styles.buttonSecondaryText;
    if (variant === 'danger' || variant === 'success') return styles.buttonOnColorText;
    return styles.buttonPrimaryText;
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.buttonSmall;
      case 'lg':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.buttonDisabled,
        fullWidth && styles.buttonFullWidth,
        !disabled && shadowStyle,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#080B14' : variant === 'secondary' ? colors.primary : colors.white}
          size="small"
        />
      ) : (
        <Text style={[getVariantTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDisabled: {
    opacity: 0.56,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonMedium: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  buttonLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonPrimaryText: {
    color: '#080B14',
    fontWeight: '800',
    fontSize: fontSizes.base,
    letterSpacing: 0,
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSizes.base,
    letterSpacing: 0,
  },
  buttonOnColorText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: fontSizes.base,
    letterSpacing: 0,
  },
});

export default ButtonPrimary;
