// src/screens/TransactionHistoryScreen.js
// Layar untuk melihat riwayat transaksi

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../services/api';
import BackgroundGrid from '../components/BackgroundGrid';
import AppIcon from '../components/AppIcon';
import TransactionItem from '../components/TransactionItem';
import { colors, spacing, fontSizes, borderRadius } from '../styles/globalStyles';
import { showConfirm, showToast } from '../utils/alertHelper';

const TransactionHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isCompactMobile = width < 390;

  // Fetch transaksi ketika screen fokus
  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchTransactions(1);
    }, [])
  );

  const fetchTransactions = async (pageNum) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await api.getTransactions({
        page: pageNum,
        limit: 20,
      });

      const data = Array.isArray(response) ? response : response.data || [];

      if (pageNum === 1) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }

      setHasMore(data.length >= 20);
      setPage(pageNum);
    } catch (error) {
      showToast('Gagal mengambil data transaksi', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTransactions(1);
  };

  // Handle load more
  const onLoadMore = () => {
    if (!loading && hasMore) {
      fetchTransactions(page + 1);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      'Hapus',
      'Batal'
    );
    
    if (confirmed) {
      try {
        await api.deleteTransaction(id);
        setTransactions((prev) =>
          prev.filter((transaction) => transaction.id !== id)
        );
        showToast('Transaksi berhasil dihapus', 'success');
      } catch (error) {
        showToast('Gagal menghapus transaksi', 'error');
      }
    }
  };

  const handleEdit = (transaction) => {
    navigation.navigate('AddTransaction', {
      mode: 'edit',
      transaction,
    });
  };

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const searchableText = `${transaction.category || ''} ${transaction.note || ''}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      return matchesType && matchesSearch;
    });
  }, [transactions, search, typeFilter]);

  const filteredSummary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.type === 'income') acc.income += amount;
        if (transaction.type === 'expense') acc.expense += amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const renderItem = ({ item }) => (
    <TransactionItem
      id={item.id}
      category={item.category}
      amount={item.amount}
      date={item.date}
      note={item.note}
      type={item.type}
      onPress={() => {
        // Tambahkan navigasi ke detail jika diperlukan
      }}
      onDelete={handleDelete}
      onEdit={handleEdit}
    />
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {transactions.length ? 'Tidak ada transaksi ditemukan' : 'Belum ada transaksi'}
          </Text>
          <Text style={styles.emptyText}>
            {transactions.length
              ? 'Coba ubah kata kunci atau filter tipe transaksi.'
              : 'Tambahkan transaksi pertama untuk melihat riwayat dan pola pengeluaran.'}
          </Text>
        </View>
      </View>
    );
  };

  const headerComponent = (
    <View style={styles.headerBlock}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Riwayat</Text>
        <Text style={styles.heroTitle}>Transaksi terbaru</Text>
        <Text style={styles.heroSubtitle}>Kelola, edit, dan hapus transaksi dengan tampilan yang lebih ringkas.</Text>
      </View>

      <View style={styles.filterCard}>
        <View style={[styles.searchBox, isMobile && styles.searchBoxMobile]}>
          <AppIcon name="search" size={18} color={colors.primary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari kategori atau catatan..."
            placeholderTextColor={colors.mediumGray}
            style={styles.searchInput}
            accessibilityLabel="Cari transaksi"
          />
          {search ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearSearchButton}
              accessibilityRole="button"
              accessibilityLabel="Bersihkan pencarian"
            >
              <AppIcon name="close" size={16} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.segmentedControl, isCompactMobile && styles.segmentedControlCompact]}>
          {[
            { value: 'all', label: 'Semua' },
            { value: 'income', label: 'Pemasukan' },
            { value: 'expense', label: 'Pengeluaran' },
          ].map((item) => {
            const active = typeFilter === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setTypeFilter(item.value)}
                style={[
                  styles.segmentButton,
                  isCompactMobile && styles.segmentButtonCompact,
                  active && styles.segmentButtonActive,
                  active && item.value === 'income' && styles.segmentButtonIncome,
                  active && item.value === 'expense' && styles.segmentButtonExpense,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    isCompactMobile && styles.segmentButtonTextCompact,
                    active && styles.segmentButtonTextActive,
                    active && item.value === 'income' && styles.segmentButtonTextIncome,
                    active && item.value === 'expense' && styles.segmentButtonTextExpense,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={[styles.summaryItem, isMobile && styles.summaryItemMobile]}>
          <Text style={styles.summaryLabel}>Ditampilkan</Text>
          <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
        </View>
        <View style={[styles.summaryItem, isMobile && styles.summaryItemMobile]}>
          <Text style={styles.summaryLabel}>Masuk</Text>
          <Text style={[styles.summaryValue, styles.summaryIncome]} numberOfLines={1}>
            Rp {filteredSummary.income.toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={[styles.summaryItem, isMobile && styles.summaryItemMobile]}>
          <Text style={styles.summaryLabel}>Keluar</Text>
          <Text style={[styles.summaryValue, styles.summaryExpense]} numberOfLines={1}>
            Rp {filteredSummary.expense.toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshChip, isMobile && styles.refreshChipMobile]}
          disabled={refreshing || loading}
        >
          <AppIcon
            name="refresh"
            size={15}
            color={refreshing || loading ? colors.muted : colors.primary}
          />
          <Text style={styles.refreshChipText}>{refreshing || loading ? 'Memuat...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGrid />
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={[
            styles.listContent,
            isMobile && styles.listContentMobile,
            isCompactMobile && styles.listContentCompact,
          ]}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={onRefresh}
          refreshing={refreshing}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
  },

  listContentMobile: {
    paddingHorizontal: spacing.md,
  },

  listContentCompact: {
    paddingTop: spacing.md,
  },

  headerBlock: {
    marginBottom: spacing.md,
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  heroEyebrow: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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

  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },

  summaryItem: {
    minWidth: 88,
  },

  summaryItemMobile: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 0,
  },

  summaryLabel: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: spacing.xs,
  },

  summaryValue: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    color: colors.white,
  },

  summaryIncome: {
    color: colors.success,
  },

  summaryExpense: {
    color: colors.danger,
  },

  refreshChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },

  refreshChipMobile: {
    flexGrow: 1,
    alignItems: 'center',
  },

  refreshChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.primary,
  },

  footer: {
    paddingVertical: spacing.lg,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    maxWidth: 320,
  },

  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  filterCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  searchBox: {
    minHeight: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  searchBoxMobile: {
    width: '100%',
  },

  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: fontSizes.base,
    paddingVertical: spacing.sm,
  },

  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    padding: 4,
    borderRadius: borderRadius.xl,
    gap: 4,
  },

  segmentedControlCompact: {
    gap: 2,
    padding: 3,
  },

  segmentButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
  },

  segmentButtonCompact: {
    paddingHorizontal: spacing.xs,
  },

  segmentButtonActive: {
    backgroundColor: colors.primarySoft,
  },

  segmentButtonIncome: {
    backgroundColor: colors.successSoft,
  },

  segmentButtonExpense: {
    backgroundColor: colors.dangerSoft,
  },

  segmentButtonText: {
    color: colors.muted,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },

  segmentButtonTextCompact: {
    fontSize: fontSizes.xs,
  },

  segmentButtonTextActive: {
    color: colors.primary,
  },

  segmentButtonTextIncome: {
    color: colors.success,
  },

  segmentButtonTextExpense: {
    color: colors.danger,
  },
});

export default TransactionHistoryScreen;
