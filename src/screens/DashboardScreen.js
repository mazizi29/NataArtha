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
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, {
  Circle,
  Defs,
  G,
  Line as SvgLine,
  LinearGradient,
  Path,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import AddTransactionScreen from './AddTransactionScreen';
import TransactionHistoryScreen from './TransactionHistoryScreen';
import BackgroundGrid from '../components/BackgroundGrid';
import AppIcon from '../components/AppIcon';
import CategoryIcon from '../components/CategoryIcon';
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

const RANGE_OPTIONS = [
  { value: 'month', label: '1 Bulan', shortLabel: '1 bln', months: 1 },
  { value: 'quarter', label: '3 Bulan', shortLabel: '3 bln', months: 3 },
  { value: 'semester', label: '6 Bulan', shortLabel: '6 bln', months: 6 },
  { value: 'year', label: '1 Tahun', shortLabel: '1 thn', months: 12 },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'history', label: 'Riwayat Transaksi', icon: 'history' },
  { id: 'add', label: 'Tambah Transaksi', icon: 'add' },
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

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthEnd = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const shiftMonth = (date, offset) => new Date(date.getFullYear(), date.getMonth() + offset, 1);

const formatMonthTitle = (date) =>
  date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

const getRangeBounds = (monthDate, rangeValue) => {
  const option = RANGE_OPTIONS.find((item) => item.value === rangeValue) || RANGE_OPTIONS[0];
  const endDate = getMonthEnd(monthDate);
  const startMonth = shiftMonth(monthDate, -(option.months - 1));
  return {
    startDate: getMonthStart(startMonth),
    endDate,
    label:
      option.months === 1
        ? formatMonthTitle(monthDate)
        : `${formatMonthTitle(startMonth)} - ${formatMonthTitle(monthDate)}`,
  };
};

const aggregateWeeklySeries = (dailySeries, bucketSize = 7, compactLabels = false) => {
  if (!Array.isArray(dailySeries) || dailySeries.length === 0) {
    return [];
  }

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
      label: compactLabels || firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`,
      income,
      expense,
    });
  }

  return output;
};

const aggregateMonthlySeries = (dailySeries) => {
  if (!Array.isArray(dailySeries) || dailySeries.length === 0) {
    return [];
  }

  const monthMap = new Map();
  dailySeries.forEach((item) => {
    const parsed = new Date(item.date);
    if (Number.isNaN(parsed.getTime())) return;

    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
    const current = monthMap.get(key) || {
      label: formatShortMonth(item.date),
      income: 0,
      expense: 0,
    };

    current.income += Number(item.income) || 0;
    current.expense += Number(item.expense) || 0;
    monthMap.set(key, current);
  });

  return Array.from(monthMap.values());
};

const buildDisplaySeries = (dailySeries, fallbackSeries, rangeValue) => {
  if (!Array.isArray(dailySeries) || dailySeries.length === 0) {
    return fallbackSeries;
  }

  if (rangeValue === 'month') {
    return aggregateWeeklySeries(dailySeries, 3, false);
  }

  if (rangeValue === 'quarter') {
    return aggregateWeeklySeries(dailySeries, 14, false);
  }

  return aggregateMonthlySeries(dailySeries);
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

const buildSmoothPath = (points) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

const buildAreaPath = (points, baselineY) => {
  if (points.length < 2) return '';
  const linePath = buildSmoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
};

const DonutChart = ({ data, size = 180, strokeWidth = 24, totalValue, onSegmentPress }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = totalValue || data.reduce((sum, item) => sum + Number(item.total), 0) || 1;

  // Padding for badges so they don't get clipped
  const badgeOffset = 40;
  const containerSize = size + badgeOffset * 2;
  const cx = containerSize / 2;
  const cy = containerSize / 2;

  let currentOffset = 0;
  const segments = data.map((item, index) => {
    if (item.total === 0) return null;
    const itemPercentage = Number(item.total) / total;
    const segmentLength = itemPercentage * circumference;
    const strokeDasharray = `${segmentLength} ${circumference}`;
    const strokeDashoffset = -currentOffset;

    // Calculate mid angle for badge positioning
    const midAngle = ((currentOffset + segmentLength / 2) / circumference) * 2 * Math.PI - (Math.PI / 2);

    const badgeRadius = radius + strokeWidth / 2 + 15;
    const badgeX = cx + badgeRadius * Math.cos(midAngle);
    const badgeY = cy + badgeRadius * Math.sin(midAngle);

    currentOffset += segmentLength;

    return {
      ...item,
      index,
      color: item.color || (index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.info),
      percentage: Math.round(itemPercentage * 100),
      strokeDasharray,
      strokeDashoffset,
      badgeX,
      badgeY,
      isSmall: itemPercentage < 0.05,
    };
  }).filter(Boolean);

  const handlePress = (segment) => {
    if (selectedIndex === segment.index) {
      if (onSegmentPress) onSegmentPress(segment);
    } else {
      setSelectedIndex(segment.index);
    }
  };

  const selectedSegment = selectedIndex !== null ? segments.find(s => s.index === selectedIndex) : null;

  return (
    <View style={{ width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={containerSize} height={containerSize} viewBox={`0 0 ${containerSize} ${containerSize}`}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {segments.map((segment) => {
          const isSelected = selectedIndex === segment.index;
          const isDimmed = selectedIndex !== null && !isSelected;
          return (
            <G key={`arc-group-${segment.index}`}>
              {/* Visible Stroke */}
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={segment.color}
                strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                fill="none"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
                originX={cx}
                originY={cy}
                rotation="-90"
                opacity={isDimmed ? 0.3 : 1}
                pointerEvents="none"
              />
              {/* Invisible Hit Area Stroke (Thicker) */}
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke="transparent"
                strokeWidth={strokeWidth + 24}
                fill="none"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
                originX={cx}
                originY={cy}
                rotation="-90"
                onPress={() => handlePress(segment)}
                style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}
              />
            </G>
          );
        })}
      </Svg>

      {/* Central Summary */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', width: radius * 2 - 10, height: radius * 2 - 10 }} pointerEvents="none">
        <Text style={{ fontSize: fontSizes.xs, color: colors.muted, fontWeight: '800', marginBottom: 2, textTransform: 'uppercase', textAlign: 'center' }} numberOfLines={1}>
          {selectedSegment ? selectedSegment.category : 'Total'}
        </Text>
        <Text style={{ fontSize: fontSizes.base, color: colors.white, fontWeight: '800', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatCurrency(selectedSegment ? selectedSegment.total : total)}
        </Text>
        {selectedSegment && (
          <Text style={{ fontSize: fontSizes.sm, color: selectedSegment.color, fontWeight: '800', marginTop: 2 }}>
            {selectedSegment.percentage}%
          </Text>
        )}
      </View>

      {/* External Badges */}
      {segments.map((segment) => {
        const isSelected = selectedIndex === segment.index;
        const shouldShow = isSelected || (!segment.isSmall && selectedIndex === null);

        if (!shouldShow) return null;

        return (
          <View
            key={`badge-${segment.index}`}
            style={{
              position: 'absolute',
              left: segment.badgeX,
              top: segment.badgeY,
              transform: [
                { translateX: -18 },
                { translateY: -10 },
                { scale: isSelected ? 1.15 : 1 }
              ],
              backgroundColor: segment.color,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
              minWidth: 36,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 4,
            }}
            pointerEvents="none"
          >
            <Text style={{ fontSize: fontSizes.xs - 2, color: '#fff', fontWeight: '800' }}>
              {segment.percentage}%
            </Text>
          </View>
        );
      })}
    </View>
  );
};


const DashboardScreen = ({ navigation }) => {
  const { state, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const isDesktop = width >= 1100;
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthStart(new Date()));
  const [range, setRange] = useState('month');
  const [activeBreakdownType, setActiveBreakdownType] = useState('expense');
  const [dashboardData, setDashboardData] = useState(emptyInsights);
  const [loading, setLoading] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(-1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [panelParams, setPanelParams] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showTotalSavingsModal, setShowTotalSavingsModal] = useState(false);
  const [totalSavingsData, setTotalSavingsData] = useState(null);
  const [loadingTotalSavings, setLoadingTotalSavings] = useState(false);
  const chartRevealAnim = useRef(new Animated.Value(0)).current;
  const didMountRef = useRef(false);
  const activeRange = useMemo(
    () => getRangeBounds(selectedMonth, range),
    [selectedMonth, range]
  );

  const fetchDashboard = useCallback(async (rangeBounds = activeRange) => {
    setLoading(true);
    try {
      const response = await api.getDashboardInsights({
        startDate: toIsoDate(rangeBounds.startDate),
        endDate: toIsoDate(rangeBounds.endDate),
        period: 'custom',
      });
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
  }, [activeRange]);

  useFocusEffect(
    useCallback(() => {
      console.log('=== DASHBOARD FOCUS ===');
      fetchDashboard(activeRange);
    }, [activeRange, fetchDashboard])
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    fetchDashboard(activeRange);
  }, [activeRange, fetchDashboard]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const fetchAllTimeSavings = async () => {
    try {
      setLoadingTotalSavings(true);
      setShowTotalSavingsModal(true);
      const summary = await api.getSummary({ period: 'all' });
      setTotalSavingsData(summary);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat total tabungan');
      setShowTotalSavingsModal(false);
    } finally {
      setLoadingTotalSavings(false);
    }
  };

  const summary = dashboardData.summary || emptyInsights.summary;
  const previousSummary = dashboardData.previousSummary || null;

  const renderTrend = (current, previous, isExpense = false) => {
    if (!previous || previous === 0) return null;
    const diff = current - previous;
    if (diff === 0) return null;

    const pct = ((diff / Math.abs(previous)) * 100).toFixed(1);
    const isIncrease = diff > 0;

    let color = colors.muted;
    if (isExpense) {
      color = isIncrease ? colors.danger : colors.success;
    } else {
      color = isIncrease ? colors.success : colors.danger;
    }

    const icon = isIncrease ? '↑' : '↓';

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: fontSizes.xs, fontWeight: '700', color, marginRight: 2 }}>
          {icon} {Math.abs(pct)}%
        </Text>
        <Text style={{ fontSize: fontSizes.xs, color: colors.muted }}>vs sblmnya</Text>
      </View>
    );
  };
  const rawChartSeries = Array.isArray(dashboardData.chartSeries) ? dashboardData.chartSeries : [];
  const dailySeries = Array.isArray(dashboardData.dailySeries) ? dashboardData.dailySeries : [];
  const chartSeries = useMemo(
    () => {
      return buildDisplaySeries(dailySeries, rawChartSeries, range);
    },
    [rawChartSeries, dailySeries, range]
  );
  const recentTransactions = Array.isArray(dashboardData.recentTransactions)
    ? dashboardData.recentTransactions
    : [];

  const expenseBreakdown = Array.isArray(dashboardData.expenseBreakdown)
    ? dashboardData.expenseBreakdown
    : Array.isArray(dashboardData.categoryBreakdown) ? dashboardData.categoryBreakdown : [];

  const incomeBreakdown = Array.isArray(dashboardData.incomeBreakdown)
    ? dashboardData.incomeBreakdown
    : [];

  const currentBreakdownData = activeBreakdownType === 'expense' ? expenseBreakdown : incomeBreakdown;


  const balance = summary.totalIncome - summary.totalExpense;
  const savingsRate = Math.round(Number(dashboardData.savingsRate) || 0);
  const contentWidth = Math.min(isMobile ? width : width - 260, 1380);
  const isCompactScreen = width < 390;
  const sectionHorizontalPadding = isMobile ? spacing.md * 2 : spacing.lg * 2;
  const gridInnerWidth = Math.max(1, contentWidth - sectionHorizontalPadding);
  const chartColumnWidth = isMobile
    ? gridInnerWidth
    : Math.max(420, ((gridInnerWidth - spacing.md) * 1.6) / 2.6);
  const chartInnerPadding = isMobile ? spacing.md * 2 : spacing.lg * 2;
  const minimumChartWidth = isCompactScreen ? 208 : 248;
  const lineChartWidth = Math.max(
    minimumChartWidth,
    Math.floor(chartColumnWidth - chartInnerPadding)
  );
  const isDenseAndroidChart = isAndroid && chartSeries.length > 12;
  const lineChartHeight = isMobile ? (isDenseAndroidChart ? 206 : 188) : 210;
  const linePaddingLeft = isCompactScreen ? 28 : 42;
  const linePaddingRight = isCompactScreen ? 10 : 16;
  const linePaddingTop = 12;
  const linePaddingBottom = isDenseAndroidChart ? 42 : 34;
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
  }, [chartRevealAnim, hasChartData, range, selectedMonth, isWeb]);

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
  const incomeLinePath = buildSmoothPath(incomePoints);
  const expenseLinePath = buildSmoothPath(expensePoints);
  const incomeAreaPath = buildAreaPath(incomePoints, plotBottomY);
  const expenseAreaPath = buildAreaPath(expensePoints, plotBottomY);
  const selectedSeriesItem = selectedPointIndex >= 0 ? chartSeries[selectedPointIndex] : null;
  const selectedX = selectedPointIndex >= 0 ? incomePoints[selectedPointIndex]?.x : null;
  const topCategory = currentBreakdownData[0];
  const recentTxs = recentTransactions.slice(0, 6);

  const handleTopAction = (id, params = {}) => {
    if (id === 'dashboard') return;
    if (id === 'history') {
      setPanelParams(params);
      setActivePanel('history');
      return;
    }
    setPanelParams(params);
    setActivePanel('add');
  };

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelParams({});
  }, []);

  const panelNavigation = useMemo(
    () => ({
      ...navigation,
      goBack: () => {
        closePanel();
        fetchDashboard(activeRange);
      },
      navigate: (screenName, params) => {
        if (screenName === 'AddTransaction') {
          setPanelParams(params);
          setActivePanel('add');
        } else {
          closePanel();
          navigation.navigate(screenName, params);
        }
      },
      setOptions: () => { },
    }),
    [activeRange, closePanel, fetchDashboard, navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGrid />
      {!isMobile && (
        <View pointerEvents="box-none" style={styles.desktopShell}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}>
              <View style={styles.brandIcon}>
                <Image
                  source={require('../../assets/Asset 2.png')}
                  style={styles.sidebarLogo}
                  resizeMode="contain"
                />
              </View>
              {isDesktop && (
                <View>
                  <Text style={styles.sidebarBrandTitle}>NataArtha</Text>
                  <Text style={styles.sidebarBrandCaption}>Keuangan Pribadi</Text>
                </View>
              )}
            </View>

            <View style={styles.sidebarNav}>
              {NAV_ITEMS.map((item) => {
                const active = item.id === 'dashboard';
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleTopAction(item.id)}
                    style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
                  >
                    <AppIcon
                      name={item.icon}
                      size={18}
                      color={active ? colors.primary : colors.mediumGray}
                    />
                    <Text style={[styles.sidebarNavText, active && styles.sidebarNavTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sidebarUser}>
              <View style={styles.userAvatar}>
                <AppIcon name="user" size={19} color={colors.primary} strokeWidth={2.2} />
              </View>
              {isDesktop && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.sidebarUserName}>{state.user?.name || 'Mazizi'}</Text>
                  <Text style={styles.sidebarUserCaption}>Akun Utama</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.sidebarLogout}>
              <AppIcon name="logout" size={17} color={colors.dark} />
              <Text style={styles.sidebarLogoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 'auto', paddingTop: 24, alignItems: 'center', opacity: 0.5 }}>
              <Text style={{ fontSize: 11, color: colors.dark, fontWeight: '500' }}>© 2026 @layarputih_cs</Text>
            </View>
          </View>

          <View pointerEvents="box-none" style={styles.mainColumn}>
            <View pointerEvents="auto" style={styles.topBarDesktop}>
              <View>
                <Text style={styles.topBarDate}>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.topBarTitle}>
                  Selamat datang, {state.user?.name || 'Mazizi'}
                </Text>
              </View>

              <View style={styles.topBarActions}>
                <TouchableOpacity onPress={() => setActivePanel('add')} style={styles.topBarPrimaryButton}>
                  <AppIcon name="add" size={18} color="#080B14" strokeWidth={2.4} />
                  <Text style={styles.topBarPrimaryButtonText}>Tambah Transaksi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {isMobile && (
        <View style={styles.mobileTopBar}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.mobileMenuButton}>
            <AppIcon name="menu" size={20} color={colors.dark} />
          </TouchableOpacity>
          <View style={styles.mobileBrandBlock}>
            <Image source={require('../../assets/Asset 2.png')} style={styles.mobileBrandLogo} resizeMode="contain" />
            <View>
              <Text style={styles.mobileBrandTitle}>NataArtha</Text>
              <Text style={styles.mobileBrandCaption}>Keuangan Pribadi</Text>
            </View>
          </View>
        </View>
      )}

      {isMobile && drawerOpen && (
        <Modal transparent animationType="fade" visible={drawerOpen} onRequestClose={() => setDrawerOpen(false)}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setDrawerOpen(false)}>
            <View style={styles.mobileDrawer}>
              <View style={styles.mobileDrawerHeader}>
                <Text style={styles.mobileDrawerTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                  <AppIcon name="close" size={20} color={colors.dark} />
                </TouchableOpacity>
              </View>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setDrawerOpen(false);
                    handleTopAction(item.id);
                  }}
                  style={styles.mobileDrawerItem}
                >
                  <AppIcon name={item.icon} size={18} color={colors.primary} />
                  <Text style={styles.mobileDrawerItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={handleLogout} style={styles.mobileDrawerLogout}>
                <AppIcon name="logout" size={18} color="#080B14" />
                <Text style={styles.mobileDrawerLogoutText}>Logout</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 'auto', paddingTop: 24, paddingBottom: 8, alignItems: 'center', opacity: 0.5 }}>
                <Text style={{ fontSize: 11, color: colors.dark, fontWeight: '500' }}>© 2026 @layarputih_cs</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <View style={[styles.shell, !isMobile && styles.shellDesktop]}>
        {!isMobile && (
          <View style={styles.mobileSpacer} />
        )}

        {showBlockingLoader ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.screenContentWrapper}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
            >
              <View style={[styles.pageShell, isMobile && styles.pageShellMobile]}>
                {isMobile && (
                  <View style={{ marginTop: spacing.md, marginBottom: spacing.lg, paddingHorizontal: spacing.lg }}>
                    <Text style={{ fontSize: 13, color: '#A8B5D6', marginBottom: 4, fontWeight: '500' }}>
                      {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text 
                      style={{ fontSize: 18, color: colors.white, fontWeight: '600' }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      Halo, {state.user?.name || 'Mazizi'} 👋
                    </Text>
                  </View>
                )}
                <View style={[styles.heroCard, isMobile && styles.heroCardMobile]}>
                  <View style={styles.heroTextBlock}>
                    <Text style={styles.heroEyebrow}>Total Saldo</Text>
                    <Text
                      style={[styles.heroBalance, isMobile && styles.heroBalanceMobile]}
                      numberOfLines={2}
                      adjustsFontSizeToFit={isMobile}
                      minimumFontScale={0.78}
                    >
                      {formatCurrency(balance)}
                    </Text>
                    <Text style={styles.heroCaption}>{balance >= 0 ? 'Saldo positif' : 'Saldo negatif'} - {activeRange.label}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={fetchAllTimeSavings}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 12,
                        alignSelf: 'flex-start',
                        opacity: 0.9,
                      }}
                    >
                      <AppIcon name="search" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.primary, marginLeft: 6, fontWeight: '600' }}>Cek Total Semua Saldo</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.heroRingWrap, isMobile && styles.heroRingWrapMobile, { shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 }]}>
                    <Text style={[styles.heroRingPercent, { textShadowColor: 'rgba(201,168,76,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }]}>{savingsRate}%</Text>
                    <Text style={styles.heroRingLabel}>tabungan</Text>
                  </View>
                </View>

                <View style={[styles.statGrid, isMobile && styles.statGridMobile]}>
                  <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
                    <Text style={styles.statLabel}>Pemasukan</Text>
                    <Text
                      style={styles.statValueIncome}
                      numberOfLines={1}
                      adjustsFontSizeToFit={isMobile}
                      minimumFontScale={0.72}
                    >
                      {formatCurrency(summary.totalIncome)}
                    </Text>
                    {previousSummary && renderTrend(summary.totalIncome, previousSummary.totalIncome, false)}
                  </View>
                  <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
                    <Text style={styles.statLabel}>Pengeluaran</Text>
                    <Text
                      style={styles.statValueExpense}
                      numberOfLines={1}
                      adjustsFontSizeToFit={isMobile}
                      minimumFontScale={0.72}
                    >
                      {formatCurrency(summary.totalExpense)}
                    </Text>
                    {previousSummary && renderTrend(summary.totalExpense, previousSummary.totalExpense, true)}
                  </View>
                  <View style={[styles.statCard, styles.statCardWide, isMobile && styles.statCardMobile]}>
                    <Text style={styles.statLabel}>Saldo</Text>
                    <Text
                      style={styles.statValueBalance}
                      numberOfLines={1}
                      adjustsFontSizeToFit={isMobile}
                      minimumFontScale={0.72}
                    >
                      {formatCurrency(balance)}
                    </Text>
                    {previousSummary && renderTrend(balance, previousSummary.balance, false)}
                  </View>
                </View>

                <View style={[styles.contentGrid, isMobile && styles.contentGridMobile]}>
                  <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
                    <View style={[styles.cardHeaderRow, isMobile && styles.cardHeaderRowMobile]}>
                      <View style={styles.sectionTitleBlock}>
                        <Text style={styles.sectionTitle}>Grafik Keuangan</Text>
                        <Text style={styles.sectionCaption}>{activeRange.label}</Text>
                      </View>
                      <View style={[styles.chartLegendRow, isMobile && styles.chartLegendRowMobile]}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Masuk</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Keluar</Text></View>
                      </View>
                    </View>

                    <View style={[styles.chartFilterBar, isMobile && styles.chartFilterBarMobile]}>
                      <View style={[styles.monthStepper, isMobile && styles.monthStepperMobile]}>
                        <TouchableOpacity
                          onPress={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
                          style={styles.monthStepButton}
                        >
                          <Text style={styles.monthStepButtonText}>{'<'}</Text>
                        </TouchableOpacity>
                        <View style={[styles.monthTitleBlock, isMobile && styles.monthTitleBlockMobile]}>
                          <Text style={styles.monthTitle} numberOfLines={1}>{activeRange.label}</Text>
                          <Text style={styles.monthSubtitle} numberOfLines={1}>Periode grafik</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}
                          style={styles.monthStepButton}
                        >
                          <Text style={styles.monthStepButtonText}>{'>'}</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.rangeList}
                        style={[styles.rangeScroller, isMobile && styles.rangeScrollerMobile]}
                      >
                        {RANGE_OPTIONS.map((option) => {
                          const active = range === option.value;
                          return (
                            <TouchableOpacity
                              key={option.value}
                              onPress={() => setRange(option.value)}
                              style={[styles.rangeChip, active && styles.rangeChipActive]}
                            >
                              <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>
                                {isMobile ? option.shortLabel : option.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {hasChartData ? (
                      <View style={[styles.chartContentBlock, isMobile && styles.chartContentBlockMobile]}>
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
                            key={`${range}-${toIsoDate(selectedMonth)}-${chartSeries.length}`}
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

                            {incomeAreaPath ? <Path d={incomeAreaPath} fill="url(#incomeGradient)" /> : null}
                            {expenseAreaPath ? <Path d={expenseAreaPath} fill="url(#expenseGradient)" /> : null}

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

                            {incomePoints.length > 1 ? (
                              <Path
                                d={incomeLinePath}
                                fill="none"
                                stroke={colors.success}
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            ) : (
                              <Polyline
                                points={incomePolylinePoints}
                                fill="none"
                                stroke={colors.success}
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            )}
                            {expensePoints.length > 1 ? (
                              <Path
                                d={expenseLinePath}
                                fill="none"
                                stroke={colors.danger}
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            ) : (
                              <Polyline
                                points={expensePolylinePoints}
                                fill="none"
                                stroke={colors.danger}
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            )}

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
                                isMobile && point.label.includes(' - ')
                                  ? point.label.split(' - ')[0]
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
                          <View style={[styles.chartPointDetailCard, isMobile && styles.chartPointDetailCardMobile]}>
                            <Text style={styles.chartPointDetailTitle} numberOfLines={1}>{selectedSeriesItem.label}</Text>
                            <View style={[styles.chartPointDetailGroup, isMobile && styles.chartPointDetailGroupMobile]}>
                              <View style={[styles.chartPointDetailRow, isMobile && styles.chartPointDetailRowMobile]}>
                                <Text style={styles.chartPointDetailLabel}>Masuk</Text>
                                <Text style={[styles.chartPointDetailValue, { color: colors.success }]}>
                                  {formatCurrency(selectedSeriesItem.income)}
                                </Text>
                              </View>
                              <View style={[styles.chartPointDetailRow, isMobile && styles.chartPointDetailRowMobile]}>
                                <Text style={styles.chartPointDetailLabel}>Keluar</Text>
                                <Text style={[styles.chartPointDetailValue, { color: colors.danger }]}>
                                  {formatCurrency(selectedSeriesItem.expense)}
                                </Text>
                              </View>
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

                  <View style={[styles.breakdownCard, isMobile && styles.breakdownCardMobile]}>
                    <View style={[styles.cardHeaderRow, isMobile && styles.cardHeaderRowMobile]}>
                      <View>
                        <Text style={styles.sectionTitle}>Ringkasan Keuangan</Text>
                        <Text style={styles.sectionCaption}>Berdasarkan {activeBreakdownType === 'expense' ? 'pengeluaran' : 'pemasukan'} bulan ini</Text>
                      </View>
                      <View style={styles.breakdownToggleGroup}>
                        <TouchableOpacity
                          style={[styles.breakdownToggle, activeBreakdownType === 'expense' && styles.breakdownToggleActive]}
                          onPress={() => setActiveBreakdownType('expense')}
                        >
                          <Text style={[styles.breakdownToggleText, activeBreakdownType === 'expense' && styles.breakdownToggleTextActive]}>Keluar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.breakdownToggle, activeBreakdownType === 'income' && styles.breakdownToggleActive]}
                          onPress={() => setActiveBreakdownType('income')}
                        >
                          <Text style={[styles.breakdownToggleText, activeBreakdownType === 'income' && styles.breakdownToggleTextActive]}>Masuk</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.breakdownBody}>
                      {currentBreakdownData.length > 0 && (
                        <View style={styles.donutContainer}>
                          <DonutChart
                            data={currentBreakdownData.slice(0, 5).map((item, index) => {
                              const palette = [
                                activeBreakdownType === 'expense' ? colors.danger : colors.success,
                                colors.info,
                                colors.primary,
                                '#A56BFF', // Purple
                                '#00D2D3', // Cyan
                                '#FF9F43', // Orange
                              ];
                              return {
                                ...item,
                                color: palette[index % palette.length]
                              };
                            })}
                            size={isCompactScreen ? 140 : 160}
                            strokeWidth={isCompactScreen ? 16 : 18}
                            totalValue={activeBreakdownType === 'expense' ? summary.totalExpense : summary.totalIncome}
                            onSegmentPress={(item) => handleTopAction('history', {
                              initialSearch: item.category,
                              initialType: activeBreakdownType
                            })}
                          />
                        </View>
                      )}

                      <View style={styles.breakdownList}>
                        {currentBreakdownData.length === 0 ? (
                          <View style={styles.breakdownEmpty}>
                            <Text style={styles.emptyText}>Belum ada data pada periode ini</Text>
                          </View>
                        ) : currentBreakdownData.slice(0, 5).map((item, index) => {
                          const totalRef = activeBreakdownType === 'expense' ? summary.totalExpense : summary.totalIncome;
                          const pct = Math.round((Number(item.total) / Math.max(totalRef || 1, 1)) * 100);
                          const palette = [
                            activeBreakdownType === 'expense' ? colors.danger : colors.success,
                            colors.info,
                            colors.primary,
                            '#A56BFF',
                            '#00D2D3',
                            '#FF9F43',
                          ];
                          const itemColor = palette[index % palette.length];
                          return (
                            <TouchableOpacity
                              key={item.category}
                              style={styles.breakdownItem}
                              onPress={() => handleTopAction('history', {
                                initialSearch: item.category,
                                initialType: activeBreakdownType
                              })}
                            >
                              <View style={styles.breakdownTopRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                                  <CategoryIcon category={item.category} iconName={item.iconName} size={16} color={colors.white} />
                                  <Text style={styles.breakdownCategory} numberOfLines={1}>{item.category}</Text>
                                </View>
                                <Text style={[styles.breakdownAmount, { color: activeBreakdownType === 'expense' ? colors.danger : colors.success }]} numberOfLines={1}>
                                  {formatCurrency(item.total)}
                                </Text>
                              </View>
                              <View style={styles.breakdownTrack}>
                                <View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: itemColor }]} />
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.recentSection, isMobile && styles.recentSectionMobile]}>
                  <View style={[styles.cardHeaderRow, isMobile && styles.cardHeaderRowMobile]}>
                    <View>
                      <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
                      <Text style={styles.sectionCaption}>Entri terakhir yang bisa langsung diedit atau dihapus</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActivePanel('history')}>
                      <Text style={styles.seeAllText}>Lihat semua</Text>
                    </TouchableOpacity>
                  </View>
                  {recentTxs.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Belum ada transaksi</Text>
                    </View>
                  ) : (
                    recentTxs.map((transaction) => (
                      <View key={transaction.id} style={[styles.transactionCard, isMobile && styles.transactionCardMobile]}>
                        <View style={styles.transactionIconWrap}>
                          <CategoryIcon
                            category={transaction.category}
                            size={19}
                            color={transaction.type === 'expense' ? colors.danger : colors.success}
                            strokeWidth={2.4}
                          />
                        </View>
                        <View style={styles.transactionMeta}>
                          <Text style={styles.transactionCategory} numberOfLines={1}>{transaction.category}</Text>
                          <Text style={styles.transactionNote} numberOfLines={1}>
                            {transaction.note || 'Tidak ada catatan'}
                          </Text>
                          <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                        </View>
                        <Text
                          numberOfLines={isCompactScreen ? 2 : 1}
                          adjustsFontSizeToFit={isMobile}
                          minimumFontScale={0.76}
                          style={[
                            styles.transactionAmount,
                            isMobile && styles.transactionAmountMobile,
                            { color: transaction.type === 'expense' ? colors.danger : colors.success },
                          ]}
                        >
                          {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
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

        {isMobile && !activePanel && (
          <TouchableOpacity
            onPress={() => setActivePanel('add')}
            style={styles.fabMobile}
            accessibilityRole="button"
            accessibilityLabel="Tambah Transaksi Baru"
          >
            <AppIcon name="add" size={28} color="#080B14" strokeWidth={2.6} />
          </TouchableOpacity>
        )}

        <Modal
          transparent
          animationType={isMobile ? 'slide' : 'fade'}
          visible={!!activePanel}
          onRequestClose={closePanel}
        >
          <View style={[styles.panelOverlay, isMobile && styles.panelOverlayMobile]}>
            {!isMobile && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={closePanel}
                style={styles.panelBackdropHitArea}
                accessibilityRole="button"
                accessibilityLabel="Tutup panel"
              />
            )}
            <View
              style={[
                styles.panelCard,
                activePanel === 'add' && styles.panelCardForm,
                isMobile && styles.panelCardMobile,
                isMobile && activePanel === 'add' && styles.panelCardMobileForm,
              ]}
            >
              {isMobile ? <View style={styles.panelGrabber} /> : null}
              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderText}>
                  <Text style={styles.panelEyebrow}>
                    {isMobile ? 'Bottom Sheet' : 'Dialog'}
                  </Text>
                  <Text style={styles.panelTitle}>
                    {activePanel === 'history' ? 'Riwayat Transaksi' : (panelParams?.mode === 'edit' ? 'Edit Transaksi' : 'Tambah Transaksi')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closePanel}
                  style={styles.panelCloseButton}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup"
                >
                  <AppIcon name="close" size={19} color={colors.dark} />
                </TouchableOpacity>
              </View>

              <View style={styles.panelBody}>
                {activePanel === 'history' ? (
                  <TransactionHistoryScreen navigation={panelNavigation} route={{ params: { ...panelParams, onDataChanged: () => fetchDashboard(activeRange) } }} />
                ) : activePanel === 'add' ? (
                  <AddTransactionScreen navigation={panelNavigation} route={{ params: { ...panelParams, onDataChanged: () => fetchDashboard(activeRange) } }} />
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
        {/* Logout Modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.logoutModalOverlay}>
            <View style={styles.logoutModalContent}>
              <View style={styles.logoutModalIcon}>
                <AppIcon name="logout" size={24} color={colors.danger} />
              </View>
              <Text style={styles.logoutModalTitle}>Konfirmasi Logout</Text>
              <Text style={styles.logoutModalText}>Apakah Anda yakin ingin keluar dari aplikasi?</Text>
              <View style={styles.logoutModalActions}>
                <TouchableOpacity
                  style={styles.logoutModalCancelButton}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.logoutModalCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutModalConfirmButton}
                  onPress={confirmLogout}
                >
                  <Text style={styles.logoutModalConfirmText}>Keluar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showTotalSavingsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTotalSavingsModal(false)}
        >
          <TouchableOpacity
            style={styles.logoutModalOverlay}
            activeOpacity={1}
            onPress={() => setShowTotalSavingsModal(false)}
          >
            <TouchableOpacity
              style={[styles.logoutModalContent, { padding: 24, width: isMobile ? '90%' : 400, maxWidth: 400, alignItems: 'center' }]}
              activeOpacity={1}
            >
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.dark }}>Total Tabungan</Text>
                <TouchableOpacity onPress={() => setShowTotalSavingsModal(false)}>
                  <AppIcon name="close" size={20} color={colors.darkGray} />
                </TouchableOpacity>
              </View>

              {loadingTotalSavings || !totalSavingsData ? (
                <View style={{ paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8, fontWeight: '600' }}>
                    Total Keseluruhan Saldo
                  </Text>
                  <Text
                    style={{
                      fontSize: 32,
                      fontWeight: '800',
                      color: totalSavingsData.balance >= 0 ? colors.success : colors.danger,
                      marginBottom: 24
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCurrency(totalSavingsData.balance)}
                  </Text>

                  <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: colors.light, padding: 16, borderRadius: 16 }}>
                      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '600', marginBottom: 6 }}>Pemasukan</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.success }} numberOfLines={1} adjustsFontSizeToFit>
                        {formatCurrency(totalSavingsData.totalIncome)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: colors.light, padding: 16, borderRadius: 16 }}>
                      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '600', marginBottom: 6 }}>Pengeluaran</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger }} numberOfLines={1} adjustsFontSizeToFit>
                        {formatCurrency(totalSavingsData.totalExpense)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  scrollContentMobile: {
    paddingBottom: spacing.xl * 2,
  },

  pageShell: {
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  pageShellMobile: {
    paddingTop: spacing.lg,
  },

  desktopShell: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    flexDirection: 'row',
  },

  sidebar: {
    width: 260,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },

  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sidebarLogo: {
    width: 22,
    height: 22,
  },

  sidebarBrandTitle: {
    color: colors.dark,
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },

  sidebarBrandCaption: {
    color: colors.mediumGray,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },

  sidebarNav: {
    flex: 1,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },

  sidebarNavItem: {
    minHeight: 48,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
  },

  sidebarNavItemActive: {
    backgroundColor: colors.primarySoft,
  },

  sidebarNavText: {
    color: colors.mediumGray,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },

  sidebarNavTextActive: {
    color: colors.primary,
  },

  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sidebarUserName: {
    color: colors.dark,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },

  sidebarUserCaption: {
    color: colors.mediumGray,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },

  sidebarLogout: {
    minHeight: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  sidebarLogoutText: {
    color: colors.dark,
    fontWeight: '800',
  },

  mainColumn: {
    flex: 1,
    minWidth: 0,
  },

  topBarDesktop: {
    minHeight: 88,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topBarDate: {
    color: colors.mediumGray,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontWeight: '700',
  },

  topBarTitle: {
    color: colors.dark,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },

  topBarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  topBarGhostButton: {
    minHeight: 44,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBarGhostButtonText: {
    color: colors.dark,
    fontWeight: '800',
  },

  topBarPrimaryButton: {
    minHeight: 44,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  topBarPrimaryButtonText: {
    color: '#080B14',
    fontWeight: '800',
  },

  panelOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  panelOverlayMobile: {
    justifyContent: 'flex-end',
    padding: 0,
  },

  panelBackdropHitArea: {
    ...StyleSheet.absoluteFillObject,
  },

  panelCard: {
    width: '100%',
    maxWidth: 1120,
    height: '88%',
    maxHeight: 820,
    backgroundColor: colors.background,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMedium,
    elevation: 8,
  },

  panelCardForm: {
    maxWidth: 760,
    height: '86%',
  },

  panelCardMobile: {
    height: '92%',
    maxHeight: '92%',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  panelCardMobileForm: {
    height: '88%',
  },

  panelGrabber: {
    width: 42,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },

  panelHeader: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
  },

  panelHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  panelEyebrow: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  panelTitle: {
    color: colors.dark,
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },

  panelCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },

  panelBody: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  },

  mobileTopBar: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  mobileMenuButton: {
    width: 54,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileBrandBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  mobileBrandLogo: {
    width: 28,
    height: 28,
  },

  mobileBrandTitle: {
    color: colors.dark,
    fontSize: fontSizes.base,
    fontWeight: '800',
    flexShrink: 1,
  },

  mobileBrandCaption: {
    color: colors.mediumGray,
    fontSize: fontSizes.xs,
    flexShrink: 1,
  },

  fabMobile: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },

  drawerBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
  },

  mobileDrawer: {
    width: '86%',
    maxWidth: 280,
    height: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },

  mobileDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  mobileDrawerTitle: {
    color: colors.dark,
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },

  mobileDrawerClose: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: '800',
  },

  mobileDrawerItem: {
    minHeight: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  mobileDrawerItemText: {
    color: colors.dark,
    fontWeight: '800',
  },

  mobileDrawerLogout: {
    marginTop: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  mobileDrawerLogoutText: {
    color: '#080B14',
    fontWeight: '800',
  },

  shell: {
    flex: 1,
  },

  shellDesktop: {
    marginLeft: 260,
    paddingTop: 88,
  },

  mobileSpacer: {
    height: 0,
  },

  header: {
    backgroundColor: colors.dark,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
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
    fontWeight: '800',
    fontSize: fontSizes.lg,
  },

  greeting: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
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
    lineHeight: 20,
  },

  welcomeCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius['3xl'],
    ...shadowSmall,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(216, 225, 236, 0.8)',
  },

  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 74,
    alignItems: 'center',
  },

  logoutText: {
    color: colors.white,
    fontWeight: '700',
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
    borderRadius: borderRadius.full,
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
    borderRadius: borderRadius['3xl'],
    ...shadowMedium,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(216, 225, 236, 0.8)',
  },

  balanceLabel: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },

  balanceAmount: {
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
    marginBottom: spacing.lg,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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

  chartFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  chartFilterBarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
  },

  monthStepper: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    flexShrink: 0,
  },

  monthStepperMobile: {
    width: '100%',
  },

  monthStepButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },

  monthStepButtonText: {
    color: colors.primary,
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },

  monthTitleBlock: {
    minWidth: 132,
    paddingHorizontal: spacing.sm,
    flexShrink: 1,
  },

  monthTitleBlockMobile: {
    flex: 1,
    minWidth: 0,
  },

  monthTitle: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  monthSubtitle: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    marginTop: 1,
  },

  rangeScroller: {
    flex: 1,
    minWidth: 0,
  },

  rangeScrollerMobile: {
    flex: 0,
    width: '100%',
  },

  rangeList: {
    gap: spacing.sm,
    paddingVertical: 2,
  },

  rangeChip: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rangeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  rangeChipText: {
    color: colors.darkGray,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },

  rangeChipTextActive: {
    color: '#080B14',
  },

  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    ...shadowSmall,
    elevation: 4,
  },

  heroCardMobile: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  heroTextBlock: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },

  heroEyebrow: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },

  heroBalance: {
    color: colors.white,
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
    marginBottom: spacing.xs,
    lineHeight: 36,
  },

  heroBalanceMobile: {
    fontSize: fontSizes['2xl'],
    lineHeight: 30,
  },

  heroCaption: {
    color: colors.muted,
    fontSize: fontSizes.sm,
  },

  heroRingWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.32)',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroRingWrapMobile: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },

  heroRingPercent: {
    color: colors.primary,
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },

  heroRingLabel: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  statGridMobile: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    rowGap: spacing.sm,
    columnGap: spacing.sm,
  },

  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadowSmall,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statCardMobile: {
    flexBasis: '48%',
    minWidth: 0,
  },

  statCardWide: {
    borderColor: 'rgba(201,168,76,0.18)',
    backgroundColor: colors.surface,
  },

  statLabel: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },

  statValueIncome: {
    color: colors.success,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    maxWidth: '100%',
  },

  statValueExpense: {
    color: colors.danger,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    maxWidth: '100%',
  },

  statValueBalance: {
    color: colors.primary,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    maxWidth: '100%',
  },

  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  contentGridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  chartCard: {
    flex: 1.6,
    minWidth: 0,
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    ...shadowSmall,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chartCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: 0,
    overflow: 'hidden',
    minWidth: 0,
  },

  breakdownCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    ...shadowSmall,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  breakdownCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: 0,
  },

  breakdownList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },

  breakdownItem: {
    marginBottom: spacing.md,
  },

  breakdownTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },

  breakdownCategory: {
    flex: 1,
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },

  breakdownAmount: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },

  breakdownTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.sm,
  },

  breakdownFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  breakdownEmpty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  cardHeaderRowMobile: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  sectionTitleBlock: {
    flex: 1,
    minWidth: 0,
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
    fontWeight: '800',
    color: colors.white,
  },

  sectionCaption: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: 2,
  },

  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 0,
    marginBottom: 0,
    flexWrap: 'wrap',
    flexShrink: 1,
  },

  chartLegendRowMobile: {
    marginTop: 0,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },

  lineChartContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    alignSelf: 'center',
    overflow: 'visible',
  },

  chartContentBlock: {
    marginTop: spacing.sm,
  },

  chartContentBlockMobile: {
    marginTop: spacing.md,
    minHeight: 0,
  },

  chartModeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: 6,
    alignSelf: 'flex-start',
  },

  chartModeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },

  chartModeButtonActive: {
    backgroundColor: colors.primary,
    ...shadowSmall,
  },

  chartModeButtonText: {
    fontSize: fontSizes.xs,
    color: colors.darkGray,
    fontWeight: '600',
  },

  chartModeButtonTextActive: {
    color: '#080B14',
  },

  chartPointDetailCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
    minWidth: 0,
  },

  chartPointDetailCardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
    flexWrap: 'nowrap',
    marginTop: spacing.md,
  },

  chartPointDetailTitle: {
    flex: 1,
    minWidth: 64,
    fontSize: fontSizes.xs,
    color: colors.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  chartPointDetailGroup: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.xs,
    justifyContent: 'center',
    flex: 1,
    minWidth: '100%',
  },

  chartPointDetailGroupMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
    width: '100%',
  },

  chartPointDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },

  chartPointDetailRowMobile: {
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
    minHeight: 28,
  },

  chartPointDetailLabel: {
    fontSize: fontSizes.sm,
    color: colors.darkGray,
    flexShrink: 0,
  },

  chartPointDetailValue: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
    maxWidth: '100%',
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
    color: colors.muted,
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
    flexWrap: 'wrap',
  },

  summaryItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadowSmall,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },

  summaryLabel: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: spacing.xs,
  },

  summaryValue: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.white,
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
    borderRadius: borderRadius['2xl'],
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
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    ...shadowSmall,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.muted,
    marginBottom: spacing.xs,
  },

  insightValue: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.white,
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
    flexWrap: 'wrap',
  },

  actionButtonItem: {
    flex: 1,
  },

  recentSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  recentSectionMobile: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },

  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 0,
  },

  transactionCardMobile: {
    alignItems: 'flex-start',
  },

  transactionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  transactionMeta: {
    flex: 1,
    paddingRight: spacing.md,
    minWidth: 0,
  },

  transactionCategory: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    color: colors.white,
  },

  transactionNote: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },

  transactionDate: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: spacing.xs,
  },

  transactionAmount: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    maxWidth: 150,
    flexShrink: 1,
    textAlign: 'right',
  },

  transactionAmountMobile: {
    maxWidth: 118,
    fontSize: fontSizes.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  seeAllText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSizes.sm,
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

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  seeAllText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSizes.sm,
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

  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 20, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },

  logoutModalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...shadowSmall,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  logoutModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  logoutModalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  logoutModalText: {
    fontSize: fontSizes.base,
    color: colors.mediumGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  logoutModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },

  logoutModalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutModalCancelText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.darkGray,
  },

  logoutModalConfirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutModalConfirmText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.white,
  },

  breakdownToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md - 2,
  },
  breakdownToggleActive: {
    backgroundColor: colors.background,
    ...shadowSmall,
  },
  breakdownToggleText: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    fontWeight: '600',
  },
  breakdownToggleTextActive: {
    color: colors.dark,
    fontWeight: '800',
  },
  breakdownBody: {
    marginTop: spacing.md,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  donutContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
});

export default DashboardScreen;
