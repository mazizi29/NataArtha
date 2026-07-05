# Data untuk Laporan Rekayasa Web - NataArtha

Dokumen ini merangkum data faktual yang dibutuhkan untuk menyusun laporan Rekayasa Web berdasarkan kondisi project saat ini.

## 1) Apakah NataArtha sudah bisa dibuka di browser?

Status: Sudah bisa dibuka secara lokal.

Bukti:
- Script web tersedia di [package.json](package.json) dengan perintah `expo start --web`.
- Runtime lokal terverifikasi pada URL: http://localhost:8081 (terbaca saat sesi browser aktif di dashboard).

Link yang tersedia saat ini:
- Lokal: http://localhost:8081

Status deployment publik:
- Belum ditemukan link publik Vercel/Netlify/Firebase Hosting di project.

## 2) Teknologi web yang dipakai

Status: Menggunakan Expo Web + React Native Web (bukan frontend web terpisah).

Bukti:
- Script web: [package.json](package.json)
- Dependensi `expo`: [package.json](package.json)
- Dependensi `react-native-web`: [package.json](package.json)
- Dependensi `react-dom`: [package.json](package.json)

Kesimpulan:
- Basis aplikasi tunggal React Native dengan target web lewat Expo.
- Tidak ada folder frontend web terpisah (misalnya Next.js/Vite app terpisah) di struktur proyek saat ini.

## 3) Responsive layout

Status: Ada adaptasi desktop/mobile, tetapi pola utama tetap mirip mobile-first.

Bukti teknis:
- `useWindowDimensions` untuk menyesuaikan elemen berdasarkan lebar layar di [src/screens/DashboardScreen.js](src/screens/DashboardScreen.js).
- Variasi styling khusus web menggunakan `Platform.select({ web: ... })` di [src/screens/DashboardScreen.js](src/screens/DashboardScreen.js).
- Cabang UI web khusus pada form tanggal `Platform.OS === 'web'` di [src/screens/AddTransactionScreen.js](src/screens/AddTransactionScreen.js).

Catatan layout:
- Belum ada implementasi sidebar desktop khusus.
- Navigasi tetap stack-style, bukan layout dashboard sidebar khas desktop.

## 4) Routing web

Status: Menggunakan React Navigation stack, bukan route URL browser yang eksplisit per halaman.

Bukti teknis:
- `NavigationContainer` di [src/navigation/AppNavigator.js](src/navigation/AppNavigator.js#L95)
- Stack navigator di [src/navigation/AppNavigator.js](src/navigation/AppNavigator.js#L15)
- Screen `Login`, `Register`, `Dashboard`, `AddTransaction`, `TransactionHistory` didefinisikan di [src/navigation/AppNavigator.js](src/navigation/AppNavigator.js)

Kesimpulan route browser:
- Selama pengujian, URL browser tetap pada root (`/`) saat pindah layar.
- Tidak ditemukan pola URL seperti `/dashboard` atau `/login` berbasis browser routing.

## 5) Hosting / Deployment

Status: Belum ada konfigurasi deployment publik yang terdeteksi.

Pengecekan file konfigurasi:
- Tidak ada `vercel.json`
- Tidak ada `netlify.toml`
- Tidak ada `firebase.json`

Kesimpulan:
- Proyek saat ini siap untuk dijalankan lokal (development web), namun belum terpasang pipeline deployment publik.

## 6) Fitur web khusus (kalau ada)

Status: Ada beberapa optimasi/perilaku khusus web.

Bukti:
- Shadow khusus web (`boxShadow`) lewat `Platform.select` di [src/screens/DashboardScreen.js](src/screens/DashboardScreen.js).
- Kalender web custom pada tambah transaksi (`showWebCalendar`) di [src/screens/AddTransactionScreen.js](src/screens/AddTransactionScreen.js).
- Render chart custom dengan `react-native-svg` pada dashboard di [src/screens/DashboardScreen.js](src/screens/DashboardScreen.js).

Yang belum ditemukan:
- Keyboard shortcut khusus web.
- Drag-scroll khusus desktop.
- Sistem route browser bertingkat.

## 7) Kebutuhan screenshot browser

Minimum screenshot yang disarankan untuk laporan web:
- Login di browser
- Dashboard desktop
- Responsive mode (simulasi lebar kecil)
- History page
- Add transaction page

Status file screenshot saat ini:
- Yang tersedia di folder [Aset](Aset) adalah screenshot kode/final figure laporan (format `Gambar_...`).
- Screenshot browser murni (UI halaman web) belum disiapkan sebagai paket final saat ini.

Saran eksekusi cepat:
1. Jalankan `npm run web`.
2. Ambil 5 screenshot browser minimum pada daftar di atas.
3. Simpan konsisten nama file, contoh:
   - `Web_Login.png`
   - `Web_Dashboard_Desktop.png`
   - `Web_Dashboard_Responsive.png`
   - `Web_History.png`
   - `Web_AddTransaction.png`

## Ringkasan singkat untuk dimasukkan ke laporan

- NataArtha sudah berjalan di browser melalui Expo Web (lokal).
- Arsitektur web menggunakan React Native Web, bukan frontend terpisah.
- Layout memiliki beberapa adaptasi web, namun tetap mobile-first.
- Navigasi memakai React Navigation stack tanpa URL route browser eksplisit.
- Deployment publik belum dikonfigurasi.
- Fitur web khusus yang nyata: web calendar, styling web-specific, dan chart SVG custom.
