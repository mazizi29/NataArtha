import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  prefix,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  error,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, style]}
          placeholder={placeholder}
          placeholderTextColor={colors.mediumGray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || placeholder}
          accessibilityState={{ disabled: !editable }}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    minHeight: 56,
  },
  prefix: {
    marginRight: spacing.sm,
    color: colors.primary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  inputWrapperDisabled: {
    opacity: 0.64,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.white,
    paddingVertical: spacing.md,
  },
  multilineInput: {
    paddingVertical: spacing.md,
    minHeight: 112,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default InputField;
