# Panduan Utama NataArtha

Dokumen ini adalah panduan utama untuk proyek aplikasi keuangan berbasis React Native + Expo. Semua alur penting, struktur folder, fungsi tiap file, dan cara menjalankan aplikasi lewat Expo Go maupun web dijelaskan di sini supaya tidak perlu membuka banyak file lain.

---

## 1. Ringkasan Proyek

**Nama aplikasi:** NataArtha  
**Jenis aplikasi:** Pencatatan keuangan pribadi  
**Framework:** React Native + Expo  
**Backend:** Firebase Auth + Firestore  
**Target akses:** Expo Go di Android/iOS dan web browser

### Status saat ini
- Aplikasi bisa dijalankan lewat **Expo Go** untuk development dan testing.
- Aplikasi juga bisa dijalankan lewat **web** karena export web sudah berhasil.
- Aplikasi **belum** menjadi APK/IPA standalone installable untuk store, karena masih berada di fase Expo development.

### Target penggunaan yang paling aman
- **Expo Go** dipakai untuk workflow harian saat source sering berubah.
- **Web** dipakai untuk cek layout browser dan memastikan hasil export tidak rusak.
- **Folder generated** seperti `.expo/` dan `dist/` bukan source utama; keduanya bisa dibuat ulang.

---

## 2. Dua Cara Akses Aplikasi

### 2.1 Akses lewat Expo Go

Expo Go dipakai untuk membuka aplikasi saat development.

**Ciri-ciri:**
- Aplikasi berjalan di dalam container Expo Go.
- Cocok untuk uji UI, alur login, input transaksi, dashboard, dan integrasi Firebase.
- Tidak menghasilkan APK/IPA mandiri.
- Sangat cocok untuk debugging cepat karena reload lebih singkat dibanding build rilis.
- Akan mengikuti perilaku native mobile, jadi ini referensi utama untuk validasi layar Android/iPhone.

**Perintah yang biasa dipakai:**
```bash
npm start
```

Jika butuh koneksi LAN yang lebih stabil:
```bash
npm run start:lan
```

### 2.2 Akses lewat Web

Mode web dipakai untuk membuka aplikasi di browser.

**Ciri-ciri:**
- Cocok untuk verifikasi tampilan desktop dan browser.
- Mendukung export statis ke folder `dist`.
- Sudah berhasil diuji dengan `npx expo export --platform web`.
- Memakai `react-native-web`, jadi beberapa perilaku native bisa sedikit berbeda dari Expo Go.
- Cocok untuk memastikan layout responsif, spacing, dan chart tidak pecah di browser.

**Perintah yang biasa dipakai:**
```bash
npm run web
```

Atau export statis:
```bash
npx expo export --platform web
```

### Perbedaan penting Expo Go vs Web

| Aspek | Expo Go | Web |
|---|---|---|
| Bentuk aplikasi | Dibuka di Expo Go | Dibuka di browser |
| Target utama | Android/iOS development | Browser desktop/mobile |
| Build output | Tidak menghasilkan APK/IPA | Menghasilkan bundle web + `dist` |
| Testing | UI mobile, gesture, auth, input | Layout browser, responsif, export statis |
| Keterbatasan | Tidak standalone | Tidak sepenuhnya menggantikan native mobile |

### Perintah penting
- `npm start` untuk menjalankan Expo.
- `npm run start:lan` untuk koneksi LAN yang lebih stabil ke HP fisik.
- `npm run web` untuk mode browser development.
- `npx expo export --platform web` untuk membangun output web statis.

---

## 3. Alur Besar Aplikasi

### Alur dari root app
1. `App.js` menjalankan `AuthProvider`.
2. `AuthProvider` di `src/context/AuthContext.js` memulihkan session dan menyediakan state login.
3. `AppNavigator` menentukan apakah user masuk ke stack login/register atau stack aplikasi.
4. Setelah login berhasil, user masuk ke `DashboardScreen`.
5. Dari dashboard user bisa membuka tambah transaksi atau riwayat transaksi.

### Flow pengguna
```text
App dibuka
  ↓
Auth state dicek
  ↓
Token ada? ── ya → Dashboard
      │
      tidak
      ↓
Login / Register
      ↓
Dashboard
      ↓
Tambah transaksi / lihat riwayat / logout
```

### Ringkasan state runtime
- `AuthContext` menyimpan status login dan user aktif.
- `AppNavigator` menentukan stack layar yang boleh diakses.
- `DashboardScreen` menyimpan period filter, chart view, dan selected chart point.
- `AddTransactionScreen` menyimpan state form transaksi dan mode edit.
- `TransactionHistoryScreen` menyimpan halaman, hasil list, dan status refresh.

---

## 4. Struktur Folder

```text
FinanceApp/
├── App.js
├── app.json
├── package.json
├── package-lock.json
├── Panduan.md
├── babel.config.js
├── src/
│   ├── components/
│   ├── context/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── styles/
│   └── utils/
├── scripts/
├── Aset/
├── node_modules/
├── .expo/
└── dist/
```

### 4.1 `src/screens/`
Berisi semua layar utama aplikasi.

File yang ada di folder ini:
- `LoginScreen.js`
- `RegisterScreen.js`
- `DashboardScreen.js`
- `AddTransactionScreen.js`
- `TransactionHistoryScreen.js`

### 4.2 `src/components/`
Berisi komponen UI yang dipakai ulang di banyak layar.

Komponen reusable:
- `InputField.js`
- `ButtonPrimary.js`
- `TransactionItem.js`

### 4.3 `src/context/`
Berisi state global aplikasi, terutama autentikasi.

Isi folder:
- `AuthContext.js`

### 4.4 `src/navigation/`
Berisi pengaturan navigasi antar layar.

Isi folder:
- `AppNavigator.js`

### 4.5 `src/services/`
Berisi koneksi ke Firebase dan fungsi pengambil/penyimpan data.

Isi folder:
- `firebase.js`
- `api.js`

### 4.6 `src/styles/`
Berisi tema global, warna, spacing, dan style umum.

Isi folder:
- `globalStyles.js`

### 4.7 `src/utils/`
Berisi helper kecil seperti format currency.

Isi folder:
- `formatCurrency.js`
- `alertHelper.js`

### 4.8 `scripts/`
Berisi script utilitas, misalnya seed data.

Isi folder yang masih relevan:
- `seed-transactions.mjs`

### 4.9 `Aset/`
Berisi asset gambar seperti logo.

Asset yang dipakai di UI:
- `Asset 1.png` untuk login.
- `Asset 2.png` untuk dashboard.

### Folder generated yang bukan source utama
- `.expo/`: cache dan state development Expo.
- `dist/`: hasil export web.
- `node_modules/`: hasil install dependency.

Kalau folder-folder ini dihapus, project masih bisa dibuat ulang lewat install/export.

---

## 5. Penjelasan File Satu per Satu

## 5.1 File Root

### `App.js`
Fungsi:
- Entry point utama aplikasi.
- Membungkus aplikasi dengan `AuthProvider`.
- Menampilkan `AppNavigator`.

Alur:
- Saat app dibuka, React menjalankan `App()`.
- `AuthProvider` menyediakan status login.
- `AppNavigator` memilih stack layar.
- `react-native-gesture-handler` di-import paling atas supaya navigasi native bekerja benar.

### `app.json`
Fungsi:
- Konfigurasi Expo.
- Menentukan nama aplikasi, slug, dan identifier build.

Poin penting:
- `name`: nama yang tampil di aplikasi.
- `slug`: identitas project Expo.
- `android.package`: package identifier Android.
- `ios.bundleIdentifier`: bundle identifier iOS.

Catatan praktis:
- `name` dipakai sebagai label aplikasi.
- `slug` membantu Expo mengenali project.
- `android.package` dan `ios.bundleIdentifier` dipakai saat build installable.

### `package.json`
Fungsi:
- Daftar dependency.
- Script untuk menjalankan project.

Script yang penting:
- `npm start`
- `npm run web`
- `npm run start:lan`

Script pendukung yang penting dipahami:
- `start:tunnel` diarahkan ke `start:lan`.

Dependency inti:
- `expo`, `react`, `react-native` sebagai fondasi aplikasi.
- `@react-navigation/*` untuk navigasi.
- `firebase` untuk auth dan Firestore.
- `@react-native-async-storage/async-storage` untuk session dan queue pending.
- `react-native-svg` untuk chart custom.
- `react-native-reanimated` untuk animasi.
- `@react-native-community/datetimepicker` untuk date picker native.

### `babel.config.js`
Fungsi:
- Konfigurasi Babel untuk Expo/React Native.
- Memastikan syntax modern dan plugin Expo berjalan dengan benar.

### `Panduan.md`
Fungsi:
- Dokumen utama.
- Satu-satunya file panduan yang dipertahankan.

---

## 5.2 `src/context/AuthContext.js`

Fungsi utama:
- Menyimpan state autentikasi global.
- Menyediakan `login`, `register`, dan `logout`.
- Memulihkan session saat aplikasi dibuka.

Isi penting:
- `initialState`: status awal auth.
- `authReducer`: mengelola aksi `RESTORE_TOKEN`, `SIGN_IN`, `SIGN_OUT`, `SIGN_UP`.
- `AuthProvider`: provider untuk seluruh aplikasi.
- `useAuth()`: custom hook untuk memakai auth context.

Detail state:
- `isLoading` menentukan apakah navigator boleh tampil.
- `isSignedIn` menentukan stack mana yang dibuka.
- `user` dan `token` disimpan agar layar lain bisa membaca session aktif.

Flow kerja:
1. App dipasang.
2. `subscribeAuthState()` dipanggil dari `api.js`.
3. Token/session dipulihkan ke state.
4. User login/register/logout akan memperbarui state.
5. Setelah auth terisi, aplikasi mencoba `flushPendingTransactions()`.

Catatan:
- Setelah login/register sukses, transaksi pending lokal juga dicoba dikirim ulang.
- Ini penting karena app punya mekanisme antrian lokal saat transaksi tidak bisa langsung tersimpan.

---

## 5.3 `src/navigation/AppNavigator.js`

Fungsi utama:
- Mengatur navigasi semua layar.
- Memilih stack berdasarkan status login.

Stack yang ada:
- `AuthStack`: `Login`, `Register`
- `AppStack`: `Dashboard`, `AddTransaction`, `TransactionHistory`

Flow:
- Jika belum login, user masuk ke `AuthStack`.
- Jika sudah login, user masuk ke `AppStack`.

Catatan navigasi:
- `Login` dan `Register` sengaja memakai header tersembunyi.
- `Dashboard` juga menyembunyikan header native karena punya header custom sendiri.
- `AddTransaction` dan `TransactionHistory` memakai judul native berbahasa Indonesia.

---

## 5.4 `src/services/firebase.js`

Fungsi utama:
- Inisialisasi Firebase app.
- Menyediakan `auth` dan `db`.

Isi penting:
- `initializeApp(firebaseConfig)`
- `getAuth(app)`
- `getFirestore(app)`

Catatan:
- Konfigurasi saat ini masih memakai project Firebase lama `financeapp-181d0`.
- Itu sengaja dipertahankan agar data dan login yang lama tetap aktif.

Yang disediakan file ini:
- `app` sebagai instance Firebase.
- `auth` untuk autentikasi.
- `db` untuk Firestore.

---

## 5.5 `src/services/api.js`

Fungsi utama:
- Semua operasi login, register, transaksi, summary, dan queue lokal pending.

Fitur yang ada:
- Login pengguna
- Register pengguna
- Listen auth state
- Ambil transaksi
- Tambah transaksi
- Update transaksi
- Hapus transaksi
- Ambil ringkasan
- Flush pending transactions

Fungsi utama yang ada di file ini:
- `loginUser(email, password)`
- `registerUser(name, email, password)`
- `subscribeAuthState(callback)`
- `logoutUser()`
- `getTransactions(params)`
- `addTransaction(data)`
- `updateTransaction(id, data)`
- `deleteTransaction(id)`
- `getSummary()`
- `getDashboardInsights({ period })`
- `flushPendingTransactions()`

Struktur data insight yang dikirim ke dashboard:
- `summary`: totalIncome, totalExpense, balance
- `transactionCount`: jumlah transaksi
- `averageTransaction`: rata-rata transaksi
- `savingsRate`: persentase sisa/tabungan
- `categoryBreakdown`: kategori pengeluaran terbesar
- `dailySeries`: data harian mentah
- `chartSeries`: data yang dipakai chart
- `recentTransactions`: transaksi terbaru

Konsep penting di file ini:
- `PENDING_KEY` untuk antrian transaksi offline lokal.
- `PERIOD_PRESETS` untuk periode dashboard.
- Helper tanggal seperti `getStartOfDay`, `addDays`, `toIsoDate`.
- Error Firebase diterjemahkan ke bahasa Indonesia.

Aturan periode yang penting:
- `7d` dan `30d` dipakai untuk tampilan pendek.
- `90d` bisa dipakai sebagai minggu/mingguan di dashboard.
- `1y` dipecah per bulan.
- `all` dipakai jika ingin ambil semua data.

Flow kerja transaksi:
1. User menambah transaksi.
2. Data dikirim ke Firestore.
3. Jika gagal, data bisa masuk pending queue.
4. Setelah auth pulih/login berhasil, pending queue dicoba dikirim lagi.

Catatan penting:
- `PENDING_KEY` sekarang memakai prefix `@nataartha`.
- Tanggal transaksi disimpan sebagai string `YYYY-MM-DD` supaya aman dari geser timezone.

---

## 5.6 `src/screens/LoginScreen.js`

Fungsi utama:
- Layar login email/password.
- Validasi input.
- Menampilkan error autentikasi.

Komponen penting:
- `InputField` untuk email dan password.
- `ButtonPrimary` untuk tombol masuk.
- Logo aplikasi di bagian atas.

Perilaku UI:
- Validasi email dan password dilakukan sebelum request login.
- Error autentikasi ditampilkan di bawah form dan juga lewat alert.
- Tombol masuk memakai loading state agar user tahu request sedang berjalan.

Flow login:
1. User isi email dan password.
2. Validasi form dijalankan.
3. `login(email, password)` dari auth context dipanggil.
4. Jika sukses, navigasi berpindah ke dashboard.
5. Jika gagal, pesan error tampil di layar.

Catatan tampilan:
- Judul sekarang menampilkan `NataArtha`.

---

## 5.7 `src/screens/RegisterScreen.js`

Fungsi utama:
- Layar registrasi user baru.
- Validasi nama, email, password, dan konfirmasi password.

Flow register:
1. User isi nama, email, password, dan konfirmasi.
2. Validasi form dijalankan.
3. `register(name, email, password)` dipanggil.
4. Jika sukses, user langsung masuk ke aplikasi.

Catatan UI:
- Field nama minimal 3 karakter.
- Password minimal 6 karakter dan harus cocok dengan konfirmasi.
- Setelah register sukses, auth context akan memindahkan user ke stack aplikasi secara otomatis.

---

## 5.8 `src/screens/DashboardScreen.js`

Fungsi utama:
- Halaman utama setelah login.
- Menampilkan ringkasan saldo, pemasukan, pengeluaran, chart, kategori, dan transaksi terbaru.

Bagian penting:
- Header dengan logo dan nama aplikasi.
- Greeting/welcome card.
- Summary balance.
- Chart dengan pilihan periode.
- Daftar transaksi terbaru.
- Tombol cepat menuju tambah transaksi dan riwayat.

Detail penting di dashboard:
- Header memakai `Asset 2.png`.
- Welcome card memuat nama user aktif.
- Chart memakai SVG custom supaya lebih ringan dan mudah dikontrol.
- Ada loading inline saat data diperbarui, bukan loading layar penuh.
- Pada web, animasi chart dibuat lebih sederhana agar stabil.

Helper dan state yang dipakai:
- `period` menentukan rentang data.
- `chartView` menentukan mode chart harian/mingguan.
- `selectedPointIndex` menentukan titik chart yang sedang dipilih.
- `chartRevealAnim` dipakai untuk efek masuk chart di native.
- `formatCompactAmount()` dipakai di sumbu chart.

Fitur chart:
- Data diringkas dari `api.getDashboardInsights()`.
- Ada period selector seperti 7 hari, 30 hari, 90 hari.
- Ada chart view selector seperti harian dan mingguan.
- Tampilan disesuaikan untuk mobile dan web.

Alur dashboard lebih rinci:
1. Screen fokus atau `period` berubah.
2. `api.getDashboardInsights({ period })` dipanggil.
3. Data divalidasi menjadi angka dan array yang aman.
4. `dailySeries` diringkas menjadi `chartSeries`.
5. SVG chart, summary card, insight card, dan transaksi terbaru dirender ulang.

Perilaku mobile/web:
- Android memakai kepadatan titik dan label yang lebih hemat kalau data banyak.
- Web tidak bergantung penuh pada animasi agar tidak mengganggu rendering.

---

## 5.9 `src/screens/AddTransactionScreen.js`

Fungsi utama:
- Form untuk menambah atau mengedit transaksi.

Field yang dikelola:
- Amount
- Category
- Date
- Note
- Type: expense / income

Fitur penting:
- Toggle antara pengeluaran dan pemasukan.
- Date picker untuk mobile.
- Calendar UI untuk web.
- Validasi form.
- Mode edit kalau transaksi berasal dari riwayat.

Detail penting:
- `toISODate()` dan `fromISODate()` dipakai agar tanggal tidak bergeser karena timezone.
- Kategori dibedakan antara expense dan income.
- Web memakai kalender custom, mobile memakai date picker native.
- Form amount disimpan sebagai string mentah lalu dikirim sebagai angka ke API.

Kategori yang tersedia:
- Expense: Makanan, Minuman, Jajan, Transportasi, Hiburan, Kesehatan, Belanja, Tagihan, Pendidikan, Asuransi, Pinjaman, Lainnya.
- Income: Gaji, Tabungan, Bonus, Investasi, Usaha, Hadiah, Freelance, Sewa, Dividen, Pengembalian, Lainnya.

Flow:
1. User pilih jenis transaksi.
2. Isi jumlah, kategori, tanggal, dan catatan.
3. Submit.
4. Data dikirim ke `api.addTransaction()` atau `api.updateTransaction()`.
5. Kalau sukses, kembali ke dashboard.

Catatan penting:
- Implementasi tanggal sudah dibuat aman terhadap masalah timezone off-by-one.

---

## 5.10 `src/screens/TransactionHistoryScreen.js`

Fungsi utama:
- Menampilkan semua transaksi dalam daftar.

Fitur:
- FlatList
- Pagination
- Pull-to-refresh
- Delete transaksi
- Edit transaksi

Detail perilaku:
- Halaman pertama mengambil data awal.
- `onEndReached` dipakai untuk memuat halaman berikutnya.
- Kalau data kurang dari 20 item, app menganggap tidak ada halaman berikutnya.
- Edit transaksi membuka `AddTransactionScreen` dalam mode edit.
- Hapus transaksi memakai konfirmasi agar tidak salah hapus.

Flow:
1. Screen dibuka atau difokuskan.
2. Data transaksi diambil dari API.
3. Daftar ditampilkan dalam `TransactionItem`.
4. User bisa hapus atau edit transaksi.

---

## 5.11 `src/components/InputField.js`

Fungsi utama:
- Wrapper input yang seragam.

Kegunaan:
- Menampilkan label.
- Menampilkan border fokus.
- Menampilkan error message.
- Mendukung multiline dan prefix.

Catatan implementasi:
- `isFocused` dipakai untuk memberi border aktif.
- Komponen ini membuat form login, register, dan transaksi punya look yang sama.

Dipakai di:
- Login
- Register
- Form transaksi

---

## 5.12 `src/components/ButtonPrimary.js`

Fungsi utama:
- Tombol reusable untuk seluruh aplikasi.

Fitur:
- Variant: primary, secondary, danger, success.
- Size: sm, md, lg.
- Loading state.
- Disabled state.

Catatan:
- Button ini sengaja dibuat generik supaya tidak perlu banyak tombol berbeda.
- Prop `icon` sudah tidak dipakai lagi dan aman dipangkas.

Dipakai di:
- Login
- Register
- Form transaksi
- Tombol aksi lain

---

## 5.13 `src/components/TransactionItem.js`

Fungsi utama:
- Menampilkan satu transaksi dalam kartu list.

Isi kartu:
- Ikon kategori
- Nama kategori
- Catatan
- Tanggal
- Nominal
- Tombol edit/hapus

Catatan detail:
- Ikon kategori dibuat dari mapping emoji supaya tidak perlu asset ikon tambahan.
- Nominal diberi prefix `+` atau `-` sesuai jenis transaksi.
- Tombol edit/hapus hanya muncul jika handler diberikan.

Kegunaan:
- Dipakai di riwayat transaksi dan preview transaksi.

---

## 5.14 `src/utils/formatCurrency.js`

Fungsi utama:
- Format angka ke Rupiah Indonesia.

Contoh hasil:
- `10000` → `Rp 10.000`

Catatan:
- `null` dan `undefined` dikembalikan sebagai `Rp 0`.
- Format memakai locale `id-ID` dengan digit desimal nol.

Dipakai di:
- Dashboard
- TransactionItem
- Summary keuangan

---

## 5.15 `src/utils/alertHelper.js`

Fungsi utama:
- Menyediakan dialog alert/confirm/toast yang kompatibel untuk web dan native.

Fungsi yang ada:
- `showConfirm(title, message, confirmText, cancelText)`
- `showToast(message, type)`

Catatan:
- `showConfirm` dipakai untuk konfirmasi hapus/logout.
- `showToast` dipakai untuk info sukses/error.
- Fungsi `showAlert` sudah tidak dipakai lagi dan telah dihapus.

---

## 5.16 `src/styles/globalStyles.js`

Fungsi utama:
- Menjadi sumber tema global aplikasi.

Isi penting:
- `colors`
- `spacing`
- `fontSizes`
- `borderRadius`
- `globalStyles`

Kegunaan:
- Semua layar dan komponen mengambil warna serta spacing dari sini supaya konsisten.

Style yang sering dipakai:
- `container`, `heading2`, `heading3`, `subtitle`, `label`
- `row`, `centerContent`, `spaceBetween`
- `input`, `inputFocused`
- `buttonPrimary`, `buttonSecondary`, `buttonPrimaryText`, `buttonSecondaryText`
- `card`, `divider`, `loadingContainer`, `emptyContainer`, `emptyText`

Catatan desain:
- Palet warna sekarang fokus ke biru, kuning, abu netral, dan teks gelap.
- Tujuan style global adalah menjaga konsistensi antar layar.

---

## 5.17 `scripts/`

### `scripts/seed-transactions.mjs`
- Script untuk membuat data transaksi contoh.
- Berguna untuk pengujian dashboard, chart, dan history.

Detail script:
- Membuat transaksi tersebar selama sekitar 2 bulan.
- Menyeimbangkan income per bulan agar tidak terlalu acak.
- Mengisi kategori, nominal, dan note secara acak dari katalog.
- Berguna untuk pengujian chart, summary, dan riwayat tanpa input manual.

File lain di folder `scripts/` yang hanya dipakai untuk laporan lama atau output dokumentasi yang sudah dihapus sebaiknya ikut dihapus agar tidak ada referensi mati.

---

## 6. Flow Data Lengkap

### 6.1 Login flow
```text
LoginScreen
  ↓
validateForm()
  ↓
AuthContext.login()
  ↓
api.loginUser()
  ↓
Firebase Auth
  ↓
token/user disimpan ke state
  ↓
DashboardScreen
```

### 6.2 Register flow
```text
RegisterScreen
  ↓
validateForm()
  ↓
AuthContext.register()
  ↓
api.registerUser()
  ↓
Firebase Auth + Firestore profile
  ↓
DashboardScreen
```

### 6.3 Add transaction flow
```text
AddTransactionScreen
  ↓
pilih income/expense
  ↓
isi amount, category, date, note
  ↓
validasi
  ↓
api.addTransaction() / api.updateTransaction()
  ↓
Firestore transactions
  ↓
back ke Dashboard
```

### 6.4 History flow
```text
TransactionHistoryScreen
  ↓
api.getTransactions()
  ↓
FlatList + TransactionItem
  ↓
edit / delete
```

### 6.5 Dashboard chart flow
```text
DashboardScreen
  ↓
api.getDashboardInsights({ period })
  ↓
summary + dailySeries + chartSeries + recentTransactions
  ↓
aggregateDailySeries / aggregateWeeklySeries
  ↓
SVG chart + insight cards + recent list
```

---

## 7. Alur Data yang Perlu Dihafal

### 7.1 Login
1. User isi email/password.
2. Validasi form dijalankan di `LoginScreen`.
3. `AuthContext.login()` memanggil `api.loginUser()`.
4. Firebase Auth memverifikasi kredensial.
5. Session disimpan di state aplikasi.
6. Dashboard tampil.

### 7.2 Register
1. User isi nama/email/password.
2. Validasi form dijalankan.
3. `AuthContext.register()` memanggil `api.registerUser()`.
4. Firebase membuat akun dan profil user.
5. Session otomatis masuk.

### 7.3 Transaksi
1. User buka tambah transaksi.
2. Pilih income/expense.
3. Isi nominal, kategori, tanggal, catatan.
4. Data dikirim ke Firestore lewat API.
5. Dashboard dan riwayat memperbarui data.

### 7.4 Dashboard
1. `DashboardScreen` memanggil insight API.
2. API mengembalikan summary, dailySeries, chartSeries, recentTransactions.
3. Dashboard membangun chart custom SVG.
4. User bisa ganti periode dan mode chart.

### 7.5 Riwayat
1. `TransactionHistoryScreen` mengambil list transaksi per halaman.
2. Data dirender lewat `TransactionItem`.
3. User bisa edit atau hapus transaksi.

---

## 8. Setup dan Run

### Jalankan development
```bash
npm start
```

### Jalankan Expo Go lewat LAN
```bash
npm run start:lan
```

### Jalankan web
```bash
npm run web
```

### Export web statis
```bash
npx expo export --platform web
```

---

## 9. Firebase yang Dipakai

Project ini masih terhubung ke Firebase project lama:
- Project ID: `financeapp-181d0`

Yang perlu dijaga:
- Konfigurasi auth harus tetap cocok dengan project Firebase.
- Jika nanti package Android/iOS dipakai di build store, Firebase app registration harus disesuaikan.

File konfigurasi yang terkait:
- `src/services/firebase.js`
- `src/services/api.js`

Data model utama di Firestore:
- `users` untuk profil user.
- `transactions` untuk semua transaksi.

Field transaksi yang dipakai app:
- `type`
- `amount`
- `category`
- `date`
- `note`
- `userId`
- `createdAt`

---

## 10. Keterbatasan Saat Ini

- Aplikasi sudah bisa dipakai di Expo Go.
- Aplikasi sudah bisa dijalankan di web.
- Aplikasi belum dipaketkan menjadi APK/IPA standalone store release.
- Jika ingin build rilis, perlu setup signing dan registrasi app di Firebase untuk package baru.

---

## 11. Troubleshooting Singkat

### Jika Expo Go tidak konek
- Coba `npm run start:lan`
- Pastikan HP dan laptop ada di Wi-Fi yang sama

### Jika web blank atau error
- Jalankan ulang export web
```bash
npx expo export --platform web
```

### Jika login gagal
- Cek email/password
- Cek Firebase Auth
- Cek apakah akun memang sudah terdaftar

### Jika transaksi tidak muncul
- Cek koneksi Firebase
- Cek data di Firestore
- Cek fungsi fetch di `src/services/api.js`

### Jika layout terasa aneh di browser
- Cek `dist/` hasil export web terbaru.
- Pastikan cache `.expo/` dibersihkan jika perlu.

---

## 12. Ringkasan File Penting

| File | Fungsi |
|---|---|
| `App.js` | Entry point aplikasi |
| `app.json` | Config Expo dan identifier app |
| `src/context/AuthContext.js` | State login global |
| `src/navigation/AppNavigator.js` | Navigasi screen |
| `src/services/firebase.js` | Inisialisasi Firebase |
| `src/services/api.js` | Semua operasi data/auth |
| `src/screens/LoginScreen.js` | Login user |
| `src/screens/RegisterScreen.js` | Register user |
| `src/screens/DashboardScreen.js` | Dashboard utama |
| `src/screens/AddTransactionScreen.js` | Tambah/edit transaksi |
| `src/screens/TransactionHistoryScreen.js` | Riwayat transaksi |
| `src/components/InputField.js` | Input seragam |
| `src/components/ButtonPrimary.js` | Tombol seragam |
| `src/components/TransactionItem.js` | Item transaksi |
| `src/utils/formatCurrency.js` | Format uang |
| `src/utils/alertHelper.js` | Alert/confirm/toast |
| `src/styles/globalStyles.js` | Tema global |
| `scripts/seed-transactions.mjs` | Data contoh transaksi |

---

## 13. Catatan Penutup

Dokumen ini sengaja dibuat sebagai satu-satunya panduan supaya kamu tidak perlu membuka banyak file markdown lagi. Kalau ada perubahan besar di source code, cukup update file ini agar tetap jadi sumber kebenaran utama.
