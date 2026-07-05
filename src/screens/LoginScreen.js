// src/screens/LoginScreen.js
// Layar login user

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { colors, spacing, fontSizes, borderRadius } from '../styles/globalStyles';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 960;
  const isCompactMobile = width < 390;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  // Validasi form
  const validateForm = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setAuthError('');
    try {
      const result = await login(email, password);

      if (!result.success) {
        setAuthError(result.error || 'Terjadi kesalahan');
        Alert.alert('Login Gagal', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan saat login');
      Alert.alert('Error', 'Terjadi kesalahan saat login');
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isCompactMobile && styles.scrollContentCompact,
          isWideLayout && styles.scrollContentWide,
        ]}
      >
        <View style={[styles.layout, isWideLayout && styles.layoutWide]}>
          <View style={[styles.heroColumn, isWideLayout && styles.heroColumnWide]}>
            <View style={[styles.heroCard, isCompactMobile && styles.heroCardCompact]}>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>NataArtha</Text>
              </View>
              <View style={styles.header}>
                <Image
                  source={require('../../Aset/Asset 1.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Kelola uang dengan ritme yang lebih tenang.</Text>
                <Text style={styles.subtitle}>
                  Pemasukan, pengeluaran, dan riwayat transaksi hadir dalam satu tampilan yang cepat dibaca.
                </Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureChip}>
                  <Text style={styles.featureChipText}>Realtime</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureChipText}>Web & mobile</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureChipText}>Sinkron aman</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.formColumn, isWideLayout && styles.formColumnWide]}>
            <View style={[styles.loginCard, isCompactMobile && styles.loginCardCompact]}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Masuk ke akun kamu</Text>
                <Text style={styles.formSubtitle}>Lanjutkan dari perangkat mana pun tanpa kehilangan konteks.</Text>
              </View>

              <View style={styles.form}>
                <InputField
                  label="Email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  error={errors.email}
                  editable={!loading}
                />

                <InputField
                  label="Password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  editable={!loading}
                />

                <ButtonPrimary
                  title="Masuk"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                />

                {authError ? <Text style={styles.authError}>{authError}</Text> : null}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Belum punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.linkText}>Daftar di sini</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },

  scrollContentCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },

  scrollContentWide: {
    alignItems: 'center',
  },

  layout: {
    width: '100%',
    gap: spacing.lg,
  },

  layoutWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    maxWidth: 1180,
  },

  heroColumn: {
    width: '100%',
  },

  heroColumnWide: {
    flex: 1.08,
  },

  formColumn: {
    width: '100%',
  },

  formColumnWide: {
    flex: 0.92,
    justifyContent: 'center',
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 320,
    justifyContent: 'space-between',
  },

  heroCardCompact: {
    minHeight: 0,
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
  },

  brandPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },

  brandPillText: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  loginCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loginCardCompact: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
  },

  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
  },

  header: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.sm,
    lineHeight: 34,
  },

  subtitle: {
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'left',
    lineHeight: 22,
  },

  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  featureChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },

  featureChipText: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },

  form: {
    marginTop: spacing.md,
  },

  formHeader: {
    marginBottom: spacing.md,
  },

  formTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },

  formSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },

  footerText: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },

  linkText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  authError: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoginScreen;
