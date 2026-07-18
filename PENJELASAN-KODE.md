# Penjelasan Kode KampusKu — Langkah 0 sampai 4

> Dokumen ini menjelaskan **semua fungsi yang sudah dibuat**, ditulis dengan format Prompt Penjelas dari `BELAJAR.md`. Kalau nanti ada Langkah baru, minta AI menambah bagian baru di file ini (bukan bikin file terpisah), supaya semua penjelasan tetap di satu tempat.
>
> **Terakhir diperbarui:** sampai Langkah 4 (Rohani: baca, hafalan, muraja'ah berjenjang) — ini melengkapi SEMUA 12 tabel di skema database, jadi Bagian 2 di bawah sekarang sudah final.

---

## 0. Empat istilah React yang akan sering muncul

Sebelum masuk ke fungsi satu-satu, empat istilah ini akan terus muncul. Sekali paham ini, semua penjelasan di bawah jadi lebih gampang.

| Istilah | Analogi sederhana |
|---|---|
| **state** (`useState`) | Kotak kecil penyimpan nilai. Begitu isinya diganti, tampilan di layar otomatis digambar ulang — seperti papan tulis yang begitu ditulis ulang, semua orang yang melihatnya langsung lihat versi terbaru. |
| **effect** (`useEffect`) | Kode yang jalan **otomatis** saat komponen pertama muncul di layar, atau saat "sesuatu yang diawasi" berubah. Seperti alarm: begitu kondisinya terpenuhi, dia bunyi sendiri, tidak perlu dipicu manual. |
| **komponen** | Satu "mesin tampilan" — potongan UI yang bisa dipakai ulang. `Login`, `Jadwal`, `Modal` semuanya komponen. |
| **context** (`createContext`) | "Kotak titipan" yang digantung di atas banyak ruangan (komponen). Ruangan mana pun di bawahnya bisa langsung ambil isi kotak itu, tanpa harus dioper tangan-ke-tangan dari ruangan ke ruangan (istilah teknisnya "prop drilling" — kita hindari itu). `AuthContext` dan `SemesterContext` keduanya kotak titipan seperti ini. |

---

## Bagian A — Login & Sesi

File: `src/context/AuthContext.jsx`, `src/pages/Login.jsx`, `src/components/ProtectedRoute.jsx`

### `AuthProvider` (mesin penjaga sesi)

1. **Gunanya:** Selalu tahu "siapa yang sedang login sekarang" di seluruh aplikasi, dan otomatis kabar-kabari semua halaman begitu status login berubah.
2. **MASUKAN:** Tidak ada masukan dari luar — dia "mendengarkan" Supabase sendiri.
3. **DIKERJAKAN:**
   1. Begitu aplikasi pertama kali dibuka, tanya ke Supabase: "ada sesi login tersimpan tidak?" (`supabase.auth.getSession()`).
   2. Simpan jawabannya ke state `session`.
   3. Pasang "telinga" (`onAuthStateChange`) yang otomatis bunyi setiap kali ada login, logout, atau daftar baru — lalu update `session` lagi.
   4. Bagikan `session`, `user` (diambil dari `session`), status `loading`, dan fungsi `signOut` ke SEMUA komponen di bawahnya lewat kotak titipan (context).
4. **KELUARAN:** Objek `{ session, user, loading, signOut }` yang bisa diambil siapa saja lewat `useAuth()`.
5. **Contoh nyata:** Kamu klik "Masuk" di `Login.jsx` → Supabase bilang "sukses" → telinga `onAuthStateChange` otomatis bunyi → `session` di-update → SEMUA halaman (termasuk `ProtectedRoute`) langsung tahu kamu sudah login, tanpa perlu refresh.
6. **Kalau diubah:** Kalau baris `onAuthStateChange` dihapus, aplikasi tidak akan tahu kalau kamu login/logout kecuali halaman di-refresh manual.

### `useAuth()`

1. **Gunanya:** Jalan pintas supaya komponen mana pun bisa "buka kotak titipan" `AuthContext` tanpa nulis kode panjang.
2. **MASUKAN:** Tidak ada.
3. **DIKERJAKAN:** Ambil isi `AuthContext`. Kalau kotaknya ternyata tidak ada (komponen dipanggil di luar `<AuthProvider>`), lempar error yang jelas — ini jaring pengaman biar salah pakai ketahuan dari awal, bukan error aneh belakangan.
4. **KELUARAN:** `{ session, user, loading, signOut }`.
5. **Contoh nyata:** Di `Layout.jsx`, `const { signOut } = useAuth()` — cukup satu baris untuk dapat fungsi logout, tanpa perlu tahu detail bagaimana Supabase bekerja.
6. **Kalau diubah:** Kalau kamu panggil `useAuth()` di komponen yang tidak dibungkus `<AuthProvider>`, akan muncul error "useAuth harus dipakai di dalam AuthProvider" — sengaja dibuat begitu supaya gampang dilacak.

### `ProtectedRoute` (penjaga pintu)

1. **Gunanya:** Mencegah orang yang belum login membuka halaman Dashboard/Jadwal/Tugas/dst.
2. **MASUKAN:** Tidak langsung — dia baca `session` & `loading` dari `useAuth()`.
3. **DIKERJAKAN:**
   1. Kalau masih `loading` (baru cek sesi), tampilkan "Memuat...".
   2. Kalau sudah selesai cek dan ternyata `session` kosong (belum login), lempar (`<Navigate>`) ke halaman `/login`.
   3. Kalau ada sesi, tampilkan `<Outlet />` — yaitu halaman yang sebenarnya diminta (Dashboard, Jadwal, dst).
4. **KELUARAN:** Salah satu dari tiga tampilan di atas.
5. **Contoh nyata:** Kamu ketik langsung `kampusku.app/tugas` di browser tanpa login → otomatis dilempar balik ke `/login`, tidak sempat lihat data tugas orang lain.
6. **Kalau diubah:** Kalau baris pengecekan `!session` dihapus, siapa pun bisa buka halaman dalam aplikasi tanpa login (bahaya!).

### `usernameToEmail(username)`

1. **Gunanya:** Mengubah username jadi "email palsu" di belakang layar, supaya Supabase Auth (yang aslinya berbasis email) bisa dipakai dengan tampilan username-only.
2. **MASUKAN:** Satu teks username, misal `"ahmadmufti"`.
3. **DIKERJAKAN:**
   1. Ubah semua huruf jadi huruf kecil.
   2. Tempel `@` + alamat project Supabase-mu sendiri di belakangnya (diambil dari `VITE_SUPABASE_URL`).
4. **KELUARAN:** Teks email palsu, misal `"ahmadmufti@tnvmyiqgjunguvpmysfr.supabase.co"`.
5. **Contoh nyata:** Masukan `"AhmadMufti"` → keluaran `"ahmadmufti@tnvmyiqgjunguvpmysfr.supabase.co"` (perhatikan huruf besar otomatis jadi kecil, supaya `"AhmadMufti"` dan `"ahmadmufti"` dianggap akun yang sama).
6. **Kalau diubah:** Kalau bagian `.toLowerCase()` dihapus, maka `"Ahmad"` dan `"ahmad"` akan dianggap DUA akun berbeda — biasanya bukan itu yang diinginkan untuk username.

### `friendlyError(message)`

1. **Gunanya:** Mengubah pesan error bahasa Inggris dari Supabase jadi bahasa Indonesia yang masuk akal untuk skema username (bukan email).
2. **MASUKAN:** Teks pesan error asli dari Supabase, misal `"Invalid login credentials"`.
3. **DIKERJAKAN:** Cek apakah pesan itu mengandung potongan kalimat yang dikenali — kalau iya, ganti dengan versi Indonesia. Kalau tidak dikenali, tampilkan apa adanya.
4. **KELUARAN:** Teks pesan yang lebih ramah.
5. **Contoh nyata:** Masukan `"Invalid login credentials"` → keluaran `"Username atau password salah."` Masukan `"User already registered"` → keluaran `"Username sudah dipakai, coba yang lain."`
6. **Kalau diubah:** Kalau kamu tambah baris baru `if (m.includes('...')) return '...'`, kamu bisa menerjemahkan pesan error Supabase lain yang belum tertangani.

### `handleSubmit` di `Login.jsx`

1. **Gunanya:** Memproses tombol "Masuk" atau "Daftar" — satu fungsi menangani dua mode sekaligus.
2. **MASUKAN:** Event submit form (otomatis dari browser) + nilai `username`, `password`, dan `mode` (`'login'` atau `'daftar'`) yang sedang tersimpan di state.
3. **DIKERJAKAN:**
   1. Cegah halaman reload (perilaku default form HTML).
   2. Cek format username pakai `USERNAME_PATTERN` — kalau salah format, tampilkan pesan error, berhenti di sini.
   3. Ubah username jadi email palsu lewat `usernameToEmail()`.
   4. Kalau mode `'login'` → panggil `supabase.auth.signInWithPassword()`. Kalau gagal, tampilkan pesan error ramah.
   5. Kalau mode `'daftar'` → panggil `supabase.auth.signUp()`, sekalian titip `username` asli ke `user_metadata` (biar tidak hilang, walau email-nya palsu).
   6. Kalau daftar sukses tapi TIDAK ada sesi langsung (artinya "Confirm email" masih aktif di Supabase), tampilkan pesan error yang menuntun ke pengaturan yang harus dimatikan.
4. **KELUARAN:** Tidak ada nilai balik — efeknya adalah: sesi berubah (lalu `AuthProvider` otomatis mendeteksi dan halaman pindah ke Dashboard), atau pesan error muncul di layar.
5. **Contoh nyata:** Kamu isi username `"budi"`, password `"rahasia123"`, mode `"daftar"` → Supabase membuat akun dengan email `budi@<project-mu>.supabase.co` → karena "Confirm email" sudah dimatikan, sesi langsung aktif → `AuthProvider` mendeteksi → kamu otomatis pindah ke Dashboard.
6. **Kalau diubah:** Kalau kamu hapus pengecekan `USERNAME_PATTERN`, orang bisa daftar dengan username kosong atau berisi karakter aneh yang bisa merusak format email palsu di baliknya.

### `switchMode()`

Fungsi kecil, cuma menukar `mode` antara `'login'` dan `'daftar'`, lalu membersihkan pesan error lama supaya tidak nyangkut saat pindah mode. Tidak perlu penjelasan panjang — persis seperti membalik saklar lampu.

---

## Bagian B — Semester

File: `src/context/SemesterContext.jsx`, `src/components/SemesterManager.jsx`

### Efek pengambil + pendengar data di `SemesterProvider`

1. **Gunanya:** Selalu punya daftar semester terbaru milikmu, dan otomatis update kalau ada perubahan — baik dari tab ini sendiri, tab lain, atau perangkat lain yang login dengan akun sama.
2. **MASUKAN:** `user` (dari `useAuth()`) — hanya jalan kalau sudah ada yang login.
3. **DIKERJAKAN:**
   1. `fetchSemesters()`: minta semua baris tabel `semesters` milikmu ke Supabase, urutkan dari tanggal mulai terbaru, simpan ke state.
   2. Buka "saluran radio" (`supabase.channel(...)`) yang **berlangganan** perubahan tabel `semesters` — mirip langganan koran: begitu ada edisi baru (baris ditambah/diubah/dihapus), kamu otomatis dikirimi kabar, tidak perlu bolak-balik cek sendiri.
   3. Setiap kali ada kabar masuk, panggil ulang `fetchSemesters()` supaya data di layar selalu segar.
   4. Kalau komponen ini hilang dari layar (`return () => ...`), langganan otomatis dibatalkan — supaya tidak ada "radio" yang tetap nyala sia-sia.
4. **KELUARAN:** State `semesters` (daftar semua semester) yang selalu ter-update.
5. **Contoh nyata:** Kamu buka Jadwal di HP dan laptop bersamaan. Di laptop kamu tambah semester baru → Supabase kirim kabar lewat saluran radio → HP otomatis `fetchSemesters()` ulang → semester baru langsung muncul di HP, tanpa kamu sentuh apa pun di HP.
6. **Kalau diubah:** Kalau baris `.channel(...).subscribe()` dihapus, data masih bisa diambil saat halaman pertama dibuka, tapi TIDAK akan update otomatis kalau ada perubahan dari tab/perangkat lain — kamu harus refresh manual.

### `createSemester({ name, start_date, end_date })`

1. **Gunanya:** Menambah semester baru ke database, sekaligus memutuskan apakah dia otomatis jadi "semester aktif".
2. **MASUKAN:** Objek berisi nama, tanggal mulai, tanggal akhir. Contoh: `{ name: "Semester Ganjil 2026/2027", start_date: "2026-09-01", end_date: "2027-01-31" }`.
3. **DIKERJAKAN:**
   1. Cek: apakah ini semester pertamamu, ATAU tidak ada satu pun semester lain yang sedang aktif? Kalau salah satu benar, semester baru ini otomatis jadi aktif.
   2. Kirim perintah `insert` ke tabel `semesters` di Supabase, sertakan `is_active` sesuai hasil cek tadi.
   3. Kalau Supabase menolak (misal karena RLS atau kolom wajib kosong), lempar error supaya bisa ditangkap dan ditampilkan oleh pemanggilnya.
4. **KELUARAN:** Tidak ada nilai balik langsung — tapi kalau sukses, `fetchSemesters()` (lewat langganan radio di atas) otomatis menyegarkan daftar semester.
5. **Contoh nyata:** Kamu baru pertama kali pakai app, belum punya semester sama sekali → `createSemester({...})` → karena `semesters.length === 0`, semester ini otomatis `is_active: true`.
6. **Kalau diubah:** Kalau `shouldBeActive` selalu diisi `true` tanpa pengecekan, maka setiap kali kamu bikin semester baru, semester LAMA yang tadinya aktif akan "diduakan" (dua-duanya `is_active: true`) — bikin bingung "Jadwal" harus ikut yang mana.

### `setActive(id)`

1. **Gunanya:** Menjadikan satu semester sebagai satu-satunya semester aktif (mengganti semester aktif sebelumnya).
2. **MASUKAN:** `id` semester yang ingin dijadikan aktif.
3. **DIKERJAKAN:**
   1. Matikan `is_active` di SEMUA semester **kecuali** yang dipilih (`update({is_active:false}).neq('id', id)`).
   2. Nyalakan `is_active: true` khusus untuk semester yang dipilih.
   3. Kedua langkah ini dijamin cuma menyentuh baris milikmu sendiri (dijaga otomatis oleh RLS di database, dijelaskan di Bagian Skema Database).
4. **KELUARAN:** Tidak ada nilai balik — perubahan langsung terlihat lewat langganan radio.
5. **Contoh nyata:** Kamu punya "Semester Ganjil" (aktif) dan "Semester Genap" (tidak aktif). Panggil `setActive(idGenap)` → Ganjil jadi tidak aktif, Genap jadi aktif. Halaman Jadwal otomatis pindah menampilkan mata kuliah Semester Genap.
6. **Kalau diubah:** Kalau urutan dibalik (nyalakan dulu baru matikan yang lain), sesaat akan ada DUA semester aktif sekaligus — walau cuma sepersekian detik, ini bisa bikin `activeSemester` (yang pakai `.find()`, ambil yang PERTAMA ketemu) salah pilih.

### `updateSemester(id, fields)` & `deleteSemester(id)`

Dua fungsi pendek dengan pola yang sama: kirim perintah `update` atau `delete` ke Supabase untuk satu baris tertentu (`eq('id', id)`), lempar error kalau gagal. Yang perlu diingat soal `deleteSemester`: karena di database ada aturan **"kalau map dibuang, semua kertas di dalamnya ikut terbuang"** (`on delete cascade` — lihat Bagian Skema Database), menghapus semester **otomatis ikut menghapus semua mata kuliah** di semester itu. Makanya `SemesterManager.jsx` selalu menampilkan `window.confirm(...)` dengan pesan peringatan sebelum menghapus.

### `useSemesters()`

Sama persis polanya dengan `useAuth()` di Bagian A: jalan pintas untuk "buka kotak titipan" `SemesterContext` dari komponen mana pun, plus jaring pengaman error kalau dipakai di luar `<SemesterProvider>`.

### Fungsi-fungsi kecil di `SemesterManager.jsx`

- **`startEdit(s)`**: salin data satu semester ke form edit, supaya form terisi otomatis (bukan kosong) saat kamu klik ikon pensil.
- **`cancelEdit()`**: kosongkan form & keluar dari mode edit.
- **`handleSubmit`**: validasi form (semua kolom wajib, tanggal akhir harus setelah tanggal mulai) → panggil `createSemester` atau `updateSemester` tergantung mode → tutup form kalau sukses.
- **`handleDelete(s)`**: tampilkan konfirmasi (karena efek "hapus map, kertas ikut hilang" di atas) → panggil `deleteSemester`.

---

## Bagian C — Jadwal & Mata Kuliah

File: `src/pages/Jadwal.jsx`, `src/components/CourseForm.jsx`

### `fetchCourses()`

1. **Gunanya:** Mengambil semua mata kuliah milik **semester yang sedang aktif saja** (bukan semua semester).
2. **MASUKAN:** `activeSemester` (dari `useSemesters()`).
3. **DIKERJAKAN:**
   1. Kalau tidak ada semester aktif, kosongkan daftar mata kuliah, berhenti di sini.
   2. Kalau ada, minta ke Supabase: baris tabel `courses` yang `semester_id`-nya cocok dengan semester aktif, urutkan berdasarkan jam mulai.
4. **KELUARAN:** State `courses` terisi daftar mata kuliah semester aktif, terurut dari pagi ke malam.
5. **Contoh nyata:** Semester aktif = "Semester Ganjil". Ada 5 mata kuliah di semester itu dan 3 mata kuliah lain di "Semester Genap" (tidak aktif) → yang muncul di grid Jadwal cuma 5 mata kuliah Semester Ganjil.
6. **Kalau diubah:** Kalau baris `.eq('semester_id', activeSemester.id)` dihapus, SEMUA mata kuliah dari SEMUA semester akan tercampur di satu grid — bukan itu yang diinginkan.

### Langganan radio untuk `courses`

Pola yang identik dengan langganan `semesters` di Bagian B — bedanya cuma tabel yang didengarkan (`courses`) dan fungsi yang dipanggil ulang (`fetchCourses`). Efeknya: tambah/edit/hapus mata kuliah di satu tab langsung kelihatan di tab/perangkat lain tanpa refresh.

### `handleSubmit` di `CourseForm.jsx`

1. **Gunanya:** Menyimpan mata kuliah baru, atau memperbarui yang sudah ada — satu fungsi untuk dua kondisi (`isEdit`).
2. **MASUKAN:** Semua isian form (nama, dosen, hari, jam mulai/selesai, ruang, warna) + `semesterId`.
3. **DIKERJAKAN:**
   1. Cek jam selesai harus lebih besar dari jam mulai — kalau tidak, tampilkan error, berhenti.
   2. Susun semua isian jadi satu objek `payload`. Kolom yang boleh kosong (dosen, ruang) diubah jadi `null` kalau memang kosong, supaya database rapi (bukan teks kosong `""`).
   3. Kalau `isEdit` true → `update` baris yang sudah ada. Kalau bukan → `insert` baris baru.
4. **KELUARAN:** Tidak ada nilai balik langsung — memanggil `onDone()` untuk menutup form kalau sukses.
5. **Contoh nyata:** Masukan: nama `"Kalkulus 1"`, hari `1` (Senin), jam `07:00`–`08:40`, warna biru → tersimpan sebagai satu baris baru di tabel `courses`, langsung muncul di kolom Senin pada grid Jadwal.
6. **Kalau diubah:** Kalau pengecekan jam selesai > jam mulai dihapus, kamu bisa tidak sengaja bikin mata kuliah dengan jam terbalik (misal mulai 10:00, selesai 08:00) yang membingungkan saat ditampilkan.

### `getInitialColumns()`

1. **Gunanya:** Menentukan grid Jadwal dibuka dengan berapa kolom saat halaman pertama kali dibuka.
2. **MASUKAN:** Tidak ada masukan langsung — dia baca `localStorage` (memori kecil di browser yang tidak hilang walau halaman ditutup) dan lebar layar saat itu.
3. **DIKERJAKAN:**
   1. Cek `localStorage`: apakah kamu pernah memilih jumlah kolom sebelumnya di perangkat ini?
   2. Kalau pernah dan pilihannya valid (ada di `[1,2,3,4,7]`), pakai itu.
   3. Kalau belum pernah, tebak yang masuk akal: layar sempit (HP) → 1 kolom, layar lebar (laptop) → 7 kolom.
4. **KELUARAN:** Satu angka (jumlah kolom awal).
5. **Contoh nyata:** Kamu buka app dari HP untuk pertama kali → belum ada di `localStorage` → lebar layar < 768px → keluarannya `1`. Besoknya kamu buka lagi dari HP yang sama, setelah kemarin memilih `2` → keluarannya `2` (ingatan tersimpan).
6. **Kalau diubah:** Kalau `localStorage` dihapus (misal kamu bersihkan data browser), pilihan kolommu "lupa" dan kembali ke tebakan otomatis.

### `handleColumnsChange(n)`

Fungsi pendek: ganti state `columns` ke angka baru, sekaligus simpan ke `localStorage` supaya "diingat" untuk kunjungan berikutnya. Dipanggil setiap kali kamu klik salah satu tombol angka (1/2/3/4/7) di atas grid.

### Rumus lebar kolom (bagian `style={{ flex: ... }}`)

Ini bukan fungsi terpisah, tapi rumus matematika kecil yang layak dijelaskan sendiri karena sempat jadi bahan diskusi kita:

1. **Gunanya:** Memastikan setiap kartu hari punya lebar yang pas — dan kalau baris terakhir isinya lebih sedikit dari jumlah kolom yang dipilih, kartu-kartu di baris itu **melebar mengisi penuh** (bukan menyisakan ruang kosong).
2. **MASUKAN:** `columns` (jumlah kolom pilihan) dan `GAP_REM` (jarak antar kartu, `0.75rem`, disamakan dengan kelas Tailwind `gap-3`).
3. **DIKERJAKAN:** Hitung `calc((100% - (columns-1) × 0.75rem) / columns)` sebagai lebar "dasar" tiap kartu, lalu beri sifat `flex: 1 1 ...` supaya kalau dalam satu baris ruang tersisa (karena baris itu tidak penuh), sisa ruang itu dibagi rata ke kartu-kartu yang ADA di baris itu.
4. **KELUARAN:** Nilai CSS `flex` yang dipasang di tiap kartu hari.
5. **Contoh nyata:** Pilih 3 kolom → Senin/Selasa/Rabu di baris 1 (masing-masing 1/3 layar), Kamis/Jumat/Sabtu di baris 2 (masing-masing 1/3 layar), Minggu sendirian di baris 3 → karena cuma dia sendiri di baris itu, dia melebar jadi 3/3 (penuh satu baris).
6. **Kalau diubah:** Kalau dipakai CSS Grid biasa (`display:grid`) alih-alih Flexbox, baris terakhir yang tidak penuh TIDAK akan melebar — setiap kolom akan tetap lebarnya 1/3 dan sisanya jadi ruang kosong. Ini persis perbedaan yang sempat kita bahas.

### `handleDeleteCourse(course)`

Sama persis pola dan alasannya dengan `handleDelete` di `SemesterManager` — konfirmasi dulu lewat `window.confirm`, baru kirim perintah `delete` ke Supabase. Bedanya, menghapus mata kuliah TIDAK menghapus tugas yang tertaut ke situ — lihat penjelasan `on delete set null` di Bagian Skema Database.

---

## Bagian D — Tugas

File: `src/pages/Tugas.jsx`, `src/components/TaskForm.jsx`

### `fetchTasks()`

1. **Gunanya:** Mengambil SEMUA tugas milikmu (beda dengan mata kuliah, tugas tidak dibatasi per-semester), sekalian menempelkan nama mata kuliah kalau tugas itu tertaut ke salah satu.
2. **MASUKAN:** Tidak ada — selalu ambil semua tugas milik user yang login.
3. **DIKERJAKAN:**
   1. Minta ke Supabase: semua baris `tasks`, urutkan berdasarkan `due_date` (yang belum ada tanggalnya taruh paling akhir, bukan paling awal — `nullsFirst: false`).
   2. Sekalian minta "titipan" nama mata kuliah lewat `select('*, courses(name)')` — ini seperti bilang ke Supabase "sekalian ambilkan nama map-nya" saat mengambil satu kertas, jadi tidak perlu request kedua terpisah.
4. **KELUARAN:** State `tasks`, tiap tugas punya properti tambahan `courses.name` kalau tertaut ke mata kuliah.
5. **Contoh nyata:** Tugas "Kerjakan Modul 3" tertaut ke mata kuliah "Kalkulus 1" → hasil fetch punya `task.courses.name === "Kalkulus 1"`, langsung ditampilkan sebagai `· Kalkulus 1` di kartu tugas.
6. **Kalau diubah:** Kalau `, courses(name)` dihapus dari `select`, nama mata kuliah tidak akan ikut terambil — kamu harus request terpisah ke tabel `courses` untuk tahu namanya.

### Langganan radio untuk `tasks`

Pola yang sama lagi seperti `semesters` dan `courses` — mendengarkan tabel `tasks`, memanggil ulang `fetchTasks()` setiap ada perubahan.

### `toggleDone(task)`

1. **Gunanya:** Tombol centang cepat untuk menandai tugas selesai/belum, tanpa harus buka form edit.
2. **MASUKAN:** Satu objek `task`.
3. **DIKERJAKAN:** Kalau status sekarang `'done'`, ubah balik ke `'todo'`. Kalau bukan (baik `'todo'` maupun `'doing'`), ubah jadi `'done'`. Kirim perubahan itu ke Supabase.
4. **KELUARAN:** Tidak ada nilai balik — perubahan terlihat lewat langganan radio di atas.
5. **Contoh nyata:** Tugas berstatus `"doing"` → klik lingkaran kosong di sampingnya → langsung jadi `"done"` (bukan balik ke `"doing"` — tombol cepat ini cuma kenal dua arah: selesai atau belum).
6. **Kalau diubah:** Kalau kamu ingin tombol ini bisa memilih tiga status (todo/doing/done) bergantian, logikanya perlu diubah dari "if-else dua arah" jadi "urutan berputar" — tapi untuk itu form Edit sudah punya pilihan status lengkap, jadi tombol cepat ini sengaja dibuat simpel.

### `handleSubmit` di `TaskForm.jsx`

1. **Gunanya:** Menyimpan tugas baru atau perubahan tugas yang sudah ada.
2. **MASUKAN:** Semua isian form (judul, deskripsi, jatuh tempo, prioritas, status, mata kuliah opsional).
3. **DIKERJAKAN:**
   1. Judul wajib diisi — kalau kosong, tampilkan error, berhenti.
   2. Susun `payload`. Tanggal jatuh tempo (format lokal dari input) diubah ke format ISO yang dimengerti database lewat `new Date(dueDate).toISOString()`.
   3. `update` atau `insert` tergantung apakah ini tugas baru atau edit.
4. **KELUARAN:** Tidak ada nilai balik — panggil `onDone()` untuk tutup form kalau sukses.
5. **Contoh nyata:** Isi judul `"Baca Bab 4"`, jatuh tempo besok jam 20:00, prioritas Tinggi, tanpa mata kuliah → tersimpan sebagai tugas baru, langsung muncul di daftar Tugas terurut sesuai jatuh temponya.
6. **Kalau diubah:** Kalau baris `.toISOString()` dihapus dan tanggal dikirim apa adanya, Supabase bisa saja menyimpan tanggal dengan zona waktu yang salah, karena kolom `due_date` butuh format yang jelas soal zona waktu.

### `toLocalInputValue(timestamptz)`

1. **Gunanya:** Kebalikan dari proses di atas — mengubah tanggal-jam yang tersimpan di database jadi format yang dimengerti kolom input HTML (`datetime-local`), khusus saat membuka form Edit.
2. **MASUKAN:** Teks tanggal-jam dari database, misal `"2026-08-01T13:00:00+00:00"`.
3. **DIKERJAKAN:** Ubah jadi objek `Date`, lalu susun ulang jadi teks format `YYYY-MM-DDTHH:mm` sesuai jam LOKAL perangkatmu (bukan jam UTC).
4. **KELUARAN:** Teks yang siap dipasang sebagai nilai awal input tanggal.
5. **Contoh nyata:** Masukan `"2026-08-01T13:00:00+00:00"` (jam UTC), kalau perangkatmu di zona WIB (+7) → keluaran `"2026-08-01T20:00"` — supaya form Edit menampilkan jam yang sama seperti yang kamu lihat sebelumnya, bukan jam UTC yang membingungkan.
6. **Kalau diubah:** Kalau fungsi ini dihapus dan tanggal database ditaruh langsung ke input, form Edit bisa menampilkan jam yang salah/bergeser.

### `handleDelete(task)` di `Tugas.jsx`

Sama persis polanya dengan `handleDeleteCourse` — konfirmasi dulu, baru hapus.

---

## Bagian E — Potongan Pendukung Kecil

### `Modal` (`src/components/Modal.jsx`)

"Mesin bungkus" yang dipakai ulang di banyak tempat (form Semester, form Mata Kuliah, form Tugas) supaya tidak perlu menulis ulang kode jendela pop-up tiga kali. **Masukan:** judul, fungsi yang dipanggil saat ditutup, dan "isi" apa pun yang mau dibungkus (`children`). **Dikerjakan:** gambar layar gelap transparan di belakang, kotak putih di tengah, tombol X di pojok. **Keluaran:** tampilan jendela pop-up siap pakai. Kalau kamu klik di luar kotak putih (area gelap), `onClose` otomatis terpanggil — tapi klik DI DALAM kotak putih tidak ikut menutup (ada `e.stopPropagation()` yang "menghentikan" klik supaya tidak menjalar ke area gelap di belakangnya).

### `Layout` (`src/components/Layout.jsx`)

Bukan satu fungsi dengan input-output yang jelas, tapi "kerangka" yang membungkus semua halaman setelah login: daftar `navItems` (Dashboard/Jadwal/Tugas/Kebiasaan/Rohani beserta ikonnya) digambar dua kali — sekali sebagai sidebar (disembunyikan di HP lewat kelas Tailwind `hidden md:flex`), sekali lagi sebagai bar bawah (disembunyikan di laptop lewat `md:hidden`). Trik "gambar dua kali, sembunyikan salah satu sesuai lebar layar" ini yang bikin tampilan responsif tanpa kode JavaScript tambahan — murni diatur CSS.

### `days.js`

Bukan fungsi, cuma daftar tetap nama hari (`Senin`...`Minggu`) beserta angkanya (1-7). Dipakai bersama oleh `Jadwal.jsx` dan `CourseForm.jsx` supaya urutan & penulisan nama hari selalu sama persis di dua tempat itu — kalau ditulis dua kali terpisah, ada risiko suatu saat salah satu lupa diperbarui.

### `supabaseClient.js`

Satu baris penting: `createClient(url, anonKey)` — bikin satu "gagang pintu" ke database Supabase-mu, dipakai ulang oleh SEMUA file lain lewat `import { supabase } from '../supabaseClient'`. Ada pengecekan di awal: kalau `.env` belum diisi, aplikasi sengaja langsung berhenti dengan pesan jelas, dibanding jalan setengah-setengah lalu error membingungkan di tempat lain.

---

## Bagian F — Kategori & Kebiasaan

File: `src/pages/Kebiasaan.jsx`, `src/components/CategoryManager.jsx`, `src/components/HabitForm.jsx`, `src/components/HabitRow.jsx`, `src/lib/dates.js`

### `fetchCategories()`, `fetchHabits()`, `fetchLogs()` di `Kebiasaan.jsx`

Tiga fungsi ini mengikuti pola yang **persis sama** dengan `fetchSemesters`/`fetchCourses`/`fetchTasks` di Bagian B-D — ambil data dari satu tabel, simpan ke state. Yang beda cuma detail kecil:

- `fetchHabits()` sekalian "menitipkan" nama & warna kategori lewat `select('*, categories(name, color)')` — pola yang sama seperti `tasks` menitipkan nama mata kuliah di Bagian D.
- `fetchLogs()` **membatasi rentang waktu**: cuma ambil `habit_logs` dari 365 hari terakhir (`gte('log_date', ...)`), bukan seluruh riwayat sejak awal pakai app. Ini supaya data yang diambil tidak membengkak tanpa batas seiring waktu — 365 hari sudah lebih dari cukup untuk menghitung streak.

Ketiganya juga masing-masing punya langganan radio sendiri (`categories-changes`, `habits-changes`, `habit-logs-changes`) — pola yang sama seperti Bagian B-D, tiga kali lipat.

### `logsByHabit` (di `Kebiasaan.jsx`)

1. **Gunanya:** Mengubah daftar log yang "datar" (satu tabel besar berisi log SEMUA kebiasaan tercampur) jadi terkelompok per kebiasaan, supaya gampang dicari "kebiasaan ini sudah pernah dicentang tanggal berapa saja?"
2. **MASUKAN:** `logs` (daftar semua `habit_logs` dalam 365 hari terakhir) dan `today` (tanggal hari ini).
3. **DIKERJAKAN:** Untuk tiap baris log, taruh ke dalam sebuah "kotak" (`Map`) berdasarkan `habit_id`-nya. Tiap kotak berisi: kumpulan semua tanggal yang tercatat (`Set`, supaya nanti gampang & cepat dicek "tanggal X ada di sini tidak?"), dan catatan khusus untuk log hari ini kalau ada.
4. **KELUARAN:** Satu `Map`, kuncinya `habit_id`, isinya `{ dates: Set(...), today: log | null }`.
5. **Contoh nyata:** Kebiasaan "Olahraga" tercatat tanggal 14, 15, 16 Juli → `logsByHabit.get(idOlahraga)` menghasilkan `{ dates: Set{"2026-07-14","2026-07-15","2026-07-16"}, today: null }` (kalau hari ini tanggal 17 dan belum dicentang).
6. **Kalau diubah:** Fungsi ini dibungkus `useMemo` — artinya cuma dihitung ULANG kalau `logs` atau `today` berubah, bukan setiap kali komponen digambar ulang untuk alasan lain (misal kamu mengetik di form lain). Kalau `useMemo` dilepas, perhitungan ini akan diulang sia-sia lebih sering dari yang perlu.

### `calculateStreak(loggedDates, today)` (di `HabitRow.jsx`)

1. **Gunanya:** Menghitung "berapa hari berturut-turut" sebuah kebiasaan sudah dicentang, dengan aturan tidak menghukum kalau hari ini belum sempat dicentang.
2. **MASUKAN:** `loggedDates` (kumpulan tanggal yang tercatat untuk SATU kebiasaan, dari `logsByHabit`) dan `today` (tanggal hari ini).
3. **DIKERJAKAN:**
   1. Mulai dari hari ini. Kalau hari ini SUDAH tercatat, mulai hitung dari situ. Kalau hari ini BELUM tercatat, mulai hitung dari KEMARIN (bukan langsung nol — hari ini belum tentu berakhir, jadi belum pantas dianggap "gagal").
   2. Selama tanggal yang dicek ada di `loggedDates`, tambah hitungan, lalu mundur satu hari, ulangi.
   3. Begitu ketemu tanggal yang TIDAK ada di `loggedDates` (ada bolongnya), berhenti.
4. **KELUARAN:** Satu angka — jumlah hari berturut-turut.
5. **Contoh nyata:** Hari ini 17 Juli, `loggedDates = {14, 15, 16 Juli}` (17 belum dicentang) → mulai dari 16 (karena 17 belum tercatat) → 16 ada, 15 ada, 14 ada, 13 tidak ada → berhenti → **streak = 3**. Kalau besoknya (18 Juli) kamu masih belum sempat centang lagi, `loggedDates` tetap `{14,15,16}` → mulai dari 17 (karena 18 belum tercatat)... 17 TIDAK ada di `loggedDates` → **streak = 0** (baru benar-benar putus setelah satu hari penuh terlewat tanpa catatan).
6. **Kalau diubah:** Kalau langkah "kalau hari ini belum tercatat, mulai dari kemarin" dihapus (langsung mulai dari hari ini apa adanya), maka streak akan terlihat putus ke 0 setiap pagi sebelum sempat dicentang — padahal harusnya baru putus kalau benar-benar terlewat satu hari penuh.

### `toggleDone()` (di `HabitRow.jsx`, khusus kebiasaan TANPA target)

1. **Gunanya:** Tombol centang cepat untuk kebiasaan sederhana (tidak berbasis angka), mirip `toggleDone` di halaman Tugas.
2. **MASUKAN:** Tidak ada parameter — baca langsung dari `habit`, `today`, dan `doneToday` di sekitarnya.
3. **DIKERJAKAN:** Kalau hari ini SUDAH ada catatannya, HAPUS baris `habit_logs` untuk hari ini (artinya: batal dicentang). Kalau BELUM, buat baris baru dengan `done: true`.
4. **KELUARAN:** Tidak ada nilai balik — perubahan terlihat lewat langganan radio.
5. **Contoh nyata:** Kebiasaan "Sholat Subuh berjamaah" belum dicentang hari ini → klik lingkaran → tersimpan baris baru → lingkaran jadi centang hijau. Klik lagi → baris tadi dihapus → balik ke lingkaran kosong.
6. **Kalau diubah:** Kalau "hapus baris" diganti jadi "ubah `done` jadi `false`" (bukan dihapus), baris itu tetap ada di database walau tidak tercentang — akan salah dihitung sebagai "hari yang tercatat" oleh `calculateStreak` (yang cuma cek "ada barisnya atau tidak", bukan isi `done`-nya). Makanya sengaja DIHAPUS, bukan ditandai `false`.

### `saveAmount()` (di `HabitRow.jsx`, khusus kebiasaan BERTARGET) — kenalan dengan "upsert"

1. **Gunanya:** Menyimpan jumlah yang tercapai hari ini untuk kebiasaan bertarget (mis. "3 dari 5 halaman"), dipanggil otomatis begitu kotak angkanya di-klik keluar (blur).
2. **MASUKAN:** Angka yang diketik user (tersimpan di state lokal `amount`).
3. **DIKERJAKAN:** Kalau kotaknya kosong, tidak melakukan apa-apa. Kalau ada angka, kirim perintah **`upsert`** ke `habit_logs`.
4. **KELUARAN:** Tidak ada nilai balik — perubahan terlihat lewat langganan radio.
5. **Contoh nyata:** Kamu isi `3` lalu klik keluar kotak → tersimpan `{habit_id, log_date: hari ini, amount_done: 3}`. Besoknya kamu balik lagi dan ubah jadi `5` → BUKAN bikin baris baru, tapi baris yang tadi (hari yang sama) di-**update** jadi `5`.
6. **Kalau diubah:** Kalau `upsert` diganti jadi `insert` biasa, mengisi angka dua kali di hari yang sama akan GAGAL — karena skema database sudah punya aturan `unique(habit_id, log_date)` (satu kebiasaan cuma boleh punya SATU baris per tanggal), dan `insert` biasa tidak tahu cara "menimpa" baris yang sudah ada, cuma tahu cara "menolak" kalau bentrok.

> **Soal "upsert":** ini gabungan kata **up**date + in**sert**. Bayangkan kamu menulis nilai ujian di buku rapor: kalau nama muridnya belum ada di halaman itu, kamu tulis baris baru. Kalau sudah ada, kamu coret angka lama, tulis angka baru di baris yang SAMA — bukan bikin baris kedua untuk murid yang sama. `upsert` melakukan pengecekan itu otomatis, asal kamu kasih tahu Supabase "kolom mana yang jadi penanda 'baris yang sama itu'" lewat `onConflict: 'habit_id,log_date'` — persis pasangan kolom yang di skema database ditandai `unique`.

### `handleDeleteHabit(habit)` (di `Kebiasaan.jsx`)

Sama persis pola dan alasannya dengan fungsi hapus lain (konfirmasi dulu via `window.confirm`, baru `delete`). Yang perlu diingat: karena `habit_logs.habit_id → habits.id` pakai `on delete cascade` (sama seperti semester→mata kuliah di Bagian 2), menghapus kebiasaan **otomatis menghapus semua riwayat centangnya juga** — makanya pesan konfirmasinya menyebutkan itu.

### Fungsi-fungsi di `CategoryManager.jsx` & `HabitForm.jsx`

Dua-duanya mengikuti pola form yang sudah dijelaskan lengkap di Bagian B/C (`SemesterManager`/`CourseForm`): `handleSubmit` melakukan `insert` atau `update` tergantung mode, `startEdit`/`cancelEdit` mengisi/mengosongkan form, `handleDelete` konfirmasi lalu hapus. Satu-satunya hal baru: `HabitForm` mengubah kotak Target yang kosong (`""`) jadi `null` sebelum dikirim (`targetAmount === '' ? null : Number(targetAmount)`) — supaya kebiasaan tanpa target tersimpan sebagai "memang tidak punya target" di database, bukan angka `0` yang berarti lain (target 0 kesannya aneh; `null` berarti "konsepnya memang tidak berlaku di sini").

### `todayLocalISO()`, `toLocalISO(date)`, `addDays(dateStr, delta)` (`src/lib/dates.js`)

1. **Gunanya:** Tiga "mesin tanggal" kecil yang dipakai bersama oleh `Kebiasaan.jsx` dan `HabitRow.jsx`, supaya perhitungan tanggal konsisten di semua tempat.
2. **MASUKAN:** `toLocalISO` menerima objek `Date`; `addDays` menerima teks tanggal (`"2026-07-17"`) dan jumlah hari untuk digeser (boleh negatif untuk mundur).
3. **DIKERJAKAN:** `todayLocalISO()` mengambil tanggal HARI INI di perangkatmu (bukan UTC — penting supaya tidak salah tanggal kalau dites mendekati tengah malam) dan mengubahnya ke format teks `"YYYY-MM-DD"`. `addDays` mengubah teks tanggal itu balik jadi objek `Date`, menggeser sejumlah hari, lalu mengubahnya balik lagi jadi teks.
4. **KELUARAN:** Teks tanggal format `"YYYY-MM-DD"`.
5. **Contoh nyata:** `addDays("2026-07-17", -1)` → `"2026-07-16"`. `addDays("2026-07-01", -1)` → `"2026-06-30"` (otomatis paham pergantian bulan, karena pakai objek `Date` asli, bukan cuma "kurangi angka terakhir").
6. **Kalau diubah:** Kalau `todayLocalISO` diganti pakai `new Date().toISOString().slice(0,10)` (kelihatannya lebih pendek), tanggalnya bisa SALAH untuk pengguna di Indonesia (UTC+7) pada jam-jam mendekati tengah malam, karena `toISOString()` selalu memakai zona waktu UTC, bukan zona waktu lokal perangkat.

---

## Bagian G — Rohani (Baca, Hafalan, Muraja'ah Berjenjang)

File: `src/pages/Rohani.jsx`, `src/components/{BacaTab,HafalanTab,MurajaahTab,PengaturanTab,ReadingPlanForm,HafalanPlanForm,OldHafalanForm}.jsx`, `src/lib/muraja.js`, `src/lib/dates.js`

Ini bagian paling rumit sejauh ini, karena aturan muraja'ah-nya harus persis sesuai spesifikasi — bukan aku karang sendiri. Sebelum menyerahkan kode ini, aku sudah uji lewat skrip percobaan otomatis yang mencocokkan tiap aturan di bawah dengan hasil sungguhan dari database, bukan cuma baca kode lalu percaya begitu saja.

### Tab (`Rohani.jsx`) — pola baru: navigasi dalam satu halaman

Beda dengan Jadwal/Tugas/Kebiasaan yang masing-masing punya alamat URL sendiri, Rohani menggabungkan 4 sub-fitur (Muraja'ah/Hafalan/Baca/Pengaturan) dalam SATU halaman, dipilih lewat tombol tab. **Masukan:** tidak ada. **Dikerjakan:** simpan tab mana yang aktif di satu state (`activeTab`), cari komponen yang cocok dari daftar `TABS`, gambar tombol-tombolnya, lalu gambar komponen yang aktif di bawahnya. **Keluaran:** salah satu dari 4 tampilan (`MurajaahTab`/`HafalanTab`/`BacaTab`/`PengaturanTab`), tergantung tab mana yang terakhir diklik. **Kalau diubah:** kalau nanti kamu ingin tiap tab punya alamat URL sendiri (supaya bisa di-bookmark atau tombol "back" browser bisa dipakai), ini perlu diubah jadi nested route React Router — untuk sekarang sengaja dibuat sederhana pakai state saja.

### `reviewInterval(stage)` (`src/lib/muraja.js`) — jantung mesin muraja'ah

1. **Gunanya:** Satu-satunya tempat di seluruh aplikasi yang tahu "kalau suatu hafalan ada di tahap sekian, berapa hari lagi harus diulang". Sengaja dipisah ke file sendiri supaya gampang dicek kebenarannya, karena aturan ini **wajib persis** sesuai spesifikasi, tidak boleh dikarang.
2. **MASUKAN:** `stage`, angka 0 sampai 4.
3. **DIKERJAKAN:** Ambil angka ke-`stage` dari tabel tetap `[1, 3, 7, 14, 30]`. Kalau `stage` di luar 0-4 (harusnya tidak pernah terjadi), dibatasi (`clamp`) supaya tidak error.
4. **KELUARAN:** Jumlah hari sampai harus diulang lagi.
5. **Contoh nyata:** `reviewInterval(0)` → `1` (besok). `reviewInterval(2)` → `7` (seminggu lagi). `reviewInterval(4)` → `30` (sebulan lagi — tahap paling "kuat").
6. **Kalau diubah:** Ini SATU-SATUNYA tempat yang perlu diubah kalau suatu saat aturan jarak muraja'ah mau diganti (misal jadi `[1,3,7,15,30,60]` dengan 6 tahap) — semua tempat lain (progres unit, form hafalan lama) otomatis ikut, tidak perlu diubah satu-satu.

### `markResult(unit, result)` (`MurajaahTab.jsx`) — aturan "naik/turun tingkat"

Ini `Mesin C` yang sudah dijelaskan sebagai konsep di `BELAJAR.md` — sekarang jadi kode sungguhan.

1. **Gunanya:** Memproses saat kamu menekan tombol "Lancar" atau "Tersendat" untuk satu unit hafalan yang sedang diulang.
2. **MASUKAN:** `unit` (baris hafalan yang sedang direview, termasuk `review_stage` sekarang) dan `result` (`'lancar'` atau `'tersendat'`).
3. **DIKERJAKAN:**
   1. Kalau `'lancar'`: tahap baru = tahap sekarang + 1, tapi dibatasi maksimal 4 (`Math.min(stage+1, 4)`) — tidak bisa naik lebih tinggi dari tahap "sangat kuat".
   2. Kalau `'tersendat'`: tahap baru = 0 (balik ke paling sering diulang), TIDAK peduli tahap sebelumnya setinggi apa.
   3. Hitung `next_review_date` = hari ini + `reviewInterval(tahap baru)` — untuk `'tersendat'` ini otomatis jadi besok, karena `reviewInterval(0) = 1`.
   4. Simpan tahap & tanggal baru ke `hafalan_units`.
   5. Catat juga ke `review_logs` (riwayat) — unit mana, tanggal berapa, hasilnya apa.
4. **KELUARAN:** Tidak ada nilai balik — perubahan langsung terlihat lewat langganan radio, unit ini hilang dari antrian hari ini (karena `next_review_date`-nya sudah lewat hari ini).
5. **Contoh nyata (sudah diuji beneran):** Unit di tahap 0 → ditandai "Lancar" 4 kali berturut-turut → tahap naik 1→2→3→4, jarak ulang makin jauh (3, 7, 14, 30 hari). Di tahap 4, ditandai "Lancar" SEKALI lagi → tahap TETAP 4 (tidak bisa naik ke 5), jarak tetap 30 hari. Lalu ditandai "Tersendat" → langsung jatuh ke tahap 0, besok harus diulang lagi — walau sebelumnya sudah di tahap paling kuat.
6. **Kalau diubah:** Kalau `Math.min(stage+1, 4)` diganti `stage+1` tanpa batas, kode `reviewInterval` akan diminta tahap 5, 6, dst yang tidak ada di tabel — untung ada `clamp` di `reviewInterval` yang menyelamatkan, tapi lebih rapi kalau batas atasnya dijaga dari sini juga.

### Antrian "Muraja'ah hari ini" (`fetchQueue` di `MurajaahTab.jsx`)

1. **Gunanya:** Menyusun daftar unit hafalan mana saja yang perlu diulang HARI INI, tidak kebanyakan, tidak ada yang lupa.
2. **MASUKAN:** `today` dan `cap` (`user_settings.muraja_daily_cap`, diambil lebih dulu lewat `fetchSettings` sebelum antrian ini boleh dihitung — makanya ada pengecekan `if (cap === null) return`, supaya tidak query pakai batas yang salah).
3. **DIKERJAKAN:**
   1. Ambil semua `hafalan_units` yang `next_review_date`-nya sudah lewat atau pas hari ini (`lte` = *less than or equal*, "kurang dari atau sama dengan").
   2. Urutkan: yang paling lama jatuh temponya (`next_review_date` paling awal) duluan, kalau seri baru dilihat mana yang lebih dulu dihafal (`memorized_date`).
   3. Batasi jumlahnya sesuai `cap` (`.limit(cap)`) — TAPI sekalian minta Supabase menghitung `count` dari SEMUA yang jatuh tempo (tanpa batas), supaya tahu ada berapa banyak sisanya yang belum kebagian tampil.
4. **KELUARAN:** `units` (daftar yang ditampilkan, sejumlah maksimal `cap`) dan `totalDue` (jumlah SEBENARNYA yang jatuh tempo, bisa lebih banyak dari `units.length`).
5. **Contoh nyata (sudah diuji beneran):** Ada 3 unit jatuh tempo, `cap` diset 2 → yang tampil cuma 2 (yang paling lama menunggu duluan), tapi pesan di layar bilang "Menampilkan 2 dari 3". Unit ketiga TIDAK hilang — besok, kalau 2 yang lain sudah ditandai lancar/tersendat (sehingga `next_review_date`-nya berubah), unit ketiga otomatis naik urutan dan muncul.
6. **Kalau diubah:** Kalau `.limit(cap)` dihapus tapi `count` tetap dipakai untuk potong array di JavaScript (`units.slice(0, cap)`), hasilnya SAMA tapi lebih boros — Supabase akan mengirim SEMUA baris yang jatuh tempo (bisa banyak), padahal yang dibutuhkan cuma sejumlah `cap`. Makanya `.limit()` dipasang di query, bukan di JavaScript.

### `markSetoranDone(plan)` (`HafalanTab.jsx`)

1. **Gunanya:** Memproses tombol "Tandai Setoran Selesai" — memajukan hafalan sesuai pace harian, DAN mendaftarkan unit-unit baru itu ke kolam muraja'ah.
2. **MASUKAN:** `plan` (rencana hafalan, termasuk `current_position`, `total_units`, `daily_pace`, `unit_label`).
3. **DIKERJAKAN:**
   1. Hitung berapa unit yang BENERAN ditambahkan hari ini: `daily_pace`, kecuali sisa menuju `total_units` lebih sedikit dari itu (supaya tidak "kelebihan" dari target akhir).
   2. Kalau sisanya sudah 0 (sudah selesai semua), tidak melakukan apa-apa (tombolnya memang disembunyikan kalau sudah selesai, ini jaga-jaga tambahan).
   3. Buat SATU baris `hafalan_units` untuk TIAP unit baru — masing-masing `review_stage: 0` dan `next_review_date`: besok. Nama tiap unit dibuat otomatis: `"<unit_label> ke-<nomor urut>"`.
   4. Majukan `current_position` di `hafalan_plans` sejumlah unit yang baru ditambahkan.
4. **KELUARAN:** Tidak ada nilai balik — unit baru langsung ikut kolam muraja'ah, akan muncul di tab Muraja'ah BESOK (karena `next_review_date`-nya besok, bukan hari ini — sesuai aturan spesifikasi: hafalan yang baru saja disetorkan belum langsung diulang hari itu juga).
5. **Contoh nyata (sudah diuji beneran):** Rencana "Hafalan Juz 30" pace 2 baris/hari, posisi sekarang 0 → klik "Tandai Setoran Selesai" → tercipta 2 baris baru: "baris ke-1" dan "baris ke-2", keduanya tahap 0, jatuh tempo ulang besok → `current_position` rencana jadi 2.
6. **Kalau diubah:** Kalau `Math.min(daily_pace, remaining)` diganti `daily_pace` polos, di hari-hari terakhir kamu bisa "melebihi" total unit rencana (misal rencana 20 baris, posisi 19, pace 2 → tanpa `Math.min`, akan tercipta unit "baris ke-20" DAN "baris ke-21" yang sebenarnya tidak ada).

### `logReading(plan)` (`BacaTab.jsx`) — progres baca & "loop" khatam

1. **Gunanya:** Mencatat halaman/bagian yang dibaca HARI INI, memajukan posisi, dan mendeteksi kapan khatam (selesai satu putaran).
2. **MASUKAN:** `plan` (rencana baca) dan angka yang diketik user di kotak "Catat ... hari ini".
3. **DIKERJAKAN:**
   1. Cek dulu: apakah hari ini SUDAH ada catatan untuk rencana ini? Kalau ada, ambil angkanya (`existingLog.amount_done`).
   2. Jumlah BARU untuk hari ini = jumlah lama (kalau ada) + yang baru diketik — jadi kalau kamu catat 2 kali dalam sehari, keduanya DIJUMLAHKAN, bukan yang kedua menimpa yang pertama.
   3. Posisi baru = posisi sekarang + yang baru DIKETIK SEKARANG (bukan total hari ini — supaya tidak dobel-hitung punya yang sudah tercatat sebelumnya).
   4. Kalau posisi baru sudah mencapai atau melewati `total_units`: kurangi dengan `total_units` (posisi "muter balik" ke awal), DAN tambah `khatam_count`. Diulang (`while`, bukan `if`) untuk jaga-jaga kalau sekali catat langsung melampaui total lebih dari satu putaran penuh.
   5. Simpan catatan hari ini (`upsert`, supaya kalau sudah ada baris untuk hari ini, di-update bukan bikin baris baru — sesuai aturan `unique(plan_id, log_date)`).
   6. Perbarui `reading_plans`: posisi baru & `khatam_count` baru.
4. **KELUARAN:** Tidak ada nilai balik — bar progres & jumlah khatam di layar otomatis ter-update lewat langganan radio.
5. **Contoh nyata (sudah diuji beneran):** Rencana 10 halaman, posisi 0. Catat 4 → posisi 4. Catat 3 lagi (hari yang sama) → posisi 7, dan baris `reading_logs` hari ini nilainya 7 (bukan bikin baris kedua). Catat 5 lagi → total jadi 12 dari target 10 → posisi "muter" jadi 2, `khatam_count` bertambah 1.
6. **Kalau diubah:** Kalau langkah "cek catatan hari ini yang sudah ada" (langkah 1) dihapus dan langsung `insert` polos, mencatat dua kali di hari yang sama akan GAGAL karena melanggar `unique(plan_id, log_date)` — sama seperti alasan `habit_logs` di Bagian F butuh `upsert`.

### `handleSubmit` di `OldHafalanForm.jsx` (aturan c — hafalan lama)

Form ini untuk hafalan yang **sudah dikuasai SEBELUM pakai app** — supaya langsung masuk kolam muraja'ah tanpa harus "disetorkan ulang" dari posisi 0. **Masukan:** teks bebas bagian yang dihafal, tanggal perkiraan dihafal, dan tahap awal yang kamu pilih sendiri (mis. "Kuat — diulang tiap 14 hari" = tahap 3). **Dikerjakan:** langsung buat satu baris `hafalan_units` dengan tahap itu, dan `next_review_date` dihitung pakai `reviewInterval` yang SAMA seperti dipakai di `markResult` — jadi aturannya konsisten, tidak ada rumus kedua yang beda sendiri. **Penting:** form ini SENGAJA tidak mengubah `current_position` rencana hafalan — ini murni menambah ke kolam muraja'ah, terpisah dari alur setoran berpace yang jalan maju berurutan.

### `handleSubmit` di `PengaturanTab.jsx`

1. **Gunanya:** Menyimpan `muraja_daily_cap` dan `day_off_of_week` ke tabel `user_settings`.
2. **MASUKAN:** Dua angka dari form.
3. **DIKERJAKAN:** `upsert` ke `user_settings` dengan `onConflict: 'user_id'`. Karena `user_settings` cuma boleh punya SATU baris per user (kolom `user_id`-nya adalah primary key, bukan `id` terpisah seperti tabel lain), `upsert` ini otomatis tahu "kalau baris punya user ini sudah ada, timpa; kalau belum, buat baru" — tanpa kode frontend perlu cek dulu secara terpisah.
4. **KELUARAN:** Tidak ada nilai balik — tampilkan pesan "Tersimpan." kalau berhasil.
5. **Contoh nyata:** User baru yang belum PERNAH menyentuh halaman Pengaturan otomatis dianggap pakai nilai bawaan (`muraja_daily_cap: 15`, `day_off_of_week: 7`, dari `DEFAULT` di skema database) sampai mereka menyimpan pengaturan sendiri untuk PERTAMA kalinya — saat itulah baris `user_settings` benar-benar tercipta.
6. **Kalau diubah:** Kalau `onConflict: 'user_id'` dihapus, `upsert` tidak tahu kolom mana yang jadi penanda "baris yang sama", dan berisiko mencoba `insert` baris baru terus-menerus setiap kali disimpan — yang akan ditolak database karena `user_id` adalah primary key (tidak boleh dobel).

### `isoDayOfWeek(date)` (`src/lib/dates.js`)

1. **Gunanya:** Menerjemahkan hari dari format bawaan JavaScript ke format yang dipakai aplikasi ini (1=Senin...7=Minggu), supaya bisa dibandingkan langsung dengan `user_settings.day_off_of_week` dan `courses.day_of_week`.
2. **MASUKAN:** Objek `Date`.
3. **DIKERJAKAN:** JavaScript punya cara sendiri menghitung hari: `Date.getDay()` memberi 0 untuk Minggu, 1 untuk Senin, dst sampai 6 untuk Sabtu. Fungsi ini mengubah KHUSUS angka 0 (Minggu) jadi 7, angka lain dibiarkan apa adanya.
4. **KELUARAN:** Angka 1-7.
5. **Contoh nyata:** Hari ini Minggu → `new Date().getDay()` memberi `0` → `isoDayOfWeek(new Date())` memberi `7` → dibandingkan dengan `day_off_of_week` (default `7`) → cocok → `HafalanTab` menyembunyikan tombol setoran baru hari itu.
6. **Kalau diubah:** Kalau fungsi ini tidak dipakai dan `Date.getDay()` dibandingkan LANGSUNG dengan `day_off_of_week`, hari liburnya akan salah geser satu hari (Minggu asli dianggap hari ke-0, padahal `day_off_of_week` defaultnya `7`) — dua sistem penomoran yang beda kalau dicampur tanpa dikonversi dulu.

---

## Bagian 2 — Skema Database (Lengkap, 12 Tabel)

Semua tabel di `PROMPT-VERSI-INSTAN.md` sekarang sudah terpakai. Enam yang pertama (dari Langkah 2-3):

```
semesters                    courses                        tasks
─────────────                ─────────────                  ─────────────
id (PK)                      id (PK)                        id (PK)
user_id                      user_id                        user_id
name                         semester_id  ──→ semesters.id   title
start_date                   name                            description
end_date                     lecturer                        due_date
is_active                    day_of_week (1=Senin..7=Minggu)  priority (low|medium|high)
                              start_time / end_time            status (todo|doing|done)
                              room                            course_id ──→ courses.id
                              color

categories                   habits                         habit_logs
─────────────                ─────────────                  ─────────────
id (PK)                      id (PK)                        id (PK)
user_id                      user_id                        user_id
name                         category_id ──→ categories.id  habit_id ──→ habits.id
color                         name                            log_date (default hari ini)
                              target_amount (opsional)        amount_done (opsional)
                              unit_label (opsional)           done (default true)
                              color                            UNIK per (habit_id, log_date)
```

Enam yang baru dari Langkah 4 — dunia Rohani:

```
reading_plans                reading_logs
─────────────                ─────────────
id (PK)                      id (PK)
user_id                      user_id
name                         plan_id ──→ reading_plans.id
type (opsional)              log_date (default hari ini)
total_units                  amount_done
unit_label (default halaman) position_after
current_position (default 0)  UNIK per (plan_id, log_date)
khatam_count (default 0)

hafalan_plans                hafalan_units                 review_logs
─────────────                ─────────────                  ─────────────
id (PK)                      id (PK)                        id (PK)
user_id                      user_id                        user_id
name                         plan_id ──→ hafalan_plans.id   unit_id ──→ hafalan_units.id
content_type (opsional)      unit_ref (teks bebas)           review_date (default hari ini)
unit_label (default baris)   memorized_date (default hari ini) result ('lancar'|'tersendat')
total_units                  review_stage (0-4, default 0)
daily_pace (default 1)       next_review_date
current_position (default 0)

user_settings
─────────────
user_id (PK langsung, bukan id terpisah)
muraja_daily_cap (default 15)
day_off_of_week (default 7 = Minggu)
```

**Beberapa aturan penting yang "tersembunyi" di skema ini:**

- **Setiap baris punya `user_id`** — semacam "nama pemilik" yang ditulis di setiap baris. Database (lewat RLS, dijelaskan di bawah) selalu mencocokkan `user_id` ini dengan siapa yang sedang login, sebelum mengizinkan baris itu dibaca/diubah/dihapus.
- **`courses.semester_id → semesters.id` dengan `on delete cascade`** — analoginya: semester itu **map/folder**, mata kuliah itu **kertas di dalam map**. Buang mapnya, semua kertas di dalamnya ikut terbuang otomatis. Makanya `SemesterManager` selalu menampilkan peringatan sebelum menghapus semester.
- **`tasks.course_id → courses.id` dengan `on delete set null`** — beda dengan di atas. Kalau mata kuliahnya dihapus, tugas yang tertaut **tidak ikut terhapus** — cuma tali penghubungnya diputus (`course_id` jadi kosong/`null`). Tugasnya sendiri tetap ada, cuma jadi tugas "tanpa mata kuliah".
- **`day_of_week` pakai angka 1–7, Senin=1 sampai Minggu=7** — bukan 0=Minggu seperti kebiasaan JavaScript (`Date.getDay()`). Ini sengaja disamakan dengan `user_settings.day_off_of_week` di skema besar (dijelaskan di `PROMPT-VERSI-INSTAN.md`), supaya nanti kalau naik ke versi penuh, angkanya tidak perlu diubah-ubah lagi.
- **`priority` dan `status` cuma boleh diisi teks tertentu** (`low/medium/high` dan `todo/doing/done`) — ini bukan dipaksa oleh database, tapi kesepakatan dari `SPEC.md` yang diikuti kode di frontend supaya konsisten.
- **`habits.category_id → categories.id` dengan `on delete set null`** — sama seperti tugas→mata kuliah: hapus kategori, kebiasaan yang memakainya TIDAK ikut hilang, cuma jadi "tanpa kategori".
- **`habit_logs.habit_id → habits.id` dengan `on delete cascade`** — sama seperti semester→mata kuliah: hapus kebiasaan, semua riwayat centangnya (`habit_logs`) ikut terhapus.
- **`unique(habit_id, log_date)` di `habit_logs`** — database sendiri yang menjaga "satu kebiasaan cuma boleh punya satu catatan per tanggal", bukan cuma dijaga oleh kode frontend. Kalau ada dua permintaan `insert` untuk kebiasaan & tanggal yang sama, yang kedua akan ditolak database — makanya kode di `HabitRow.jsx` pakai `upsert` (lihat Bagian F), bukan `insert` biasa.
- **`unique(plan_id, log_date)` di `reading_logs`** — pola yang sama persis seperti `habit_logs`, alasan yang sama: satu rencana baca cuma boleh punya satu catatan per tanggal, dijamin database, ditangani lewat `upsert` di `logReading` (Bagian G).
- **`hafalan_units.plan_id → hafalan_plans.id` dan `review_logs.unit_id → hafalan_units.id`, keduanya `on delete cascade`** — hapus rencana hafalan, semua unit yang sudah dihafal ikut hilang; hapus unit, semua riwayat muraja'ah unit itu ikut hilang. Rantai tiga tingkat: hapus `hafalan_plans` → ikut hapus `hafalan_units` → ikut hapus `review_logs`.
- **`hafalan_units.review_stage` (0-4) tidak dijaga database**, cuma dijaga oleh kode frontend (`Math.min(stage+1, 4)` di `markResult`, Bagian G) — beda dengan `unique` yang dijaga database, batas 0-4 ini murni aturan aplikasi.
- **`user_settings` primary key-nya `user_id` sendiri** (bukan kolom `id` terpisah seperti tabel lain) — artinya SECARA STRUKTUR database sudah menjamin satu user maksimal satu baris pengaturan. Ini yang bikin pola `upsert({...}, {onConflict:'user_id'})` di `PengaturanTab` (Bagian G) selalu benar tanpa perlu pengecekan tambahan.

### RLS (Row Level Security) — "loker sekolah"

Setiap tabel punya aturan: *"baris ini cuma boleh dibaca/diubah/dihapus kalau `user_id`-nya sama dengan yang sedang login."* Bayangkan loker sekolah: semua orang bisa lihat ada banyak loker berjejer, tapi tiap loker cuma bisa dibuka dengan kunci yang cocok. Punya orang lain, walau kelihatan lokernya, tidak akan bisa dibuka.

Ini bukan cuma teori — kita sempat betulan kena masalah ini di Langkah 2: RLS sempat aktif tanpa "aturan kunci" (policy) sama sekali, jadi SEMUA orang (termasuk pemilik aslinya!) ditolak. Sudah diperbaiki dengan menjalankan SQL yang membuat policy `using (auth.uid() = user_id) with check (auth.uid() = user_id)` di semua tabel.

### Realtime — "langganan koran"

Supaya perubahan di satu tab/perangkat otomatis kelihatan di tab/perangkat lain (tanpa refresh), tabel harus didaftarkan satu-satu ke "saluran siaran" khusus (`alter publication supabase_realtime add table ...`) — terpisah dari `semesters`/`courses`/`tasks` (Langkah 2), `categories`/`habits`/`habit_logs` (Langkah 3), dan `reading_plans`/`reading_logs`/`hafalan_plans`/`hafalan_units`/`review_logs`/`user_settings` (Langkah 4). Tanpa langkah ini, kode `supabase.channel(...).subscribe()` di frontend tetap jalan tanpa error, tapi tidak akan pernah menerima kabar apa pun — seperti berlangganan koran ke alamat yang salah, suratnya tidak pernah nyampai walau kamu sudah bayar langganan.

---

## Bagian 3 — Skema Frontend

- **React Router** mengatur halaman mana yang tampil sesuai alamat URL (`/login`, `/`, `/jadwal`, dst). Halaman dibagi dua kelompok: yang boleh diakses tanpa login (`/login`) dan yang dibungkus `<ProtectedRoute>` (semua yang lain).
- **Context** (`AuthContext`, `SemesterContext`) dipasang di `App.jsx`, membungkus semua halaman yang butuh tahu "siapa yang login" dan "semester aktif yang mana" — supaya `Jadwal.jsx` dan `Tugas.jsx` bisa sama-sama baca info itu tanpa harus dioper manual dari komponen induk ke anak.
- **Realtime di sisi frontend** selalu mengikuti pola yang sama di enam tempat sekarang (semesters, courses, tasks, categories, habits, habit_logs): buka `channel`, dengarkan `postgres_changes`, panggil ulang fungsi fetch, lalu `removeChannel` saat komponen ditutup. Begitu kamu paham satu, kamu paham semuanya.
- **Responsif** murni diatur lewat kelas Tailwind `md:` (aktif mulai layar ≥768px) — bukan lewat kode JavaScript yang mendeteksi ukuran layar (kecuali di `getInitialColumns`, yang memang sengaja butuh angka pasti sekali di awal, bukan terus-menerus mengikuti perubahan ukuran layar).
- **Trik username→email** (Bagian A) murni terjadi di frontend (`Login.jsx`) — Supabase sendiri di baliknya tetap "mengira" ini aplikasi berbasis email biasa.
- **State lokal di dalam komponen list-item** (`HabitRow.jsx`) — setiap baris kebiasaan bertarget punya state `amount` miliknya sendiri, terpisah dari komponen `Kebiasaan.jsx` induknya. Ini sengaja, supaya kalau ada perubahan realtime datang (misal kamu centang kebiasaan LAIN) sementara kamu sedang mengetik angka di kebiasaan INI, ketikanmu tidak ikut ke-reset. Triknya: selama `key={habit.id}` di `Kebiasaan.jsx` tidak berubah, React tetap mempertahankan state internal `HabitRow` itu walau induknya digambar ulang.
- **Data turunan lewat `useMemo`** (`logsByHabit`) — daripada menghitung ulang pengelompokan log setiap kali komponen digambar ulang (misalnya gara-gara kamu mengetik sesuatu yang sama sekali tidak berhubungan), `useMemo` cuma menghitung ulang kalau bahan mentahnya (`logs`, `today`) benar-benar berubah.
- **Navigasi tab dalam satu halaman** (`Rohani.jsx`, Bagian G) — beda dengan menu utama (Dashboard/Jadwal/dst) yang pakai React Router (alamat URL beda-beda), sub-menu Muraja'ah/Hafalan/Baca/Pengaturan cuma pakai `useState` biasa. Lebih ringan, tapi konsekuensinya: refresh halaman selalu balik ke tab pertama (Muraja'ah), tidak bisa di-bookmark ke tab tertentu.
- **Data yang bergantung pada data lain, diambil berurutan** (`fetchQueue` di `MurajaahTab`, Bagian G) — karena batas jumlah antrian (`cap`) datang dari tabel LAIN (`user_settings`), kode sengaja menunggu (`if (cap === null) return`) sampai pengaturan itu selesai diambil dulu, baru mengambil antrian muraja'ah dengan batas yang benar. Pola ini juga dipakai `Jadwal.jsx` (Bagian C): mata kuliah menunggu semester aktif diketahui dulu.

## Bagian 4 — Skema Backend (Supabase)

- **Auth**: tetap pakai sistem email+password bawaan Supabase (paling teruji, RLS-nya otomatis nyambung lewat `auth.uid()`), tapi disamarkan jadi username lewat trik di atas. Pengaturan **"Confirm email" wajib dimatikan**, karena email palsu itu tidak akan pernah bisa menerima email konfirmasi sungguhan.
- **RLS**: satu pola `using (auth.uid() = user_id) with check (auth.uid() = user_id)` diulang di semua tabel — `auth.uid()` adalah fungsi bawaan Supabase yang tahu siapa pemilik sesi yang sedang mengirim request (dibaca dari "gelang tangan" bernama JWT yang otomatis ditempel `supabase-js` di setiap request setelah kamu login).
- **Realtime publication**: daftar tabel yang boleh "disiarkan" perubahannya, diatur terpisah dari RLS (dua pengaturan berbeda, harus dua-duanya benar supaya realtime jalan). Perlu dijalankan lagi tiap kali ada tabel BARU yang mulai dipakai — bukan sekali untuk selamanya.
- **anon key vs service_role key**: frontend cuma pernah pakai `anon key` (aman untuk ditaruh di kode yang jalan di browser, karena tetap dijaga RLS). `service_role key` (yang bisa melewati RLS) tidak pernah dipakai di kode ini sama sekali — sesuai aturan keamanan di `CLAUDE.md`.
- **`upsert` + `unique constraint`**: kombinasi ini yang bikin `habit_logs` & `reading_logs` (Bagian F & G) aman dari data ganda tanpa kode frontend perlu "cek dulu ada belum, baru insert/update" secara manual dua langkah — database yang menjamin lewat `unique(...)`, `upsert` yang memanfaatkannya lewat `onConflict`.
- **`count: 'exact'` di `.select()`** (Bagian G, `MurajaahTab`) — cara minta Supabase menghitung TOTAL baris yang cocok dengan filter, terpisah dari `.limit()` yang membatasi berapa baris yang benar-benar dikirim. Berguna untuk kasus "tampilkan sebagian, tapi tetap kasih tahu totalnya berapa" seperti antrian muraja'ah yang dibatasi cap.
- **Mesin yang "jangan dikarang sendiri"**: `src/lib/muraja.js` sengaja dipisah jadi file kecil tersendiri, isinya cuma satu tabel angka. Ini bukan kebetulan — spesifikasi di `PROMPT-VERSI-INSTAN.md` eksplisit bilang "implementasikan PERSIS aturan ini, jangan mengarang", jadi kode yang menjalankan aturan itu sengaja dibuat sekecil & se-terisolasi mungkin, supaya gampang dicek kebenarannya terpisah dari kode UI di sekitarnya.
