import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';

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
    return variant === 'secondary' ? styles.buttonSecondaryText : styles.buttonPrimaryText;
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
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? colors.primary : colors.white}
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
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonMedium: {
    paddingVertical: spacing.md,
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
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSizes.base,
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSizes.base,
  },
});

export default ButtonPrimary;
