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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { colors, spacing, fontSizes, borderRadius, globalStyles } from '../styles/globalStyles';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.loginCard}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../Aset/Asset 1.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>NataArtha</Text>
            <Text style={styles.subtitle}>Sedikit tapi pasti, catat keuanganmu mulai hari ini.</Text>
          </View>

          {/* Form */}
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },

  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },

  loginCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'], // Using design token instead of hardcoded 20
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.lightGray,
    ...globalStyles.card,
  },

  logo: {
    width: 64,
    height: 64,
    marginBottom: spacing.sm,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  title: {
    fontSize: fontSizes['3xl'],
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: fontSizes.base,
    color: colors.darkGray,
    textAlign: 'center',
  },

  form: {
    marginVertical: spacing.lg,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  footerText: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
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
