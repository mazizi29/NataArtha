import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';
import { formatCurrency } from '../utils/formatCurrency';
import AppIcon from './AppIcon';
import CategoryIcon from './CategoryIcon';

const shadowStyle = Platform.select({
  web: {
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.16)',
  },
  default: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
});

const TransactionItem = ({
  id,
  category,
  iconName,
  amount,
  date,
  note,
  onPress,
  onDelete,
  onEdit,
  type = 'expense',
}) => {
  const { width } = useWindowDimensions();
  const isNarrowMobile = width < 380;
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
      activeOpacity={0.85}
      style={[styles.container, isNarrowMobile && styles.containerNarrow]}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${category}, ${formatCurrency(amount)}`}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconBadge, { backgroundColor: isExpense ? colors.dangerSoft : colors.successSoft }]}>
          <CategoryIcon category={category} iconName={iconName} size={22} color={isExpense ? colors.danger : colors.success} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>
          <Text style={styles.note} numberOfLines={1}>
            {note || 'Tidak ada catatan'}
          </Text>
          <Text style={styles.date}>{displayDate}</Text>
        </View>
      </View>

      <View style={[styles.rightContent, isNarrowMobile && styles.rightContentNarrow]}>
        <Text
          style={[styles.amount, isNarrowMobile && styles.amountNarrow, { color: amountColor }]}
          numberOfLines={isNarrowMobile ? 2 : 1}
        >
          {amountPrefix}{formatCurrency(amount)}
        </Text>
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit({ id, category, amount, date, note, type })}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel={`Edit transaksi ${category}`}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <AppIcon name="edit" size={14} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(id)}
              style={styles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel={`Hapus transaksi ${category}`}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <AppIcon name="trash" size={14} color={colors.danger} strokeWidth={2.2} />
              <Text style={styles.deleteText}>Hapus</Text>
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
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadowStyle,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 76,
  },
  containerNarrow: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryIcon: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    color: colors.white,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  note: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
    maxWidth: '42%',
  },
  rightContentNarrow: {
    width: '100%',
    maxWidth: '100%',
    marginLeft: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  editText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: '700',
  },
  amount: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  amountNarrow: {
    flex: 1,
    marginBottom: 0,
    textAlign: 'left',
  },
  deleteButton: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  deleteText: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    fontWeight: '800',
  },
});

export default TransactionItem;
