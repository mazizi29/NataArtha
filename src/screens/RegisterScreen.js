// src/screens/RegisterScreen.js
// Layar registrasi user

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthInput from '../components/AuthInput';
import BackgroundGrid from '../components/BackgroundGrid';
import { colors, spacing, fontSizes, borderRadius } from '../styles/globalStyles';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { width } = useWindowDimensions();
  const isCompactMobile = width < 390;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!name) {
      newErrors.name = 'Nama harus diisi';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    if (!email) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password harus diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setAuthError('');
    try {
      const result = await register(name.trim(), email.trim(), password);

      if (!result.success) {
        setAuthError(result.error || 'Pendaftaran gagal. Silakan coba lagi.');
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <BackgroundGrid />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          isCompactMobile && styles.scrollContentCompact,
        ]}
      >
        <View style={styles.authShell}>
          <View style={styles.brandHeader}>
            <View style={styles.brandMark}>
              <Image
                source={require('../../Aset/Asset 2.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>NataArtha</Text>
            <Text style={styles.brandSubtitle}>Buat akun keuangan pribadi kamu</Text>
          </View>

          <View style={[styles.card, isCompactMobile && styles.cardCompact]}>
            <AuthInput
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap kamu"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setAuthError('');
              }}
              autoCapitalize="words"
              textContentType="name"
              error={errors.name}
              editable={!loading}
              icon="user"
            />

            <AuthInput
              label="Email"
              placeholder="Masukkan email kamu"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setAuthError('');
              }}
              keyboardType="email-address"
              textContentType="emailAddress"
              error={errors.email}
              editable={!loading}
              icon="mail"
            />

            <AuthInput
              label="Password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setAuthError('');
              }}
              secureTextEntry
              textContentType="newPassword"
              error={errors.password}
              editable={!loading}
              icon="lock"
            />

            <AuthInput
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setAuthError('');
              }}
              secureTextEntry
              textContentType="newPassword"
              error={errors.confirmPassword}
              editable={!loading}
              icon="lock"
            />

            {authError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed, hovered }) => [
                styles.primaryButton,
                (pressed || hovered) && !loading && styles.primaryButtonActive,
                loading && styles.primaryButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#080B14" />
              ) : (
                <Text style={styles.primaryButtonText}>Daftar</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed, hovered }) => [
                styles.linkHit,
                (pressed || hovered) && styles.linkHitActive,
              ]}
              accessibilityRole="link"
            >
              <Text style={styles.linkText}>Masuk sekarang</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  scrollContentCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },

  authShell: {
    width: '100%',
    maxWidth: 530,
    alignItems: 'center',
  },

  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  brandMark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0px 18px 44px rgba(201,168,76,0.20)',
      },
      default: {
        elevation: 8,
      },
    }),
  },

  brandLogo: {
    width: 34,
    height: 34,
  },

  brandName: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },

  brandSubtitle: {
    color: '#A8B5D6',
    fontSize: fontSizes.lg,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(14,20,32,0.94)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.16)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    ...Platform.select({
      web: {
        boxShadow: '0px 24px 70px rgba(0,0,0,0.32)',
      },
      default: {
        elevation: 8,
      },
    }),
  },

  cardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },

  errorBanner: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.32)',
    backgroundColor: colors.dangerSoft,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },

  errorBannerText: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },

  primaryButton: {
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...Platform.select({
      web: {
        transitionDuration: '160ms',
        boxShadow: '0px 18px 44px rgba(201,168,76,0.22)',
      },
      default: {
        elevation: 5,
      },
    }),
  },

  primaryButtonActive: {
    transform: [{ translateY: -1 }],
    backgroundColor: '#E4C763',
  },

  primaryButtonDisabled: {
    opacity: 0.62,
  },

  primaryButtonText: {
    color: '#080B14',
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
  },

  footerText: {
    color: '#A8B5D6',
    fontSize: fontSizes.base,
  },

  linkHit: {
    borderRadius: borderRadius.md,
  },

  linkHitActive: {
    backgroundColor: 'rgba(201,168,76,0.08)',
  },

  linkText: {
    color: colors.primary,
    fontSize: fontSizes.base,
    fontWeight: '900',
  },
});

export default RegisterScreen;
