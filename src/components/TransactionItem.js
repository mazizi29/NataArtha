import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';
import { formatCurrency } from '../utils/formatCurrency';

const shadowStyle = Platform.select({
  web: {
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
  },
  default: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});

const TransactionItem = ({
  id,
  category,
  amount,
  date,
  note,
  onPress,
  onDelete,
  onEdit,
  type = 'expense',
}) => {
  const getCategoryIcon = () => {
    const icons = {
      // Expense
      Makanan: '🍔',
      Minuman: '🥤',
      Jajan: '🍟',
      Pakaian: '👕',
      Obat: '💊',
      Transportasi: '🚗',
      Hiburan: '🎮',
      Kesehatan: '🏥',
      Belanja: '🛍️',
      Tagihan: '💡',
      Pendidikan: '🎓',
      Asuransi: '🛡️',
      Pinjaman: '🏦',

      // Income
      Gaji: '💰',
      Tabungan: '🏦',
      Bonus: '🎁',
      Investasi: '📈',
      Usaha: '🏪',
      Hadiah: '🎉',
      Freelance: '💻',
      Sewa: '🏠',
      Dividen: '💹',
      Pengembalian: '↩️',

      // Default
      Lainnya: '📝',
      Other: '📝',
    };
    
    return icons[category] || '📌';
  };

  const isExpense = type === 'expense';
  const amountColor = isExpense ? colors.danger : colors.success;
  const amountPrefix = isExpense ? '- ' : '+ ';
  const parsedDate = new Date(date);
  const displayDate = Number.isNaN(parsedDate.getTime())
    ? (date || '-')
    : parsedDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.leftContent}>
        <Text style={styles.categoryIcon}>{getCategoryIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>
          <Text style={styles.note} numberOfLines={1}>
            {note || 'No note'}
          </Text>
          <Text style={styles.date}>{displayDate}</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(amount)}
        </Text>
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit({ id, category, amount, date, note, type })}
              style={styles.editButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadowStyle,
    elevation: 2,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: fontSizes['2xl'],
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  category: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  note: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSizes.xs,
    color: colors.darkGray, // Changed from lightGray for better contrast (WCAG AA: ~5.7:1)
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.light,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  amount: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteText: {
    fontSize: fontSizes.lg,
    color: colors.danger,
    fontWeight: '700',
  },
});

export default TransactionItem;
