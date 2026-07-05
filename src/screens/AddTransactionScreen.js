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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.typeButtonActive,
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
              type === 'income' && styles.typeButtonActive,
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
        <View style={styles.form}>
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: fontSizes.sm, fontWeight: '500', color: colors.dark, marginBottom: spacing.xs }}>Jumlah</Text>
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
          >
            <Text
              style={[
                styles.categoryPickerText,
                !category && styles.categoryPickerPlaceholder,
              ]}
            >
              {category || 'Pilih kategori'}
            </Text>
            <Text style={styles.categoryPickerArrow}>▼</Text>
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
            >
              <Text style={styles.categoryPickerText}>{date}</Text>
              <Text style={styles.categoryPickerArrow}>📅</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePicker, errors.date && styles.categoryPickerError]}
              disabled={loading}
            >
              <Text style={styles.categoryPickerText}>{date}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.dateHint}>{Platform.OS === 'web' ? 'Klik untuk membuka kalender dan pilih tanggal' : 'ketuk untuk memilih tanggal'}</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
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
                  <Text style={styles.categoryOptionText}>{item}</Text>
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
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.calendarTitle}>{getMonthTitle(calendarMonth)}</Text>

              <TouchableOpacity
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavText}>›</Text>
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
    backgroundColor: colors.white,
  },

  typeSelector: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },

  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },

  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  typeButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.darkGray,
  },

  typeButtonTextActive: {
    color: colors.white,
  },

  form: {
    padding: spacing.lg,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.dark,
    marginBottom: spacing.xs,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },

  rpLabel: {
    marginRight: spacing.sm,
    color: colors.dark,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },

  amountInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.dark,
    paddingVertical: spacing.md,
  },

  datePicker: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },

  datePickerInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
    fontSize: fontSizes.base,
    color: colors.dark,
  },

  dateHint: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
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
    backgroundColor: colors.light,
  },

  calendarNavText: {
    fontSize: fontSizes['2xl'],
    color: colors.dark,
    lineHeight: 40,
  },

  calendarTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.dark,
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
    color: colors.darkGray,
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
    color: colors.dark,
    fontWeight: '600',
  },

  calendarDayTextMuted: {
    color: colors.darkGray,
  },

  calendarDayTextToday: {
    color: colors.primary,
  },

  calendarDayTextSelected: {
    color: colors.white,
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
    backgroundColor: colors.light,
    alignItems: 'center',
  },

  calendarPrimaryButton: {
    backgroundColor: colors.primary,
  },

  calendarFooterButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.dark,
  },

  calendarPrimaryButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.white,
  },

  categoryPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },

  categoryPickerError: {
    borderColor: colors.danger,
  },

  categoryPickerText: {
    fontSize: fontSizes.base,
    color: colors.dark,
  },

  categoryPickerPlaceholder: {
    color: colors.mediumGray,
  },

  categoryPickerArrow: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
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
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.lg,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.dark,
  },

  modalClose: {
    fontSize: fontSizes.xl,
    color: colors.darkGray,
  },

  categoryOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  categoryOptionText: {
    fontSize: fontSizes.base,
    color: colors.dark,
  },
});

export default AddTransactionScreen;
