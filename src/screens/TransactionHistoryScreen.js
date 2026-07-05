// src/screens/TransactionHistoryScreen.js
// Layar untuk melihat riwayat transaksi

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../services/api';
import TransactionItem from '../components/TransactionItem';
import { colors, spacing, fontSizes } from '../styles/globalStyles';
import { showConfirm, showToast } from '../utils/alertHelper';

const TransactionHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <Text style={styles.emptyText}>Belum ada transaksi</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
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
    backgroundColor: colors.light,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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

  emptyText: {
    fontSize: fontSizes.base,
    color: colors.darkGray,
  },
});

export default TransactionHistoryScreen;
