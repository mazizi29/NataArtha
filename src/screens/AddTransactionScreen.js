// src/screens/AddTransactionScreen.js
// Layar untuk menambah transaksi baru

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import * as api from '../services/api';
import { colors, spacing, fontSizes, borderRadius } from '../styles/globalStyles';
import { showToast } from '../utils/alertHelper';

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromISODate = (isoString) => {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getMonthTitle = (date) =>
  date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

const buildCalendarDays = (monthDate, selectedDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const totalDays = lastOfMonth.getDate();
  const cells = [];
  const todayIso = toISODate(new Date());
  const selectedIso = selectedDate ? toISODate(new Date(selectedDate)) : null;

  for (let i = 0; i < startOffset; i += 1) {
    const prevDate = new Date(year, month, -startOffset + i + 1);
    cells.push({
      key: `prev-${i}`,
      label: prevDate.getDate(),
      iso: toISODate(prevDate),
      outsideMonth: true,
      isToday: toISODate(prevDate) === todayIso,
      isSelected: toISODate(prevDate) === selectedIso,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const currentDate = new Date(year, month, day);
    const iso = toISODate(currentDate);
    cells.push({
      key: `day-${day}`,
      label: day,
      iso,
      outsideMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
    });
  }

  while (cells.length % 7 !== 0) {
    const nextDate = new Date(year, month, totalDays + (cells.length - startOffset - totalDays) + 1);
    const iso = toISODate(nextDate);
    cells.push({
      key: `next-${cells.length}`,
      label: nextDate.getDate(),
      iso,
      outsideMonth: true,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
    });
  }

  return cells;
};

const AddTransactionScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isCompactMobile = width < 390;
  const existingTransaction = route?.params?.transaction || null;
  const isEditMode = route?.params?.mode === 'edit' && !!existingTransaction?.id;
  const [amount, setAmount] = useState(''); // raw numeric string, no separators
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWebCalendar, setShowWebCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  React.useEffect(() => {
    if (!isEditMode || !existingTransaction) return;
    setAmount(String(existingTransaction.amount || ''));
    setCategory(existingTransaction.category || '');
    setDate(existingTransaction.date || toISODate(new Date()));
    setNote(existingTransaction.note || '');
    setType(existingTransaction.type || 'expense');
  }, [isEditMode, existingTransaction]);

  React.useEffect(() => {
    if (showWebCalendar) {
      const selectedDate = new Date(date);
      setCalendarMonth(Number.isNaN(selectedDate.getTime()) ? new Date() : selectedDate);
    }
  }, [showWebCalendar, date]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi',
    });
  }, [navigation, isEditMode]);

  const categories = {
    expense: [
      'Makanan', 'Minuman', 'Jajan', 'Transportasi', 'Hiburan', 
      'Kesehatan', 'Belanja', 'Tagihan', 'Pendidikan', 'Asuransi', 'Pinjaman', 'Lainnya'
    ],
    income: [
      'Gaji','Tabungan', 'Bonus',  'Investasi', 'Usaha', 'Hadiah',
      'Freelance', 'Sewa', 'Dividen', 'Pengembalian', 'Lainnya'
    ],
  };

  // Validasi form
  const validateForm = () => {
    const newErrors = {};

    if (!amount) {
      newErrors.amount = 'Jumlah harus diisi';
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0';
    }

    if (!category) {
      newErrors.category = 'Kategori harus dipilih';
    }

    if (!date) {
      newErrors.date = 'Tanggal harus diisi';
    } else if (Number.isNaN(new Date(date).getTime())) {
      newErrors.date = 'Format tanggal tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTransaction = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        amount: parseFloat(amount),
        category,
        date,
        note,
        type,
      };

      if (isEditMode) {
        await api.updateTransaction(existingTransaction.id, transactionData);
        showToast('Transaksi berhasil diubah', 'success');
      } else {
        await api.addTransaction(transactionData);
        showToast('Transaksi berhasil ditambahkan', 'success');
      }
      
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      showToast(error.message || 'Gagal menambahkan transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentCategories = categories[type];
  const calendarDays = buildCalendarDays(calendarMonth, date);
  const parsedSelectedDate = new Date(date);
  const displayDate = Number.isNaN(parsedSelectedDate.getTime())
    ? date
    : parsedSelectedDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, isCompactMobile && styles.scrollContentCompact]}
      >
        <View style={[styles.heroCard, isMobile && styles.heroCardMobile]}>
          <View>
            <Text style={styles.heroEyebrow}>{isEditMode ? 'Edit' : 'Transaksi Baru'}</Text>
            <Text style={styles.heroTitle}>
              {isEditMode ? 'Perbarui detail transaksi' : 'Catat transaksi dengan rapi'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Nominal, kategori, tanggal, dan catatan tersusun dalam satu alur yang cepat dibaca.
            </Text>
          </View>
          <View
            style={[
              styles.heroStatusPill,
              type === 'income' ? styles.heroStatusIncome : styles.heroStatusExpense,
            ]}
          >
            <Text
              style={[
                styles.heroStatusText,
                type === 'income' ? styles.heroStatusTextIncome : styles.heroStatusTextExpense,
              ]}
            >
              {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Text>
          </View>
        </View>

        {/* Type Selector */}
        <View style={[styles.typeSelector, isCompactMobile && styles.typeSelectorCompact]}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              isCompactMobile && styles.typeButtonCompact,
              type === 'expense' && styles.typeButtonActive,
              type === 'expense' && styles.typeButtonExpenseActive,
            ]}
            onPress={() => {
              setType('expense');
              setCategory('');
            }}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive,
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              isCompactMobile && styles.typeButtonCompact,
              type === 'income' && styles.typeButtonActive,
              type === 'income' && styles.typeButtonIncomeActive,
            ]}
            onPress={() => {
              setType('income');
              setCategory('');
            }}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive,
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={[styles.form, isCompactMobile && styles.formCompact]}>
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.fieldLabel}>Jumlah</Text>
            <View style={[styles.amountRow]}>
              <Text style={styles.rpLabel}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.mediumGray}
                value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '');
                  setAmount(cleaned);
                }}
                keyboardType="numeric"
                editable={!loading}
                accessibilityLabel="Jumlah transaksi"
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Category Picker */}
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            style={[
              styles.categoryPicker,
              errors.category && styles.categoryPickerError,
            ]}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Pilih kategori transaksi"
          >
            <Text
              style={[
                styles.categoryPickerText,
                !category && styles.categoryPickerPlaceholder,
              ]}
            >
              {category || 'Pilih kategori'}
            </Text>
              <Text style={styles.categoryPickerArrow}>Pilih</Text>
          </TouchableOpacity>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}

          <Text style={styles.fieldLabel}>Tanggal</Text>
          {Platform.OS === 'web' ? (
            <TouchableOpacity
              onPress={() => setShowWebCalendar(true)}
              style={[styles.datePicker, errors.date && styles.categoryPickerError]}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Pilih tanggal transaksi"
            >
              <Text style={styles.categoryPickerText}>{displayDate}</Text>
              <Text style={styles.categoryPickerArrow}>Pilih</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePicker, errors.date && styles.categoryPickerError]}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Pilih tanggal transaksi"
            >
              <Text style={styles.categoryPickerText}>{displayDate}</Text>
            </TouchableOpacity>
          )}
          {errors.date && (
            <Text style={styles.errorText}>{errors.date}</Text>
          )}

          <InputField
            label="Catatan (Opsional)"
            placeholder="Masukkan catatan"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            editable={!loading}
          />

          <View style={styles.buttonContainer}>
            <ButtonPrimary
              title={isEditMode ? 'Simpan Perubahan' : 'Tambah Transaksi'}
              onPress={handleAddTransaction}
              loading={loading}
              disabled={loading}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalClose}>x</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={currentCategories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <View
                    style={[
                      styles.categoryOptionIcon,
                      type === 'income' ? styles.categoryOptionIconIncome : styles.categoryOptionIconExpense,
                    ]}
                  >
                    <Text style={styles.categoryOptionIconText}>{item.slice(0, 1)}</Text>
                  </View>
                  <Text style={styles.categoryOptionText}>{item}</Text>
                  {category === item ? <Text style={styles.categoryOptionSelected}>Dipilih</Text> : null}
                </TouchableOpacity>
              )}
              scrollEnabled={true}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={Platform.OS === 'web' && showWebCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWebCalendar(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={[styles.calendarCard, isCompactMobile && styles.calendarCardCompact]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavText}>{'<'}</Text>
              </TouchableOpacity>

              <Text style={styles.calendarTitle}>{getMonthTitle(calendarMonth)}</Text>

              <TouchableOpacity
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavText}>{'>'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekRow}>
              {DAY_LABELS.map((label) => (
                <Text key={label} style={styles.calendarWeekLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.calendarDay,
                    day.outsideMonth && styles.calendarDayMuted,
                    day.isToday && styles.calendarDayToday,
                    day.isSelected && styles.calendarDaySelected,
                  ]}
                  onPress={() => {
                    setDate(day.iso);
                    setShowWebCalendar(false);
                  }}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      day.outsideMonth && styles.calendarDayTextMuted,
                      day.isToday && styles.calendarDayTextToday,
                      day.isSelected && styles.calendarDayTextSelected,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity
                onPress={() => setShowWebCalendar(false)}
                style={styles.calendarFooterButton}
              >
                <Text style={styles.calendarFooterButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDate(toISODate(new Date()));
                  setCalendarMonth(new Date());
                  setShowWebCalendar(false);
                }}
                style={[styles.calendarFooterButton, styles.calendarPrimaryButton]}
              >
                <Text style={styles.calendarPrimaryButtonText}>Hari Ini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker (uses community picker; install with `npx expo install @react-native-community/datetimepicker`) */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={date ? fromISODate(date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              const iso = toISODate(selectedDate);
              setDate(iso);
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  scrollContentCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  heroCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  heroCardMobile: {
    flexDirection: 'column',
  },

  heroEyebrow: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },

  heroTitle: {
    color: colors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  heroSubtitle: {
    color: colors.muted,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },

  heroStatusPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },

  heroStatusIncome: {
    backgroundColor: colors.successSoft,
  },

  heroStatusExpense: {
    backgroundColor: colors.dangerSoft,
  },

  heroStatusText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },

  heroStatusTextIncome: {
    color: colors.success,
  },

  heroStatusTextExpense: {
    color: colors.danger,
  },

  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginTop: spacing.md,
  },

  typeSelectorCompact: {
    gap: spacing.sm,
  },

  typeButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.card,
  },

  typeButtonCompact: {
    paddingHorizontal: spacing.sm,
  },

  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  typeButtonIncomeActive: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },

  typeButtonExpenseActive: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },

  typeButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.muted,
  },

  typeButtonTextActive: {
    color: colors.white,
  },

  form: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  formCompact: {
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    minHeight: 56,
  },

  rpLabel: {
    marginRight: spacing.sm,
    color: colors.primary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  amountInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.white,
    paddingVertical: spacing.md,
  },

  datePicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
  },

  datePickerInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.xs,
    fontSize: fontSizes.base,
    color: colors.white,
  },

  dateHint: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  calendarOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  calendarCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  calendarCardCompact: {
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },

  calendarNavText: {
    fontSize: fontSizes['2xl'],
    color: colors.white,
    lineHeight: 40,
  },

  calendarTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'capitalize',
  },

  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },

  calendarWeekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.muted,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarDay: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginBottom: 4,
  },

  calendarDayMuted: {
    opacity: 0.35,
  },

  calendarDayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },

  calendarDaySelected: {
    backgroundColor: colors.primary,
  },

  calendarDayText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    fontWeight: '600',
  },

  calendarDayTextMuted: {
    color: colors.muted,
  },

  calendarDayTextToday: {
    color: colors.primary,
  },

  calendarDayTextSelected: {
    color: '#080B14',
  },

  calendarFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  calendarFooterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },

  calendarPrimaryButton: {
    backgroundColor: colors.primary,
  },

  calendarFooterButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.white,
  },

  calendarPrimaryButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: '#080B14',
  },

  categoryPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
    minHeight: 56,
  },

  categoryPickerError: {
    borderColor: colors.danger,
  },

  categoryPickerText: {
    fontSize: fontSizes.base,
    color: colors.white,
    flex: 1,
    paddingRight: spacing.sm,
  },

  categoryPickerPlaceholder: {
    color: colors.mediumGray,
  },

  categoryPickerArrow: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },

  errorText: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },

  buttonContainer: {
    marginTop: spacing.lg,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingBottom: spacing.lg,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  modalContentCompact: {
    maxHeight: '88%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.white,
  },

  modalClose: {
    fontSize: fontSizes.xl,
    color: colors.muted,
  },

  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 58,
  },

  categoryOptionText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.white,
    fontWeight: '700',
  },

  categoryOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryOptionIconIncome: {
    backgroundColor: colors.successSoft,
  },

  categoryOptionIconExpense: {
    backgroundColor: colors.dangerSoft,
  },

  categoryOptionIconText: {
    color: colors.white,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  categoryOptionSelected: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
});

export default AddTransactionScreen;
