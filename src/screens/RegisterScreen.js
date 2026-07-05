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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { colors, spacing, fontSizes } from '../styles/globalStyles';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth(); // Register function dari context
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../Aset/Asset 1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>NataArtha</Text>
          <Text style={styles.subtitle}>Daftar untuk memulai mencatat keuanganmu</Text>
        </View>

        {/* Form */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Masuk di sini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },

  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },

  logo: {
    width: 64,
    height: 64,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: fontSizes['2xl'],
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
    marginBottom: spacing.lg,
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
});

export default RegisterScreen;
