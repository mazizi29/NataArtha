import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const usersCollection = collection(db, 'users');
const transactionsCollection = collection(db, 'transactions');
const categoriesCollection = collection(db, 'categories');
const PENDING_KEY = '@nataartha:pending_transactions';

const PERIOD_PRESETS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  all: null,
};

const getStartOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPeriodBounds = (params = {}) => {
  const referenceDate = params.referenceDate ? new Date(params.referenceDate) : new Date();
  const endDate = params.endDate ? getStartOfDay(new Date(params.endDate)) : getStartOfDay(referenceDate);

  if (params.period === 'all' || (!params.period && !params.startDate && !params.endDate)) {
    return { startDate: null, endDate, period: params.period || 'all' };
  }

  if (params.startDate || params.endDate) {
    return {
      startDate: params.startDate ? getStartOfDay(new Date(params.startDate)) : null,
      endDate,
      period: params.period || 'custom',
    };
  }

  const days = PERIOD_PRESETS[params.period] || PERIOD_PRESETS['30d'];
  const startDate = getStartOfDay(addDays(endDate, -(days - 1)));
  return { startDate, endDate, period: params.period || '30d' };
};

const checkRegisteredEmail = async (email) => {
  const normalizedEmail = String(email || '').trim();
  if (!normalizedEmail) return false;

  const candidates = Array.from(
    new Set([normalizedEmail, normalizedEmail.toLowerCase()])
  );

  for (const candidate of candidates) {
    const methods = await fetchSignInMethodsForEmail(auth, candidate);
    if (methods && methods.length > 0) {
      return true;
    }

    const userQuery = query(usersCollection, where('email', '==', candidate));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      return true;
    }
  }

  return false;
};

const getFriendlyAuthErrorMessage = async (error, email) => {
  const errorCode = error?.code || '';

  if (
    errorCode === 'auth/invalid-login-credentials' ||
    errorCode === 'auth/invalid-credential'
  ) {
    try {
      const isRegistered = await checkRegisteredEmail(email);
      if (!isRegistered) {
        return 'Akun belum terdaftar. Silakan daftar terlebih dahulu';
      }
      return 'Password salah';
    } catch (lookupError) {
      return 'Email atau password salah';
    }
  }

  if (errorCode === 'auth/user-not-found') {
    try {
      const isRegistered = await checkRegisteredEmail(email);
      if (!isRegistered) {
        return 'Akun belum terdaftar. Silakan daftar terlebih dahulu';
      }
      return 'Password salah';
    } catch (lookupError) {
      return 'Email atau password salah';
    }
  }

  if (errorCode === 'auth/wrong-password') {
    return 'Password salah';
  }

  if (errorCode === 'auth/email-already-in-use') {
    return 'Email sudah terdaftar';
  }

  if (errorCode === 'auth/invalid-email') {
    return 'Format email tidak valid';
  }

  if (errorCode === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan login. Coba lagi nanti';
  }

  return error?.message || 'Terjadi kesalahan autentikasi';
};

const getTransactionDate = (transaction) => {
  if (!transaction?.date) return null;
  const parsed = new Date(transaction.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinBounds = (transaction, bounds) => {
  const transactionDate = getTransactionDate(transaction);
  if (!transactionDate) return false;

  const normalized = getStartOfDay(transactionDate);
  if (bounds.startDate && normalized < bounds.startDate) return false;
  if (bounds.endDate && normalized > bounds.endDate) return false;
  return true;
};

const sortTransactions = (rows) => {
  return rows.sort((a, b) => {
    const dateA = a?.date ? new Date(a.date).getTime() : 0;
    const dateB = b?.date ? new Date(b.date).getTime() : 0;

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    const createdA = a?.createdAt?.seconds || 0;
    const createdB = b?.createdAt?.seconds || 0;
    return createdB - createdA;
  });
};

const buildDailySeries = (transactions, bounds) => {
  if (!bounds.startDate || !bounds.endDate) {
    return [];
  }

  const seriesMap = new Map();
  const dayCursor = getStartOfDay(bounds.startDate);
  const finalDay = getStartOfDay(bounds.endDate);

  while (dayCursor <= finalDay) {
    seriesMap.set(toIsoDate(dayCursor), {
      date: toIsoDate(dayCursor),
      income: 0,
      expense: 0,
    });
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  transactions.forEach((transaction) => {
    const transactionDate = getTransactionDate(transaction);
    if (!transactionDate) return;

    const key = toIsoDate(getStartOfDay(transactionDate));
    const current = seriesMap.get(key);
    if (!current) return;

    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'income') {
      current.income += amount;
    } else {
      current.expense += amount;
    }
  });

  return Array.from(seriesMap.values());
};

const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const buildChartSeries = (transactions, bounds, period) => {
  if (!bounds.startDate || !bounds.endDate) {
    return [];
  }

  if (period === '1y') {
    const monthMap = new Map();
    const cursor = getStartOfDay(bounds.startDate);
    const end = getStartOfDay(bounds.endDate);

    while (cursor <= end) {
      const key = getMonthKey(cursor);
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          label: cursor.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          income: 0,
          expense: 0,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setDate(1);
    }

    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDate(transaction);
      if (!transactionDate) return;

      const key = getMonthKey(transactionDate);
      const current = monthMap.get(key);
      if (!current) return;

      const amount = Number(transaction.amount) || 0;
      if (transaction.type === 'income') {
        current.income += amount;
      } else {
        current.expense += amount;
      }
    });

    return Array.from(monthMap.values());
  }

  if (period === '90d') {
    const bucketMap = new Map();
    const cursor = getStartOfDay(bounds.startDate);
    let bucketIndex = 1;

    while (cursor <= bounds.endDate) {
      const bucketStart = new Date(cursor);
      const bucketEnd = addDays(bucketStart, 6);
      const key = `week-${bucketIndex}`;
      bucketMap.set(key, {
        label: `${bucketStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`,
        income: 0,
        expense: 0,
        bucketStart,
        bucketEnd,
      });
      cursor.setDate(cursor.getDate() + 7);
      bucketIndex += 1;
    }

    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDate(transaction);
      if (!transactionDate) return;

      for (const bucket of bucketMap.values()) {
        if (transactionDate >= bucket.bucketStart && transactionDate <= bucket.bucketEnd) {
          const amount = Number(transaction.amount) || 0;
          if (transaction.type === 'income') {
            bucket.income += amount;
          } else {
            bucket.expense += amount;
          }
          break;
        }
      }
    });

    return Array.from(bucketMap.values()).map(({ label, income, expense }) => ({ label, income, expense }));
  }

  return buildDailySeries(transactions, bounds).map((item) => ({
    label: new Date(item.date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    }),
    income: item.income,
    expense: item.expense,
  }));
};

const buildCategoryBreakdown = (transactions) => {
  const categoryTotals = new Map();

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (amount <= 0) return;

    const category = transaction.category || 'Lainnya';
    const iconName = transaction.iconName || null;
    const current = categoryTotals.get(category) || { category, iconName, income: 0, expense: 0, total: 0 };
    if (!current.iconName && iconName) current.iconName = iconName;

    if (transaction.type === 'income') {
      current.income += amount;
    } else {
      current.expense += amount;
    }

    current.total += amount;
    categoryTotals.set(category, current);
  });

  return Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
};

const computeSummary = (transactions) => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
};

const buildInsights = (transactions, bounds) => {
  const summary = computeSummary(transactions);
  const categoryBreakdown = buildCategoryBreakdown(transactions.filter((item) => item.type === 'expense'));
  const dailySeries = buildDailySeries(transactions, bounds);
  const averageTransaction = transactions.length > 0 ? (summary.totalIncome + summary.totalExpense) / transactions.length : 0;
  const savingsRate = summary.totalIncome > 0 ? ((summary.balance / summary.totalIncome) * 100) : 0;

  return {
    summary,
    transactionCount: transactions.length,
    averageTransaction,
    savingsRate,
    categoryBreakdown,
    dailySeries,
    chartSeries: buildChartSeries(transactions, bounds, bounds.period),
    recentTransactions: transactions.slice(0, 5),
  };
};

const mapFirebaseUser = async (firebaseUser) => {
  if (!firebaseUser) {
    return null;
  }

  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);
  const userDoc = userDocSnap.exists() ? userDocSnap.data() : {};

  return {
    id: firebaseUser.uid,
    name: userDoc.name || firebaseUser.displayName || 'User',
    email: firebaseUser.email,
  };
};

const ensureAuthUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Silakan login terlebih dahulu');
  }
  return user;
};

export const subscribeAuthState = (onSession) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onSession({ token: null, user: null });
      return;
    }

    const token = await firebaseUser.getIdToken();
    const user = await mapFirebaseUser(firebaseUser);
    onSession({ token, user });
  });
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const loginUser = async (email, password) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const token = await credential.user.getIdToken();
    const user = await mapFirebaseUser(credential.user);
    return { token, user };
  } catch (error) {
    throw new Error(await getFriendlyAuthErrorMessage(error, email));
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(usersCollection, credential.user.uid), {
      name,
      email,
      createdAt: serverTimestamp(),
    });

    const token = await credential.user.getIdToken();
    const user = {
      id: credential.user.uid,
      name,
      email,
    };

    return { token, user };
  } catch (error) {
    throw new Error(await getFriendlyAuthErrorMessage(error, email));
  }
};

export const getCustomCategories = async () => {
  try {
    const currentUser = ensureAuthUser();
    const q = query(categoriesCollection, where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('getCustomCategories error:', error);
    return [];
  }
};

export const addCustomCategory = async (data) => {
  try {
    const currentUser = ensureAuthUser();
    const payload = {
      name: data.name,
      type: data.type,
      iconName: data.iconName || null,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(categoriesCollection, payload);
    return { id: ref.id, ...payload };
  } catch (error) {
    throw new Error(error?.message || 'Gagal menyimpan kategori');
  }
};

export const getTransactions = async (params = {}) => {
  try {
    const currentUser = ensureAuthUser();
    const page = Number(params.page || 1);
    const limitValue = params.limit == null || params.limit === 'all' ? null : Number(params.limit || 20);
    const bounds = getPeriodBounds(params);

    const q = query(transactionsCollection, where('userId', '==', currentUser.uid));

    const snapshot = await getDocs(q);
    const allRows = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    const filteredRows = allRows.filter((item) => isWithinBounds(item, bounds));
    sortTransactions(filteredRows);

    if (limitValue === null) {
      return filteredRows;
    }

    const start = (page - 1) * limitValue;
    return filteredRows.slice(start, start + limitValue);
  } catch (error) {
    throw new Error(error?.message || 'Gagal mengambil transaksi');
  }
};

export const addTransaction = async (data) => {
  try {
    const currentUser = ensureAuthUser();
    const payload = {
      amount: Number(data.amount) || 0,
      category: data.category || 'Other',
      iconName: data.iconName || null,
      date: data.date,
      note: data.note || '',
      type: data.type || 'expense',
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(transactionsCollection, payload);
    return { id: ref.id, ...payload };
  } catch (error) {
    // If write fails (offline / permission), persist locally for later flush
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      const pending = raw ? JSON.parse(raw) : [];
      const localEntry = {
        id: `local-${Date.now()}`,
        amount: Number(data.amount) || 0,
        category: data.category || 'Other',
        iconName: data.iconName || null,
        date: data.date,
        note: data.note || '',
        type: data.type || 'expense',
        userId: auth.currentUser?.uid || null,
        createdAt: { local: true, ts: Date.now() },
      };
      pending.push(localEntry);
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      return { id: localEntry.id, ...localEntry, _pending: true };
    } catch (e) {
      throw new Error(error?.message || 'Gagal menambah transaksi');
    }
  }
};

export const getPendingTransactions = async () => {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const clearPendingTransactions = async () => {
  await AsyncStorage.removeItem(PENDING_KEY);
};

export const flushPendingTransactions = async () => {
  const pending = await getPendingTransactions();
  if (!pending || pending.length === 0) return { flushed: 0 };
  const currentUser = auth.currentUser;
  if (!currentUser) return { flushed: 0, reason: 'no-auth' };

  let flushed = 0;
  const remaining = [];

  for (const item of pending) {
    try {
      const payload = {
        amount: Number(item.amount) || 0,
        category: item.category || 'Other',
        iconName: item.iconName || null,
        date: item.date,
        note: item.note || '',
        type: item.type || 'expense',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      };
      await addDoc(transactionsCollection, payload);
      flushed += 1;
    } catch (err) {
      console.warn('Failed flushing pending tx', err.message || err);
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  } else {
    await clearPendingTransactions();
  }

  return { flushed };
};

export const updateTransaction = async (id, data) => {
  try {
    const currentUser = ensureAuthUser();
    const ref = doc(db, 'transactions', id);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan');
    }

    if (snapshot.data().userId !== currentUser.uid) {
      throw new Error('Tidak punya akses mengubah transaksi ini');
    }

    const payload = {
      ...data,
      amount: Number(data.amount),
    };

    await updateDoc(ref, payload);
    return { id, ...snapshot.data(), ...payload };
  } catch (error) {
    throw new Error(error?.message || 'Gagal mengubah transaksi');
  }
};

export const deleteTransaction = async (id) => {
  try {
    const currentUser = ensureAuthUser();
    const ref = doc(db, 'transactions', id);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      throw new Error('Transaksi tidak ditemukan');
    }

    if (snapshot.data().userId !== currentUser.uid) {
      throw new Error('Tidak punya akses menghapus transaksi ini');
    }

    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    throw new Error(error?.message || 'Gagal menghapus transaksi');
  }
};

export const getSummary = async (params = {}) => {
  try {
    const bounds = getPeriodBounds(params);
    const currentUser = ensureAuthUser();
    const q = query(transactionsCollection, where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    const rows = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter((item) => isWithinBounds(item, bounds));

    return computeSummary(rows);
  } catch (error) {
    throw new Error(error?.message || 'Gagal mengambil ringkasan');
  }
};

export const getDashboardInsights = async (params = {}) => {
  try {
    const currentUser = ensureAuthUser();
    const bounds = getPeriodBounds(params);
    const q = query(transactionsCollection, where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    const allRows = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    const rows = sortTransactions(allRows.filter((item) => isWithinBounds(item, bounds)));
    const insights = buildInsights(rows, bounds);

    if (bounds.startDate && bounds.endDate) {
      const diffMs = bounds.endDate.getTime() - bounds.startDate.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const prevEndDate = new Date(bounds.startDate.getTime() - oneDayMs);
      const prevStartDate = new Date(prevEndDate.getTime() - diffMs);
      const prevBounds = { startDate: prevStartDate, endDate: prevEndDate };
      const prevRows = allRows.filter((item) => isWithinBounds(item, prevBounds));
      insights.previousSummary = computeSummary(prevRows);
    } else {
      insights.previousSummary = null;
    }

    return insights;
  } catch (error) {
    throw new Error(error?.message || 'Gagal mengambil insight dashboard');
  }
};
