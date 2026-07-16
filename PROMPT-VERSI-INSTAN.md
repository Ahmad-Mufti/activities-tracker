# Prompt Siap-Tempel — "KampusKu" Versi Instan

> **Tujuan:** membangun aplikasi yang cepat jadi & langsung dipakai, dengan bantuan AI penuh.
> Ini **subset** dari `SPEC.md`. **Muraja'ah dibangun versi mutakhir (berjenjang / spaced repetition).** Mesin lain (anggaran waktu, event pintar, prioritas lantai-atap) sengaja **tidak** dibangun di sini.
> Skema database dibuat sebagai subset persis SPEC penuh agar kedua versi bisa **berbagi satu database Supabase** dan mudah dinaikkan kelasnya nanti.

## Cara pakai dokumen ini
1. Kerjakan **langkah demi langkah** (Langkah 0 → 6). Selesaikan & tes satu langkah sebelum lanjut.
2. Untuk tiap langkah, **tempel "Konteks Tetap" di bawah + prompt langkah itu** ke AI (Claude di VSCode / AI lain).
3. Beri AI satu langkah saja per sesi. Jangan minta semuanya sekaligus.

---

## KONTEKS TETAP (tempel di awal tiap sesi)

```
Kamu membantu membangun PWA "KampusKu" — organizer kegiatan mahasiswa. Ini versi instan (ringkas, cepat dipakai).

Tech stack (WAJIB, jangan diganti):
- React + Vite, Tailwind CSS
- Supabase (Postgres + Auth + Realtime), akses lewat src/supabaseClient.js
- vite-plugin-pwa, lucide-react
- Hosting Vercel

Aturan:
- Frontend hanya pakai anon key dari .env; .env masuk .gitignore. Jangan service_role key.
- Semua tabel sudah pakai Row Level Security (user hanya akses datanya sendiri).
- Komponen responsif (HP & laptop) dengan Tailwind.
- Pakai Supabase Realtime (postgres_changes) untuk daftar yang perlu auto-update.
- Beri kode file LENGKAP beserta nama/path file-nya. Sertakan cara menguji.

JANGAN bangun di versi instan ini (ditunda ke pengembangan lanjutan):
- Anggaran waktu / estimasi durasi / slot / prioritas lantai-atap.
- Event pintar, pengecualian jadwal per-tanggal, recurring events, proyek, kajian, modul workout.
(Muraja'ah berjenjang JUSTRU dibangun — lihat Langkah 4.)

Kerjakan HANYA tugas langkah yang kuberikan. Jangan menambah fitur di luar itu.
```

---

## SKEMA DATABASE (jalankan sekali di Supabase → SQL Editor)

Subset dari SPEC penuh. Pola RLS diulang untuk tiap tabel.

```sql
-- akademik
create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null, start_date date not null, end_date date not null,
  is_active boolean default true, created_at timestamptz default now()
);
create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  semester_id uuid references semesters(id) on delete cascade,
  name text not null, lecturer text, day_of_week int,
  start_time time, end_time time, room text,
  color text default '#3b82f6', created_at timestamptz default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text not null, description text, due_date timestamptz,
  priority text default 'medium', status text default 'todo',
  course_id uuid references courses(id) on delete set null,
  created_at timestamptz default now()
);

-- kategori & kebiasaan
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null, color text default '#22c55e'
);
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null, category_id uuid references categories(id) on delete set null,
  target_amount numeric, unit_label text, color text default '#22c55e',
  created_at timestamptz default now()
);
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  habit_id uuid references habits(id) on delete cascade,
  log_date date not null default current_date,
  amount_done numeric, done boolean default true,
  unique (habit_id, log_date)
);

-- baca (menuju khatam)
create table reading_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null, type text, total_units int,
  unit_label text default 'halaman', current_position int default 0,
  khatam_count int default 0, created_at timestamptz default now()
);
create table reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  plan_id uuid references reading_plans(id) on delete cascade,
  log_date date not null default current_date,
  amount_done numeric, position_after int,
  unique (plan_id, log_date)
);

-- hafalan (setoran ber-pace) + unit yang sudah dihafal (kolam muraja'ah berjenjang)
create table hafalan_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null, content_type text, unit_label text default 'baris',
  total_units int, daily_pace numeric default 1, current_position int default 0,
  created_at timestamptz default now()
);
create table hafalan_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  plan_id uuid references hafalan_plans(id) on delete cascade,
  unit_ref text, memorized_date date default current_date,
  review_stage int default 0,        -- 0..4 (mesin muraja'ah berjenjang)
  next_review_date date,             -- kapan jatuh tempo diulang
  created_at timestamptz default now()
);
-- riwayat muraja'ah
create table review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  unit_id uuid references hafalan_units(id) on delete cascade,
  review_date date not null default current_date,
  result text                        -- 'lancar' | 'tersendat'
);
-- pengaturan muraja'ah
create table user_settings (
  user_id uuid primary key references auth.users default auth.uid(),
  muraja_daily_cap int default 15,   -- batas jumlah unit muraja'ah / hari
  day_off_of_week int default 7      -- hari khusus muraja'ah tanpa hafalan (7=Minggu)
);

-- AKTIFKAN RLS + POLICY untuk SEMUA tabel di atas (ganti NAMA_TABEL):
--   alter table NAMA_TABEL enable row level security;
--   create policy "own NAMA_TABEL" on NAMA_TABEL for all
--     using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Catatan: nama tabel & kolom ini sama persis dengan SPEC penuh, jadi kedua versi bisa berbagi database & mudah dinaikkan kelasnya nanti.

---

## LANGKAH BUILD

### Langkah 0 — Setup
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 0: siapkan proyek dari nol di folder ini.
1. Buat app Vite React: `npm create vite@latest . -- --template react`.
2. Install: @supabase/supabase-js, lucide-react. Setup Tailwind CSS & vite-plugin-pwa.
3. Buat src/supabaseClient.js yang membaca VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY dari .env.
4. Buat file .env.example, dan pastikan .env ada di .gitignore.
Beri semua file yang dibuat/diubah + perintah terminal + cara memverifikasi `npm run dev` berjalan.
```
Lalu di Supabase: buat project, jalankan SKEMA DATABASE di atas, isi URL & anon key ke `.env`.
**Tes:** `npm run dev` membuka halaman kosong tanpa error.

### Langkah 1 — Login & Kerangka
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 1:
1. Halaman Login/Daftar (email+password) via Supabase Auth; simpan sesi.
2. Setelah login: layout utama dengan navigasi — sidebar di laptop, bar bawah di HP. Menu: Dashboard, Jadwal, Tugas, Kebiasaan, Rohani.
3. Tombol logout. Dashboard cukup kerangka kosong dulu.
Beri file lengkap + cara menguji daftar/login/logout & responsif.
```
**Tes:** bisa daftar, login, logout; layout rapi di HP & laptop.

### Langkah 2 — Semester, Jadwal, Tugas
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 2 (pakai tabel semesters, courses, tasks):
1. Semester: buat/edit/hapus; tandai satu sebagai aktif. Data akademik mengacu semester aktif.
2. Jadwal: grid mingguan Senin–Minggu; CRUD mata kuliah (courses) dengan warna, jam, ruang, dosen — terikat semester aktif.
3. Tugas: list + tambah/edit/hapus + tandai selesai; filter status & prioritas; urut berdasarkan due_date; opsional tautkan ke course.
4. Aktifkan Realtime (postgres_changes) agar daftar tugas & jadwal auto-update.
Beri file lengkap + cara menguji sinkron di 2 tab/perangkat.
```
**Tes:** ubah di satu tab, tab lain berubah otomatis; ganti semester aktif → jadwal ikut.

### Langkah 3 — Kategori & Kebiasaan
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 3 (pakai tabel categories, habits, habit_logs):
1. Kategori: CRUD + warna (mis. Rohani, Akademik, Kesehatan).
2. Kebiasaan: CRUD dengan kategori, target_amount + unit_label opsional.
3. Tampilan harian: centang kebiasaan hari ini (tulis ke habit_logs, unik per habit per tanggal); bila ada target, bisa isi amount_done.
4. Tampilkan streak sederhana (berapa hari berturut-turut).
Beri file lengkap + cara menguji centang tersimpan & bertahan setelah refresh.
```
**Tes:** centang & streak tersimpan.

### Langkah 4 — Rohani (baca, hafalan, muraja'ah BERJENJANG)
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 4 (pakai reading_plans/reading_logs, hafalan_plans/hafalan_units, review_logs, user_settings):

1. Baca: buat rencana baca (Qur'an/hadis) dengan total_units menuju khatam. Tiap hari catat amount_done → perbarui current_position & tampilkan bar progres. Saat mencapai total → naikkan khatam_count & reset posisi (loop).

2. Hafalan (setoran ber-pace, TANPA deadline): buat rencana dengan daily_pace. Tampilkan "setoran hari ini" (dari pace + current_position) & estimasi selesai sebagai INFO SAJA. Saat setoran ditandai selesai: majukan current_position DAN buat baris hafalan_units untuk tiap unit baru, dengan review_stage=0 dan next_review_date = besok (tanggal + 1). JANGAN jadwalkan setoran hafalan baru di hari 'day_off_of_week' (default Minggu).

3. Muraja'ah BERJENJANG (spaced repetition) — implementasikan PERSIS aturan ini, jangan mengarang:
   Tabel interval per review_stage: 0->1 hari, 1->3, 2->7, 3->14, 4->30.
   a) Menyusun "Muraja'ah hari ini": ambil semua hafalan_units milik user dengan next_review_date <= hari ini; urutkan by next_review_date lalu memorized_date; batasi sebanyak user_settings.muraja_daily_cap. Sisanya biarkan (otomatis muncul lagi besok).
   b) Saat user menandai hasil sebuah unit:
      - 'lancar'  -> review_stage = min(stage+1, 4); next_review_date = hari ini + interval(stage baru).
      - 'tersendat' -> review_stage = 0; next_review_date = hari ini + 1.
      - catat ke review_logs (unit_id, review_date=hari ini, result).
   c) Menambah hafalan lama (sudah dikuasai sebelum pakai app): saat input, user boleh set review_stage awal (mis. 3/4); next_review_date = hari ini + interval(stage itu).
   d) Sediakan halaman pengaturan sederhana untuk user_settings (muraja_daily_cap, day_off_of_week).

Beri file lengkap + cara menguji tiap poin.
```
**Tes:** setoran menambah unit (stage 0, jatuh tempo besok); unit "lancar" makin jarang muncul, "tersendat" balik ke harian; daftar dibatasi cap & sisanya muncul besok; progres baca jalan.

### Langkah 5 — Dashboard, Notifikasi & PWA
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 5:
1. Dashboard "Hari Ini": rangkum jadwal kuliah hari ini, tugas jatuh tempo hari/besok, kebiasaan belum dicentang, setoran hafalan hari ini, dan pengingat muraja'ah.
2. PWA: konfigurasi vite-plugin-pwa (manifest + service worker) agar installable ("Add to Home Screen").
3. Notifikasi: minta izin Notification API; tampilkan notifikasi saat jadwal akan mulai atau tugas mendekati due_date.
Beri file lengkap + cara menguji install PWA & notifikasi.
```
**Tes:** dashboard terisi; app bisa di-install; notifikasi muncul.

### Langkah 6 — Deploy
**Prompt:**
```
[Konteks Tetap]
Tugas Langkah 6: siapkan deploy ke Vercel.
1. Beri langkah push ke GitHub.
2. Beri langkah hubungkan repo ke Vercel + set environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
3. Pastikan build Vite berjalan di Vercel.
Beri instruksi ringkas + cara verifikasi app live di HP & laptop dengan login yang sama.
```
**Tes:** buka URL Vercel di HP & laptop, login sama, data sinkron.

---

## Checklist Versi Instan Selesai
- [ ] Daftar/login/logout.
- [ ] Semester aktif + jadwal mingguan + tugas (realtime).
- [ ] Kategori + kebiasaan + streak (centang harian).
- [ ] Baca (progres khatam), hafalan (setoran + posisi), muraja'ah berjenjang (interval, cap, aturan Minggu).
- [ ] Dashboard "Hari Ini" terisi.
- [ ] PWA installable + notifikasi jalan.
- [ ] Live di Vercel, data sinkron antar perangkat, semua gratis.

> Setelah ini kamu sudah punya app yang bisa dipakai, lengkap dengan muraja'ah berjenjang. Sisa mesin pintar (anggaran waktu, event, prioritas, workout) bisa ditambah kemudian di atas database yang sama — ikuti `SPEC.md`.
