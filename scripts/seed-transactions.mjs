import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCnS9Xcs5sX-Pe6g8K9RBgqEMykiR4Deq0',
  authDomain: 'financeapp-181d0.firebaseapp.com',
  projectId: 'financeapp-181d0',
  storageBucket: 'financeapp-181d0.firebasestorage.app',
  messagingSenderId: '856281689164',
  appId: '1:856281689164:web:8cc894593195a26e3a18e9',
  measurementId: 'G-MFCXHZMV2G',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL = process.env.SEED_EMAIL || process.argv[2] || '123@gogo.com';
const PASSWORD = process.env.SEED_PASSWORD || process.argv[3] || '123456';
const TOTAL_TRANSACTIONS = Number(process.env.SEED_TOTAL || 30);

const EXPENSE_CATALOG = [
  { category: 'Makanan', min: 18000, max: 120000, notes: ['Sarapan warung', 'Makan siang kantor', 'Makan malam keluarga', 'Beli camilan minimarket'] },
  { category: 'Minuman', min: 8000, max: 45000, notes: ['Kopi pagi', 'Es kopi susu', 'Air mineral galon', 'Minuman setelah olahraga'] },
  { category: 'Jajan', min: 10000, max: 65000, notes: ['Snack sore', 'Roti dan susu', 'Cemilan akhir pekan', 'Jajanan kantor'] },
  { category: 'Transportasi', min: 12000, max: 150000, notes: ['Ojol ke kantor', 'Isi bensin motor', 'Parkir harian', 'Tol perjalanan kerja'] },
  { category: 'Tagihan', min: 75000, max: 850000, notes: ['Bayar listrik bulanan', 'Tagihan internet rumah', 'Bayar air PAM', 'Pulsa dan paket data'] },
  { category: 'Belanja', min: 45000, max: 550000, notes: ['Belanja kebutuhan rumah', 'Beli perlengkapan mandi', 'Belanja bulanan minimarket', 'Beli alat kebersihan'] },
  { category: 'Kesehatan', min: 35000, max: 400000, notes: ['Beli vitamin', 'Konsultasi klinik', 'Beli obat flu', 'Medical check ringan'] },
  { category: 'Hiburan', min: 25000, max: 300000, notes: ['Nonton bioskop', 'Langganan streaming', 'Main game akhir pekan', 'Ngopi santai dengan teman'] },
  { category: 'Pendidikan', min: 30000, max: 450000, notes: ['Beli buku belajar', 'Bayar kursus online', 'Fotokopi materi kuliah', 'Workshop singkat'] },
  { category: 'Asuransi', min: 120000, max: 600000, notes: ['Premi asuransi bulanan', 'Top up proteksi kesehatan', 'Pembayaran polis', 'Iuran perlindungan'] },
  { category: 'Pinjaman', min: 150000, max: 900000, notes: ['Cicilan pinjaman bulanan', 'Bayar angsuran teman', 'Pelunasan sebagian pinjaman', 'Pembayaran cicilan aplikasi'] },
  { category: 'Lainnya', min: 20000, max: 250000, notes: ['Keperluan mendadak', 'Biaya administrasi', 'Sumbangan acara', 'Pengeluaran lain-lain'] },
];

const INCOME_CATALOG = [
  { category: 'Gaji', min: 900000, max: 1800000, notes: ['Gaji bulanan', 'Transfer payroll', 'Pembayaran gaji periode ini'] },
  { category: 'Bonus', min: 150000, max: 700000, notes: ['Bonus kinerja', 'Insentif bulanan', 'Reward target tercapai'] },
  { category: 'Freelance', min: 200000, max: 900000, notes: ['Bayaran desain freelance', 'Jasa konsultasi singkat', 'Proyek sampingan'] },
  { category: 'Investasi', min: 120000, max: 600000, notes: ['Profit reksa dana', 'Keuntungan trading', 'Pencairan investasi'] },
  { category: 'Usaha', min: 250000, max: 1000000, notes: ['Laba penjualan harian', 'Pendapatan toko kecil', 'Omzet mingguan'] },
  { category: 'Sewa', min: 250000, max: 900000, notes: ['Pendapatan sewa kamar', 'Sewa alat kerja', 'Sewa properti bulanan'] },
  { category: 'Dividen', min: 100000, max: 500000, notes: ['Dividen saham', 'Bagi hasil investasi', 'Pendapatan pasif'] },
  { category: 'Pengembalian', min: 75000, max: 450000, notes: ['Refund belanja online', 'Pengembalian uang teman', 'Reimburse kantor'] },
  { category: 'Hadiah', min: 50000, max: 350000, notes: ['Hadiah ulang tahun', 'Uang apresiasi', 'Hadiah lomba'] },
  { category: 'Tabungan', min: 120000, max: 500000, notes: ['Pencairan tabungan', 'Ambil dana tabungan', 'Mutasi dari rekening simpanan'] },
  { category: 'Lainnya', min: 50000, max: 300000, notes: ['Pemasukan lain-lain', 'Cashback marketplace', 'Pendapatan tak terduga'] },
];

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPick = (items) => items[randomInt(0, items.length - 1)];

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildConsecutiveDates = (count) => {
  const today = new Date();
  const start = new Date(today.getTime() - 59 * ONE_DAY_MS);
  const maxSpan = 59;
  const dates = [];

  for (let i = 0; i < count; i += 1) {
    const offset = Math.round((i * maxSpan) / Math.max(1, count - 1));
    const date = new Date(start.getTime() + offset * ONE_DAY_MS);
    dates.push(toIsoDate(date));
  }

  return dates;
};

const buildTransaction = (type, date) => {
  const catalog = type === 'income' ? INCOME_CATALOG : EXPENSE_CATALOG;
  const item = randomPick(catalog);

  return {
    type,
    category: item.category,
    amount: randomInt(item.min, item.max),
    note: randomPick(item.notes),
    date,
  };
};

const getMonthKey = (isoDate) => String(isoDate).slice(0, 7);

const distributeTotal = (total, count) => {
  if (count <= 0) return [];
  if (count === 1) return [total];

  const minAmount = Math.max(50000, Math.floor(total / (count * 3) / 1000) * 1000);
  const weights = Array.from({ length: count }, () => randomInt(6, 14));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);

  const amounts = weights.map((weight) => {
    const raw = (weight / weightSum) * total;
    return Math.max(minAmount, Math.round(raw / 1000) * 1000);
  });

  let sum = amounts.reduce((acc, value) => acc + value, 0);
  let diff = total - sum;
  let guard = 0;

  while (diff !== 0 && guard < 10000) {
    const step = diff > 0 ? 1000 : -1000;
    const index = guard % amounts.length;
    if (step > 0 || amounts[index] + step >= minAmount) {
      amounts[index] += step;
      diff -= step;
    }
    guard += 1;
  }

  return amounts;
};

const normalizeIncomeByMonth = (transactions) => {
  const grouped = new Map();
  transactions.forEach((item) => {
    const key = getMonthKey(item.date);
    const rows = grouped.get(key) || [];
    rows.push(item);
    grouped.set(key, rows);
  });

  const monthlyTargets = new Map();

  for (const [monthKey, rows] of grouped.entries()) {
    const target = randomInt(2000000, 4000000);
    const distributed = distributeTotal(target, rows.length);

    rows.forEach((row, index) => {
      row.amount = distributed[index] || row.amount;
    });

    monthlyTargets.set(monthKey, target);
  }

  return monthlyTargets;
};

const buildDataset = (total) => {
  const transactions = [];
  const dates = buildConsecutiveDates(total);

  for (let i = 0; i < dates.length; i += 1) {
    // Approx 30% income spread regularly over timeline.
    const type = i % 4 === 0 || i % 9 === 0 ? 'income' : 'expense';
    transactions.push(buildTransaction(type, dates[i]));
  }

  const incomeRows = transactions.filter((tx) => tx.type === 'income');
  normalizeIncomeByMonth(incomeRows);

  return transactions;
};

const toDateValue = (isoDate) => {
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeExistingIncomeTransactions = async (userId, startIso, endIso) => {
  const snapshot = await getDocs(query(collection(db, 'transactions'), where('userId', '==', userId)));

  const candidates = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => {
      if (item.type !== 'income') return false;
      if (!item.date || typeof item.date !== 'string') return false;
      const parsed = toDateValue(item.date);
      if (!parsed) return false;
      return item.date >= startIso && item.date <= endIso;
    });

  const grouped = new Map();
  candidates.forEach((row) => {
    const key = getMonthKey(row.date);
    const rows = grouped.get(key) || [];
    rows.push(row);
    grouped.set(key, rows);
  });

  const monthSummaries = [];
  let editedCount = 0;

  for (const [monthKey, rows] of grouped.entries()) {
    const target = randomInt(2000000, 4000000);
    const distributed = distributeTotal(target, rows.length);

    for (let i = 0; i < rows.length; i += 1) {
      const tx = rows[i];
      const nextAmount = distributed[i] || tx.amount;
      await updateDoc(doc(db, 'transactions', tx.id), {
        amount: nextAmount,
      });
      editedCount += 1;
    }

    monthSummaries.push({ month: monthKey, target, count: rows.length });
  }

  return { editedCount, monthSummaries };
};

const run = async () => {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Email/password tidak ditemukan. Set SEED_EMAIL dan SEED_PASSWORD.');
  }

  const credential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
  const userId = credential.user.uid;
  const transactions = buildDataset(TOTAL_TRANSACTIONS);
  const startIso = toIsoDate(new Date(Date.now() - 59 * ONE_DAY_MS));
  const endIso = toIsoDate(new Date());

  let created = 0;
  for (const tx of transactions) {
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      userId,
      createdAt: serverTimestamp(),
    });
    created += 1;
  }

  const editedResult = await normalizeExistingIncomeTransactions(userId, startIso, endIso);

  const incomeTotal = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const dates = transactions.map((tx) => tx.date).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  console.log(`Login sukses: ${EMAIL}`);
  console.log(`Berhasil membuat ${created} transaksi berurutan (2 bulan terakhir).`);
  console.log(`Rentang tanggal: ${firstDate} s/d ${lastDate}`);
  console.log(`Total pemasukan data baru: ${incomeTotal}`);
  console.log(`Total pengeluaran: ${expenseTotal}`);
  console.log(`Berhasil edit ${editedResult.editedCount} transaksi pemasukan existing/new.`);
  editedResult.monthSummaries.forEach((item) => {
    console.log(`Target pemasukan ${item.month}: ${item.target} (jumlah transaksi: ${item.count})`);
  });
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Gagal seeding transaksi:', error.message);
    process.exit(1);
  });
