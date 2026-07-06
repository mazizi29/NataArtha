import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';
import AppIcon from './AppIcon';

const AuthInput = ({
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
}) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isSecure = secureTextEntry && !visible;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          error && styles.inputShellError,
          !editable && styles.inputShellDisabled,
        ]}
      >
        <View style={styles.inputIcon}>
          <AppIcon
            name={icon}
            size={20}
            color={focused ? colors.primary : '#93A0B9'}
            strokeWidth={2}
          />
        </View>
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          accessibilityLabel={label}
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

  input: {
    flex: 1,
    minWidth: 0,
    color: colors.white,
    fontSize: fontSizes.base,
    paddingVertical: spacing.md,
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
  },
});

export default AuthInput;
