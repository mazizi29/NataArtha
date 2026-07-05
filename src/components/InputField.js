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
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
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
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    marginRight: spacing.sm,
    color: colors.dark,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.dark,
    paddingVertical: spacing.md,
  },
  multilineInput: {
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

export default InputField;
