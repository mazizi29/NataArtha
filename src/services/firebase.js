import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCnS9Xcs5sX-Pe6g8K9RBgqEMykiR4Deq0',
  authDomain: 'financeapp-181d0.firebaseapp.com',
  projectId: 'financeapp-181d0',
  storageBucket: 'financeapp-181d0.firebasestorage.app',
  messagingSenderId: '856281689164',
  appId: '1:856281689164:web:8cc894593195a26e3a18e9',
  measurementId: 'G-MFCXHZMV2G',
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
