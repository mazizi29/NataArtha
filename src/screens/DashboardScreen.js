import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, {
  Circle,
  Defs,
  Line as SvgLine,
  LinearGradient,
  Polygon,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import ButtonPrimary from '../components/ButtonPrimary';
import { colors, spacing, fontSizes, borderRadius } from '../styles/globalStyles';
import { formatCurrency } from '../utils/formatCurrency';
import { showConfirm } from '../utils/alertHelper';

const shadowSmall = Platform.select({
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

const shadowMedium = Platform.select({
  web: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.10)',
  },
  default: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Hari' },
  { value: '30d', label: '30 Hari' },
  { value: '90d', label: '90 Hari' },
];

const CHART_VIEW_OPTIONS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
];

const emptyInsights = {
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  },
  transactionCount: 0,
  averageTransaction: 0,
  savingsRate: 0,
  categoryBreakdown: [],
  dailySeries: [],
  chartSeries: [],
  recentTransactions: [],
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCompactAmount = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 1000000000) return `${Math.round(amount / 1000000000)}M`;
  if (amount >= 1000000) return `${Math.round(amount / 1000000)}jt`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}rb`;
  return `${amount}`;
};

const getChartMaxValue = (series) => {
  const values = series.flatMap((item) => [Number(item.income) || 0, Number(item.expense) || 0]);
  return Math.max(1, ...values);
};

const formatShortDayMonth = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

const formatShortMonth = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
};

const aggregateWeeklySeries = (dailySeries) => {
  if (!Array.isArray(dailySeries) || dailySeries.length === 0) {
    return [];
  }

  const bucketSize = dailySeries.length <= 14 ? 1 : 7;
  if (bucketSize === 1) {
    return dailySeries.map((item) => ({
      label: formatShortDayMonth(item.date),
      income: Number(item.income) || 0,
      expense: Number(item.expense) || 0,
    }));
  }

  const output = [];
  for (let start = 0; start < dailySeries.length; start += bucketSize) {
    const bucket = dailySeries.slice(start, start + bucketSize);
    if (bucket.length === 0) continue;

    const income = bucket.reduce((sum, item) => sum + (Number(item.income) || 0), 0);
    const expense = bucket.reduce((sum, item) => sum + (Number(item.expense) || 0), 0);
    const firstLabel = formatShortDayMonth(bucket[0].date);
    const lastLabel = formatShortDayMonth(bucket[bucket.length - 1].date);

    output.push({
      label: firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`,
      income,
      expense,
    });
  }

  return output;
};

const aggregateDailySeries = (dailySeries) => {
  if (!Array.isArray(dailySeries) || dailySeries.length === 0) {
    return [];
  }

  return dailySeries.map((item) => ({
    label: formatShortDayMonth(item.date),
    income: Number(item.income) || 0,
    expense: Number(item.expense) || 0,
  }));
};

const buildLinePoints = ({
  series,
  valueKey,
  maxValue,
  chartWidth,
  chartHeight,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
}) => {
  const max = Math.max(1, Number(maxValue) || 1);
  const plotWidth = Math.max(1, chartWidth - paddingLeft - paddingRight);
  const plotHeight = Math.max(1, chartHeight - paddingTop - paddingBottom);
  const stepX = series.length > 1 ? plotWidth / (series.length - 1) : 0;

  return series.map((item, index) => {
    const rawValue = Number(item[valueKey]) || 0;
    const normalizedValue = Math.min(rawValue, max);
    const x =
      series.length > 1
        ? paddingLeft + index * stepX
        : paddingLeft + plotWidth / 2;
    const y = paddingTop + plotHeight - (normalizedValue / max) * plotHeight;

    return {
      x,
      y,
      value: rawValue,
      label: item.label || '-',
    };
  });
};

const DashboardScreen = ({ navigation }) => {
  const { state, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const [period, setPeriod] = useState('30d');
  const [chartView, setChartView] = useState('weekly');
  const [dashboardData, setDashboardData] = useState(emptyInsights);
  const [loading, setLoading] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(-1);
  const chartRevealAnim = useRef(new Animated.Value(0)).current;
  const didMountRef = useRef(false);

  const fetchDashboard = useCallback(async (periodValue = period) => {
    setLoading(true);
    try {
      const response = await api.getDashboardInsights({ period: periodValue });
      console.log('📊 Dashboard Data Received:', {
        hasChartSeries: Array.isArray(response.chartSeries),
        chartSeriesLength: response.chartSeries?.length || 0,
        firstItem: response.chartSeries?.[0],
        summary: response.summary,
        transactionCount: response.transactionCount,
      });
      
      // Validate chartSeries data
      const validChartSeries = (response.chartSeries || []).map((item) => ({
        label: item.label || 'N/A',
        income: Number(item.income) || 0,
        expense: Number(item.expense) || 0,
      }));

      const validDailySeries = (response.dailySeries || []).map((item) => ({
        date: item.date,
        income: Number(item.income) || 0,
        expense: Number(item.expense) || 0,
      }));
      
      setDashboardData({
        ...emptyInsights,
        ...response,
        dailySeries: validDailySeries,
        chartSeries: validChartSeries,
      });
    } catch (error) {
      console.error('❌ Dashboard Error:', error);
      Alert.alert('Error', 'Gagal mengambil data dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      console.log('=== DASHBOARD FOCUS ===');
      fetchDashboard(period);
    }, [fetchDashboard])
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    fetchDashboard(period);
  }, [period, fetchDashboard]);

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      'Logout',
      'Apakah Anda yakin ingin logout?',
      'Ya',
      'Batal'
    );
    if (confirmed) {
      await logout();
    }
  };

  const summary = dashboardData.summary || emptyInsights.summary;
  const rawChartSeries = Array.isArray(dashboardData.chartSeries) ? dashboardData.chartSeries : [];
  const dailySeries = Array.isArray(dashboardData.dailySeries) ? dashboardData.dailySeries : [];
  const chartSeries = useMemo(
    () => {
      if (dailySeries.length > 0) {
        return chartView === 'daily'
          ? aggregateDailySeries(dailySeries)
          : aggregateWeeklySeries(dailySeries);
      }

      // Fallback if backend does not provide daily series.
      return rawChartSeries;
    },
    [rawChartSeries, dailySeries, chartView]
  );
  const recentTransactions = Array.isArray(dashboardData.recentTransactions)
    ? dashboardData.recentTransactions
    : [];
  const categoryBreakdown = Array.isArray(dashboardData.categoryBreakdown)
    ? dashboardData.categoryBreakdown
    : [];

  const balance = summary.totalIncome - summary.totalExpense;
  const lineChartWidth = Math.max(width - spacing.lg * 4, 260);
  const isDenseAndroidChart = isAndroid && chartSeries.length > 12;
  const lineChartHeight = isDenseAndroidChart ? 190 : 160;
  const isCompactScreen = width < 390;
  const linePaddingLeft = isCompactScreen ? 24 : 34;
  const linePaddingRight = isCompactScreen ? 8 : 12;
  const linePaddingTop = 14;
  const linePaddingBottom = isDenseAndroidChart ? 38 : 30;
  const hasChartData = chartSeries.length > 0;
  const chartMaxValue = getChartMaxValue(chartSeries);
  const lineGridSteps = [0, 0.25, 0.5, 0.75, 1];
  const xLabelStep = Math.max(
    1,
    Math.ceil(chartSeries.length / (isDenseAndroidChart ? 5 : isCompactScreen ? 6 : 8))
  );
  const pointMarkerStep = Math.max(
    1,
    Math.ceil(chartSeries.length / (isDenseAndroidChart ? 8 : isCompactScreen ? 18 : 28))
  );
  const xAxisLabelFontSize = isDenseAndroidChart ? 9 : 10;
  const chartPointRadius = isDenseAndroidChart ? 2.4 : 3;
  const chartSelectedPointRadius = isDenseAndroidChart ? 3.8 : 4.4;
  const chartTouchRadius = isDenseAndroidChart ? 10 : 14;
  const showChartViewToggle = period === '30d' || period === '90d';
  const hasExistingDashboardData =
    (dashboardData.transactionCount || 0) > 0 || rawChartSeries.length > 0 || dailySeries.length > 0;
  const showBlockingLoader = loading && !hasExistingDashboardData;
  const showInlineLoader = loading && hasExistingDashboardData;
  const chartAnimationOpacity = isWeb ? 1 : chartRevealAnim;
  const chartAnimationTransform = isWeb
    ? undefined
    : [
        {
          translateY: chartRevealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ];

  useEffect(() => {
    if (period === '7d') {
      setChartView('weekly');
      return;
    }

    setChartView('daily');
  }, [period]);

  useEffect(() => {
    if (!hasChartData) {
      setSelectedPointIndex(-1);
      return;
    }

    setSelectedPointIndex((prev) => {
      if (prev >= 0 && prev < chartSeries.length) return prev;
      return chartSeries.length - 1;
    });
  }, [chartSeries, hasChartData]);

  useEffect(() => {
    if (!hasChartData || isWeb) {
      chartRevealAnim.setValue(0);
      return;
    }

    chartRevealAnim.setValue(0);
    Animated.timing(chartRevealAnim, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [chartRevealAnim, hasChartData, chartView, period]);

  const incomePoints = buildLinePoints({
    series: chartSeries,
    valueKey: 'income',
    maxValue: chartMaxValue,
    chartWidth: lineChartWidth,
    chartHeight: lineChartHeight,
    paddingLeft: linePaddingLeft,
    paddingRight: linePaddingRight,
    paddingTop: linePaddingTop,
    paddingBottom: linePaddingBottom,
  });

  const expensePoints = buildLinePoints({
    series: chartSeries,
    valueKey: 'expense',
    maxValue: chartMaxValue,
    chartWidth: lineChartWidth,
    chartHeight: lineChartHeight,
    paddingLeft: linePaddingLeft,
    paddingRight: linePaddingRight,
    paddingTop: linePaddingTop,
    paddingBottom: linePaddingBottom,
  });

  const plotBottomY = lineChartHeight - linePaddingBottom;
  const incomePolylinePoints = incomePoints.map((point) => `${point.x},${point.y}`).join(' ');
  const expensePolylinePoints = expensePoints.map((point) => `${point.x},${point.y}`).join(' ');
  const incomeAreaPoints =
    incomePoints.length > 1
      ? [
          ...incomePoints,
          { x: incomePoints[incomePoints.length - 1].x, y: plotBottomY },
          { x: incomePoints[0].x, y: plotBottomY },
        ]
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const expenseAreaPoints =
    expensePoints.length > 1
      ? [
          ...expensePoints,
          { x: expensePoints[expensePoints.length - 1].x, y: plotBottomY },
          { x: expensePoints[0].x, y: plotBottomY },
        ]
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const selectedSeriesItem = selectedPointIndex >= 0 ? chartSeries[selectedPointIndex] : null;
  const selectedX = selectedPointIndex >= 0 ? incomePoints[selectedPointIndex]?.x : null;
  const topCategory = categoryBreakdown[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../Aset/Asset 2.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>NataArtha</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {showBlockingLoader ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.screenContentWrapper}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.welcomeCard}>
            <Text numberOfLines={1} style={styles.greeting}>
              Halo, {state.user?.name || 'User'}! 👋
            </Text>
            <Text numberOfLines={1} style={styles.subGreeting}>
              Sedikit tapi pasti, catat keuanganmu mulai hari ini.
            </Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Grafik Pemasukan vs Pengeluaran</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodList}>
              {PERIOD_OPTIONS.map((option) => {
                const active = period === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      if (option.value === period) return;
                      setPeriod(option.value);
                    }}
                    style={[styles.periodChip, active && styles.periodChipActive]}
                  >
                    <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {hasChartData ? (
              <View>
                <View style={styles.chartLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Pemasukan</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <Text style={styles.legendText}>Pengeluaran</Text>
                  </View>
                </View>

                {showChartViewToggle ? (
                  <View style={styles.chartModeSwitch}>
                    {CHART_VIEW_OPTIONS.map((option) => {
                      const active = chartView === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chartModeButton, active && styles.chartModeButtonActive]}
                          onPress={() => setChartView(option.value)}
                        >
                          <Text style={[styles.chartModeButtonText, active && styles.chartModeButtonTextActive]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                <Animated.View
                  style={[
                    styles.lineChartContainer,
                    {
                      width: lineChartWidth,
                      height: lineChartHeight,
                      opacity: chartAnimationOpacity,
                      transform: chartAnimationTransform,
                    },
                  ]}
                >
                  <Svg
                    key={`${period}-${chartView}-${chartSeries.length}`}
                    width={lineChartWidth}
                    height={lineChartHeight}
                  >
                      <Defs>
                        <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor={colors.success} stopOpacity="0.24" />
                          <Stop offset="100%" stopColor={colors.success} stopOpacity="0.02" />
                        </LinearGradient>
                        <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor={colors.danger} stopOpacity="0.2" />
                          <Stop offset="100%" stopColor={colors.danger} stopOpacity="0.02" />
                        </LinearGradient>
                      </Defs>

                      {lineGridSteps.map((step) => {
                        const y = linePaddingTop + step * (lineChartHeight - linePaddingTop - linePaddingBottom);
                        const axisValue = Math.round((1 - step) * chartMaxValue);
                        return (
                          <React.Fragment key={`grid-${step}`}>
                            <SvgLine
                              x1={linePaddingLeft}
                              y1={y}
                              x2={lineChartWidth - linePaddingRight}
                              y2={y}
                              stroke={colors.lightGray}
                              strokeWidth={1}
                              strokeOpacity={0.5}
                            />
                            <SvgText
                              x={2}
                              y={y + 4}
                              fontSize={10}
                              fill={colors.darkGray}
                              opacity={0.85}
                            >
                              {formatCompactAmount(axisValue)}
                            </SvgText>
                          </React.Fragment>
                        );
                      })}

                      {incomeAreaPoints ? <Polygon points={incomeAreaPoints} fill="url(#incomeGradient)" /> : null}
                      {expenseAreaPoints ? <Polygon points={expenseAreaPoints} fill="url(#expenseGradient)" /> : null}

                      {selectedX != null ? (
                        <SvgLine
                          x1={selectedX}
                          y1={linePaddingTop}
                          x2={selectedX}
                          y2={plotBottomY}
                          stroke={colors.primary}
                          strokeDasharray="4 4"
                          strokeOpacity={0.35}
                        />
                      ) : null}

                      <Polyline
                        points={incomePolylinePoints}
                        fill="none"
                        stroke={colors.success}
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <Polyline
                        points={expensePolylinePoints}
                        fill="none"
                        stroke={colors.danger}
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />

                      {incomePoints.map((point, index) => (
                        <React.Fragment key={`income-point-${index}`}>
                          {index % pointMarkerStep === 0 || index === incomePoints.length - 1 || selectedPointIndex === index ? (
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              r={selectedPointIndex === index ? chartSelectedPointRadius : chartPointRadius}
                              fill={colors.success}
                              stroke={colors.white}
                              strokeWidth={1.5}
                            />
                          ) : null}
                          <Circle
                            cx={point.x}
                            cy={point.y}
                            r={chartTouchRadius}
                            fill="transparent"
                            onPress={() => setSelectedPointIndex(index)}
                          />
                        </React.Fragment>
                      ))}

                      {expensePoints.map((point, index) => (
                        <React.Fragment key={`expense-point-${index}`}>
                          {index % pointMarkerStep === 0 || index === expensePoints.length - 1 || selectedPointIndex === index ? (
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              r={selectedPointIndex === index ? chartSelectedPointRadius : chartPointRadius}
                              fill={colors.danger}
                              stroke={colors.white}
                              strokeWidth={1.5}
                            />
                          ) : null}
                          <Circle
                            cx={point.x}
                            cy={point.y}
                            r={chartTouchRadius}
                            fill="transparent"
                            onPress={() => setSelectedPointIndex(index)}
                          />
                        </React.Fragment>
                      ))}

                      {incomePoints.map((point, index) => {
                        if (index % xLabelStep !== 0 && index !== incomePoints.length - 1) {
                          return null;
                        }

                        const displayLabel =
                          isDenseAndroidChart && chartView === 'daily'
                            ? point.label.split(' ')[0]
                            : point.label;

                        return (
                          <SvgText
                            key={`label-${index}`}
                            x={point.x}
                            y={lineChartHeight - 8}
                            fontSize={xAxisLabelFontSize}
                            fill={colors.darkGray}
                            textAnchor="middle"
                          >
                            {displayLabel}
                          </SvgText>
                        );
                      })}
                  </Svg>
                </Animated.View>

                {selectedSeriesItem ? (
                  <View style={styles.chartPointDetailCard}>
                    <Text style={styles.chartPointDetailTitle}>Detail Grafik</Text>
                    <View style={styles.chartPointDetailRow}>
                      <Text style={styles.chartPointDetailLabel}>Pemasukan</Text>
                      <Text style={[styles.chartPointDetailValue, { color: colors.success }]}>
                        {formatCurrency(selectedSeriesItem.income)}
                      </Text>
                    </View>
                    <View style={styles.chartPointDetailRow}>
                      <Text style={styles.chartPointDetailLabel}>Pengeluaran</Text>
                      <Text style={[styles.chartPointDetailValue, { color: colors.danger }]}>
                        {formatCurrency(selectedSeriesItem.expense)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>Belum ada data transaksi pada periode ini</Text>
              </View>
            )}
          </View>

          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pemasukan</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]} numberOfLines={1}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pengeluaran</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]} numberOfLines={1}>
                {formatCurrency(summary.totalExpense)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Saldo</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: balance >= 0 ? colors.success : colors.danger },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <ButtonPrimary
              title="+ Tambah Transaksi"
              onPress={() => navigation.navigate('AddTransaction')}
              fullWidth={false}
              style={styles.actionButtonItem}
            />
            <ButtonPrimary
              title="📋 Riwayat Transaksi"
              onPress={() => navigation.navigate('TransactionHistory')}
              variant="secondary"
              fullWidth={false}
              style={styles.actionButtonItem}
            />
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.sectionTitle}>Insight Utama</Text>
            {topCategory ? (
              <View style={styles.insightRow}>
                <View style={styles.insightTextBlock}>
                  <Text style={styles.insightLabel}>Kategori pengeluaran terbesar</Text>
                  <Text style={styles.insightValue}>{topCategory.category}</Text>
                </View>
                <Text style={styles.insightAmount}>{formatCurrency(topCategory.total)}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Belum ada kategori pengeluaran yang dominan</Text>
            )}
            <View style={styles.insightRow}>
              <View style={styles.insightTextBlock}>
                <Text style={styles.insightLabel}>Jumlah transaksi</Text>
                <Text style={styles.insightValue}>{dashboardData.transactionCount || 0}</Text>
              </View>
              <View style={styles.insightTextBlockRight}>
                <Text style={styles.insightLabel}>Data terakhir</Text>
                <Text style={styles.insightValue}>{formatDate(recentTransactions[0]?.date)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Belum ada transaksi</Text>
              </View>
            ) : (
              recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    <Text style={styles.transactionNote} numberOfLines={1}>
                      {transaction.note || 'Tidak ada catatan'}
                    </Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'expense' ? colors.danger : colors.success },
                    ]}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
          </ScrollView>

          {showInlineLoader ? (
            <View pointerEvents="none" style={styles.inlineLoadingOverlay}>
              <View style={styles.inlineLoadingPill}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.inlineLoadingText}>Memperbarui grafik...</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },

  scrollContent: {
    paddingBottom: spacing.xl,
  },

  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  headerLogo: {
    width: 32,
    height: 32,
  },

  brandText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.lg,
  },

  greeting: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },

  headerLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },

  subGreeting: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
  },

  welcomeCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadowSmall,
    elevation: 3,
  },

  logoutButton: {
    // Changed from secondary (yellow) to ghost white button for header
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 74,
    alignItems: 'center',
  },

  logoutText: {
    color: colors.white, // Changed from dark to white for contrast on blue header
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  screenContentWrapper: {
    flex: 1,
  },

  inlineLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.md,
  },

  inlineLoadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full || 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadowSmall,
    elevation: 3,
  },

  inlineLoadingText: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    fontWeight: '600',
  },

  balanceCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadowMedium,
    elevation: 5,
  },

  balanceLabel: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },

  balanceAmount: {
    fontSize: fontSizes['3xl'],
    fontWeight: '700',
    marginBottom: spacing.lg,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },

  balanceItem: {
    alignItems: 'center',
  },

  balanceItemLabel: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },

  balanceItemAmount: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },

  periodSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  periodList: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },

  periodChip: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full || borderRadius.lg,
  },

  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  periodChipText: {
    color: colors.darkGray,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },

  periodChipTextActive: {
    color: colors.white,
  },

  chartCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadowSmall,
    elevation: 3,
    marginBottom: spacing.md,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.dark,
  },

  sectionCaption: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    marginTop: 2,
  },

  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },

  lineChartContainer: {
    marginTop: spacing.xs,
  },

  chartModeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.sm,
    gap: 6,
    alignSelf: 'flex-start',
  },

  chartModeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  chartModeButtonActive: {
    backgroundColor: colors.white,
    ...shadowSmall,
  },

  chartModeButtonText: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    fontWeight: '600',
  },

  chartModeButtonTextActive: {
    color: colors.dark,
  },

  chartPointDetailCard: {
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  chartPointDetailTitle: {
    fontSize: fontSizes.sm,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  chartPointDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  chartPointDetailLabel: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
  },

  chartPointDetailValue: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },

  simpleChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  simpleChartColumn: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },

  simpleChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: 4,
  },

  simpleBarTrack: {
    width: 18,
    height: 110,
    justifyContent: 'flex-end',
    backgroundColor: colors.light,
    borderRadius: 999,
    overflow: 'hidden',
  },

  simpleBar: {
    width: '100%',
    borderRadius: 999,
  },

  simpleChartLabel: {
    marginTop: spacing.xs,
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    textAlign: 'center',
    minHeight: 32,
  },

  simpleChartValue: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.dark,
    fontWeight: '700',
    textAlign: 'center',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  legendText: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    fontWeight: '600',
  },

  emptyChart: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  summaryStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadowSmall,
    elevation: 2,
  },

  summaryLabel: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },

  summaryValue: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  metricCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadowSmall,
    elevation: 2,
  },

  metricLabel: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },

  metricValue: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.dark,
  },

  insightCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadowSmall,
    elevation: 2,
  },

  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.md,
  },

  insightTextBlock: {
    flex: 1,
  },

  insightTextBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  insightLabel: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },

  insightValue: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.dark,
  },

  insightAmount: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },

  actionButtons: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  actionButtonItem: {
    flex: 1,
  },

  recentSection: {
    padding: spacing.lg,
  },

  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadowSmall,
    elevation: 2,
  },

  transactionMeta: {
    flex: 1,
    paddingRight: spacing.md,
  },

  transactionCategory: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.dark,
  },

  transactionNote: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
    marginTop: spacing.xs,
  },

  transactionDate: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    marginTop: spacing.xs,
  },

  transactionAmount: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: fontSizes.base,
    color: colors.darkGray,
  },

  chartDataPreview: {
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  chartPreviewTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },

  chartPreviewItem: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
});

export default DashboardScreen;
