import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';
import AppIcon from './AppIcon';

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  error,
  autoCapitalize = 'none',
  textContentType,
  icon,
  prefix,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isSecure = secureTextEntry && !visible;

  return (
    <View style={[styles.field, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          focused && styles.inputShellFocused,
          error && styles.inputShellError,
          !editable && styles.inputShellDisabled,
        ]}
      >
        {icon ? (
          <View style={styles.inputIcon}>
            <AppIcon
              name={icon}
              size={20}
              color={focused ? colors.primary : '#93A0B9'}
              strokeWidth={2}
            />
          </View>
        ) : null}
        
        {prefix ? (
          <Text style={styles.prefix}>{prefix}</Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(139,149,169,0.62)"
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          editable={editable}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.multilineInput]}
          accessibilityLabel={label || placeholder}
          accessibilityState={{ disabled: !editable, invalid: !!error }}
        />
        
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((current) => !current)}
            disabled={!editable}
            style={({ pressed, hovered }) => [
              styles.visibilityButton,
              (pressed || hovered) && styles.visibilityButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            <AppIcon
              name={visible ? 'eyeOff' : 'eye'}
              size={18}
              color="#A8B5D6"
              strokeWidth={2}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },

  label: {
    color: '#A8B5D6',
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  inputShell: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: 'rgba(168,181,214,0.16)',
    borderRadius: borderRadius.xl,
    backgroundColor: '#131C2B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  inputShellMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },

  inputShellFocused: {
    borderColor: colors.primary,
    backgroundColor: '#172237',
  },

  inputShellError: {
    borderColor: colors.danger,
  },

  inputShellDisabled: {
    opacity: 0.62,
  },

  inputIcon: {
    width: 28,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  prefix: {
    marginRight: spacing.sm,
    color: colors.primary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  input: {
    flex: 1,
    minWidth: 0,
    color: colors.white,
    fontSize: fontSizes.base,
    paddingVertical: spacing.md,
  },

  multilineInput: {
    minHeight: 112,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },

  visibilityButton: {
    minWidth: 54,
    minHeight: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  visibilityButtonActive: {
    backgroundColor: 'rgba(201,168,76,0.10)',
  },

  errorText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default CustomInput;
