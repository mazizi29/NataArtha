import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCnS9Xcs5sX-Pe6g8K9RBgqEMykiR4Deq0',
  authDomain: 'financeapp-181d0.firebaseapp.com',
  projectId: 'financeapp-181d0',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log('Logging in...');
  const credential = await signInWithEmailAndPassword(auth, '123@gogo.com', '123456');
  const userId = credential.user.uid;
  console.log('Logged in as', userId);

  console.log('Fetching existing transactions...');
  const txCol = collection(db, 'transactions');
  const q = query(txCol, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  console.log(`Found ${snapshot.docs.length} transactions. Deleting all for a fresh start...`);
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, 'transactions', document.id));
  }
  console.log('Deleted old transactions.');

  console.log('Generating realistic student transactions...');
  
  const transactions = [];
  const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-07-07');
  
  let current = new Date(startDate);

  // Generate for each day
  while(current <= endDate) {
    const isFirstOfMonth = current.getDate() === 1;
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const isMidMonth = current.getDate() === 15;
    
    // Uang saku bulanan dari ortu (Income)
    if (isFirstOfMonth) {
      transactions.push({
        amount: Math.floor(Math.random() * 5 + 15) * 100000, // Rp 1.500.000 - 2.000.000
        category: 'Transfer',
        type: 'income',
        date: toIsoDate(current),
        note: 'Uang Saku Bulanan dari Ortu',
      });
      
      // Beli paket data awal bulan
      transactions.push({
        amount: Math.floor(Math.random() * 4 + 6) * 10000, // Rp 60.000 - 100.000
        category: 'Tagihan',
        type: 'expense',
        date: toIsoDate(current),
        note: 'Beli Kuota Internet / Paket Data',
      });
    }

    // Pendapatan sampingan mahasiswa (tugas, asisten, dll) kadang-kadang
    if (isMidMonth && Math.random() > 0.6) {
      transactions.push({
        amount: Math.floor(Math.random() * 5 + 5) * 20000, // Rp 100.000 - 200.000
        category: 'Freelance',
        type: 'income',
        date: toIsoDate(current),
        note: 'Project sampingan / Asdos',
      });
    }

    // Pengeluaran Harian
    const numExpenses = Math.floor(Math.random() * 4) + 1; // 1 to 4 expenses a day
    for(let i=0; i<numExpenses; i++) {
      let amount = 0;
      let note = '';
      let cat = '';

      const rand = Math.random();
      if (rand < 0.4) {
        // Makan (Kantin/Warteg)
        cat = 'Makanan';
        amount = Math.floor(Math.random() * 3 + 2) * 5000; // Rp 10.000 - 25.000
        note = 'Makan Kantin / Warteg / Nasi Padang';
      } else if (rand < 0.6) {
        // Jajan / Es Teh
        cat = 'Jajan';
        amount = Math.floor(Math.random() * 2 + 1) * 5000; // Rp 5.000 - 15.000
        note = 'Beli Es Teh / Kopi Susu';
      } else if (rand < 0.75) {
        // Bensin / Parkir / Gojek dekat
        cat = 'Transportasi';
        amount = Math.floor(Math.random() * 3 + 1) * 5000; // Rp 5.000 - 20.000
        note = 'Isi bensin motor / Parkir / Ojol deket';
      } else if (rand < 0.85) {
        // Fotokopi / Kebutuhan Kuliah
        cat = 'Pendidikan';
        amount = Math.floor(Math.random() * 4 + 1) * 2500; // Rp 2.500 - 12.500
        note = 'Print tugas / Fotokopi modul';
      } else if (isWeekend && rand < 0.95) {
        // Nongkrong akhir pekan
        cat = 'Hiburan';
        amount = Math.floor(Math.random() * 4 + 4) * 10000; // Rp 40.000 - 80.000
        note = 'Nongkrong sama teman / Nonton Bioskop';
      } else {
        // Kebutuhan kos (Sabun, odol)
        cat = 'Belanja';
        amount = Math.floor(Math.random() * 4 + 2) * 10000; // Rp 20.000 - 60.000
        note = 'Belanja kebutuhan kos (sabun, odol, dsb di minimarket)';
      }

      if (amount > 0) {
        transactions.push({
          amount,
          category: cat,
          type: 'expense',
          date: toIsoDate(current),
          note,
        });
      }
    }
    
    current.setDate(current.getDate() + 1);
  }

  // Insert to firestore in batches for better performance, but here loop is fine since it's a seed script
  console.log(`Inserting ${transactions.length} transactions. Please wait...`);
  for (const tx of transactions) {
    await addDoc(txCol, {
      ...tx,
      userId,
      createdAt: serverTimestamp(),
    });
  }

  console.log(`Successfully inserted ${transactions.length} student-realistic transactions!`);
  process.exit(0);
}

run().catch(console.error);
