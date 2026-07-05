// src/screens/RegisterScreen.js
// Layar registrasi user

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

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth(); // Register function dari context
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 960;
  const isCompactMobile = width < 390;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validasi form
  const validateForm = () => {
    const newErrors = {};

    if (!name) {
      newErrors.name = 'Nama harus diisi';
    } else if (name.length < 3) {
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

  // Handle register
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register(name, email, password);

      if (result.success) {
        // Navigation akan berubah otomatis via AuthContext
      } else {
        Alert.alert('Pendaftaran Gagal', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat mendaftar');
      console.error('Register error:', error);
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
                <Text style={styles.brandPillText}>Bergabung sekarang</Text>
              </View>
              <View style={styles.header}>
                <Image
                  source={require('../../Aset/Asset 1.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Mulai catat keuangan dari hari pertama.</Text>
                <Text style={styles.subtitle}>
                  Buat akun untuk melihat grafik, transaksi, dan saldo secara sinkron di web maupun mobile.
                </Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureChip}>
                  <Text style={styles.featureChipText}>Aman</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureChipText}>Cepat</Text>
                </View>
                <View style={styles.featureChip}>
                  <Text style={styles.featureChipText}>Responsif</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.formColumn, isWideLayout && styles.formColumnWide]}>
            <View style={[styles.registerCard, isCompactMobile && styles.registerCardCompact]}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Daftar akun baru</Text>
                <Text style={styles.formSubtitle}>Isi data berikut untuk memulai pencatatan finansial yang lebih rapi.</Text>
              </View>

              <View style={styles.form}>
                <InputField
                  label="Nama Lengkap"
                  placeholder="Masukkan nama Anda"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                  editable={!loading}
                />

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
                  placeholder="Masukkan password (min 6 karakter)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  editable={!loading}
                />

                <InputField
                  label="Konfirmasi Password"
                  placeholder="Masukkan ulang password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  error={errors.confirmPassword}
                  editable={!loading}
                />

                <ButtonPrimary
                  title="Daftar"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Sudah punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkText}>Masuk di sini</Text>
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

  header: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  logo: {
    width: 72,
    height: 72,
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

  registerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  registerCardCompact: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
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

  form: {
    marginTop: spacing.md,
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
});

export default RegisterScreen;
