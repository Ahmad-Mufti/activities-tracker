# Spesifikasi Aplikasi "KampusKu" — Organizer Kegiatan Mahasiswa

> Instruksi lengkap pembuatan aplikasi. Kerjakan **berurutan per fase** (Bagian 7). Jangan lompat.
> Selesaikan & minta user menguji satu fase sebelum lanjut.

---

## 1. Tujuan & Prinsip

**Tujuan:** Satu aplikasi web untuk mahasiswa yang mengelola kegiatan akademik **dan** kegiatan rohani/pribadi, tersinkron antar perangkat secara real-time.

Aplikasi punya dua lapisan:

- **Lapisan akademik (sementara):** jadwal kuliah, tugas, proyek — terikat semester dan datang-pergi tiap ~4 bulan.
- **Lapisan rohani/pribadi (permanen):** membaca, menghafal, muraja'ah, mendengar kajian, kebiasaan, dan **workout** — berjalan sepanjang tahun tanpa peduli semester.

**Prinsip wajib:**

1. **Multiplatform = PWA.** Satu web app responsif yang bisa di-install ke HP & laptop. Tidak ada app native terpisah.
2. **Real-time sync antar perangkat.** Semua data di satu database cloud; perubahan langsung tampak di perangkat lain.
3. **Solo, bukan kolaborasi.** Tiap user hanya melihat datanya sendiri.
4. **Ada pengingat/notifikasi** untuk jadwal, deadline, dan kegiatan harian.
5. **100% gratis.** Hanya layanan tier gratis.

**Prinsip desain (jadi ruh aplikasi — patuhi di setiap fitur):**

- **Menjaga lebih pokok daripada menambah.** Kegiatan yang kalau ditinggalkan menyebabkan *kehilangan* (muraja'ah, menjaga nyala baca) diprioritaskan di atas kegiatan yang hanya *melambat* bila dilewati (setoran hafalan baru).
- **Tanpa deadline yang mengintimidasi.** Hafalan digerakkan oleh *kecepatan harian (pace)*, bukan tenggat. Estimasi selesai hanya info yang santai bergeser.
- **Realistis, bukan angan-angan.** Rencana harian harus muat di waktu nyata. Anggaran waktu (Bagian 6C) adalah penjaga utama; hari sibuk otomatis turun ke "set lantai".
- **Tidak menghukum.** Absen tidak menumpuk beban atau memutus streak selama "lantai" terpenuhi.

---

## 2. Tech Stack (WAJIB)

| Bagian | Teknologi | Alasan |
|---|---|---|
| Frontend | **React + Vite** | Standar, banyak contoh |
| Styling | **Tailwind CSS** | Responsif cepat |
| DB + Login + Realtime | **Supabase** (free) | Postgres + Auth + Realtime dalam satu layanan. Cocok karena user paham SQL (MySQL) |
| Hosting | **Vercel** (free) | Deploy gratis dari GitHub |
| PWA | **vite-plugin-pwa** | Installable + offline cache |
| Notifikasi | **Notification API** browser | Gratis, bawaan |
| Ikon | **lucide-react** | Ringan |

Utamakan Supabase. Jangan ganti stack tanpa diminta user.

---

## 3. Arsitektur

```
[ HP browser ]  \
                 >-- Supabase JS Client --> [ Supabase Cloud ]
[ Laptop browser ] /                          - Postgres DB
                                              - Auth (login)
                                              - Realtime (auto-sync)
Frontend (React PWA) di-hosting di Vercel. Tidak ada server sendiri.
```

Sinkronisasi terjadi karena semua perangkat terhubung ke DB Supabase yang sama & berlangganan perubahan realtime (`postgres_changes`).

---

## 4. Konsep Inti (baca sebelum melihat skema)

- **Semester** = wadah berjangka (punya tanggal mulai & berakhir). Semua mata kuliah & tugas akademik menempel padanya. Lewat tanggal berakhir → arsip otomatis, jadwal berhenti membebani waktu. Semester baru = data akademik bersih; yang lama disimpan sebagai riwayat.
- **Jadwal kuliah** = template mingguan dalam sebuah semester. Bisa punya **pengecualian per-tanggal** (satu sesi batal/pindah untuk satu hari saja tanpa mengubah template).
- **Item template berulang** = komitmen mingguan non-kuliah yang pasti berulang tiap tahun ajaran (mis. rapat organisasi mingguan). Berdiri sendiri, tidak terikat satu semester.
- **Event** = kejadian **sekali** bertanggal (seminar, kondangan, ujian, sakit). Menimpa hari itu & mengurangi waktu luang.
- **Tugas** = penghubung: bisa berdiri sendiri, menempel ke mata kuliah, atau menempel ke proyek.
- **Kegiatan Rohani** terdiri dari:
  - **Baca** (Qur'an/hadis): centang harian + posisi menuju khatam + streak.
  - **Kajian**: mengikuti seri/course dari program luar (mis. 30 sesi, 1/hari); lacak "sudah sampai sesi ke berapa". Terpisah dari hafalan matan.
  - **Hafalan** (Qur'an/hadis/matan): rencana ber-*pace* (setoran/hari), tanpa deadline. Menghasilkan "setoran hari ini" & estimasi selesai yang bergeser.
  - **Muraja'ah**: mesin *spaced repetition* berjenjang. Tiap unit hafalan yang selesai otomatis masuk kolam muraja'ah (Bagian 6A).
- **Workout** (kategori Kesehatan, lapisan permanen) = **template split mingguan** (hari ini latihan apa, mis. Tarik/Dorong/Kaki/Lari) + **hari istirahat**. Tiap latihan punya tipe metrik fleksibel (repetisi / jarak / durasi), progresi **manual**, serta lantai/atap. **Dijaga ringkas** — durasi sesi pendek, default tingkat Rutin agar mengalah lebih dulu saat waktu sempit; anggaran waktu (6C) menjaganya tidak menggerus waktu belajar & ibadah.
- **Kategori** = label pada kebiasaan/kegiatan (Rohani, Akademik, Kesehatan, dll).
- **Prioritas (lantai/atap)** = tiap kegiatan harian punya *lantai* (minimal, penyelamat hari sibuk) & *target* (kondisi normal), serta tingkat **Wajib / Rutin / Bonus** (Bagian 6B).
- **Anggaran waktu** = tiap kegiatan punya estimasi durasi & jangkar waktu (slot); app mengecek total harian **dan per-slot** terhadap waktu luang (Bagian 6C).

---

## 5. Skema Database (Supabase → SQL Editor)

Semua tabel punya `user_id` + **Row Level Security**. Pola policy (ulangi untuk setiap tabel):

```sql
alter table NAMA_TABEL enable row level security;
create policy "own NAMA_TABEL" on NAMA_TABEL for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 5.1 Akademik (Fase 2)

```sql
create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,                 -- "Ganjil 2026/2027"
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table courses (                 -- jadwal kuliah (template mingguan)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  semester_id uuid references semesters(id) on delete cascade,
  name text not null,
  lecturer text,
  day_of_week int,                     -- 1=Senin ... 7=Minggu
  start_time time,
  end_time time,
  room text,
  color text default '#3b82f6',
  created_at timestamptz default now()
);

create table schedule_exceptions (     -- pengecualian per-tanggal utk 1 sesi kuliah
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  course_id uuid references courses(id) on delete cascade,
  exception_date date not null,
  type text not null,                  -- 'cancelled' | 'moved'
  new_start_time time,                 -- diisi bila 'moved'
  new_end_time time,
  new_room text,
  note text
);

create table recurring_events (        -- komitmen mingguan non-kuliah (mis. rapat)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  day_of_week int,
  start_time time,
  end_time time,
  category text,
  project_id uuid,                     -- opsional, tautan ke proyek
  valid_from date,                     -- opsional; null = berlaku terus
  valid_until date,
  color text default '#8b5cf6'
);

create table events (                  -- kejadian SEKALI bertanggal
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  event_date date not null,
  start_time time,
  end_time time,
  all_day boolean default false,
  category text,
  project_id uuid,                     -- opsional
  note text,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  description text,
  due_date timestamptz,
  priority text default 'medium',      -- low | medium | high
  status text default 'todo',          -- todo | doing | done
  course_id uuid references courses(id) on delete set null,
  project_id uuid,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  description text,
  deadline timestamptz,
  status text default 'active',        -- active | done | archived
  created_at timestamptz default now()
);
```

### 5.2 Kategori & Kebiasaan sederhana (Fase 3)

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,                  -- Rohani | Akademik | Kesehatan | ...
  color text default '#22c55e'
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  frequency text default 'daily',
  -- kolom umum kegiatan harian (dipakai juga oleh modul rohani):
  priority_tier text default 'rutin',  -- wajib | rutin | bonus
  floor_amount numeric,                -- lantai (minimal)
  target_amount numeric,               -- target normal
  unit_label text,                     -- 'halaman' | 'menit' | 'kali' | dll
  est_duration_min int,                -- estimasi durasi (menit) utk anggaran waktu
  time_slot text,                      -- 'bada_subuh' | 'pagi' | 'bada_dzuhur' | 'bada_maghrib' | 'malam' | dll
  color text default '#22c55e',
  created_at timestamptz default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  habit_id uuid references habits(id) on delete cascade,
  log_date date not null default current_date,
  amount_done numeric,                 -- berapa yang tercapai (utk target kuantitas)
  done boolean default true,
  unique (habit_id, log_date)
);
```

### 5.3 Modul Rohani — Baca & Kajian (Fase 6)

```sql
create table reading_plans (           -- baca Qur'an / hadis menuju khatam
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  type text,                           -- 'quran' | 'hadith' | 'other'
  total_units int,                     -- mis. jumlah halaman/juz untuk khatam
  unit_label text default 'halaman',
  current_position int default 0,      -- posisi terakhir dibaca
  khatam_count int default 0,          -- berapa kali sudah khatam (loop)
  priority_tier text default 'wajib',
  floor_amount numeric,                -- mis. minimal 1 halaman
  target_amount numeric,
  est_duration_min int,
  time_slot text,
  created_at timestamptz default now()
);

create table reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  plan_id uuid references reading_plans(id) on delete cascade,
  log_date date not null default current_date,
  amount_done numeric,
  position_after int,
  unique (plan_id, log_date)
);

create table kajian_series (           -- course kajian dari program luar
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  total_sessions int,                  -- mis. 30
  current_session int default 0,       -- sudah sampai sesi ke berapa
  priority_tier text default 'rutin',
  est_duration_min int,
  time_slot text,
  created_at timestamptz default now()
);

create table kajian_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  series_id uuid references kajian_series(id) on delete cascade,
  session_number int,
  log_date date not null default current_date,
  unique (series_id, session_number)
);
```

### 5.4 Modul Rohani — Hafalan & Muraja'ah (Fase 6 & 7)

```sql
create table hafalan_plans (           -- rencana menghafal (pace-based, tanpa deadline)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  content_type text,                   -- 'quran' | 'hadith' | 'matan'
  unit_label text default 'baris',     -- 'baris' | 'bait' | 'halaman' | 'nomor'
  total_units int,                     -- opsional (utk bar progres). null = terbuka
  daily_pace numeric default 1,        -- setoran per hari (pace, bukan deadline)
  current_position int default 0,      -- sudah sampai unit ke berapa
  priority_tier text default 'rutin',  -- setoran baru = paling lentur
  est_duration_min int,
  time_slot text,
  created_at timestamptz default now()
);

create table hafalan_units (           -- tiap unit yang SUDAH dihafal -> kolam muraja'ah
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  plan_id uuid references hafalan_plans(id) on delete cascade,
  unit_ref text,                       -- penanda unit, mis. "Juz 30 hal 3" / "bait 12"
  memorized_date date default current_date,
  review_stage int default 0,          -- 0..4 (lihat Bagian 6A)
  next_review_date date,               -- kapan jatuh tempo diulang
  created_at timestamptz default now()
);

create table review_logs (             -- riwayat muraja'ah (opsional, utk statistik)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  unit_id uuid references hafalan_units(id) on delete cascade,
  review_date date not null default current_date,
  result text                          -- 'lancar' | 'tersendat'
);
```

### 5.5 Pengaturan pengguna (Fase 8)

```sql
create table user_settings (
  user_id uuid primary key references auth.users default auth.uid(),
  sleep_hours numeric default 7,
  muraja_daily_cap int default 15,     -- batas jumlah unit muraja'ah / hari
  day_off_of_week int default 7,       -- hari khusus muraja'ah tanpa hafalan (7=Minggu)
  slots jsonb                           -- definisi slot & jatah waktunya
);
```

### 5.6 Modul Workout (Fase 9) — lapisan permanen, kategori Kesehatan

```sql
create table workout_routines (        -- template split mingguan (hari ini latihan apa)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  day_of_week int,                     -- 1=Senin ... 7=Minggu
  focus text,                          -- 'Tarik' | 'Dorong' | 'Kaki' | 'Lari' | ...
  is_rest boolean default false,       -- hari istirahat (pemulihan)
  priority_tier text default 'rutin',  -- default Rutin: mengalah saat waktu sempit
  est_duration_min int,                -- estimasi durasi sesi (utk anggaran waktu; jaga singkat)
  time_slot text,                      -- 'pagi' | 'sore' | dll
  created_at timestamptz default now()
);

create table exercises (               -- daftar latihan dalam sebuah hari/focus
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  routine_id uuid references workout_routines(id) on delete cascade,
  name text not null,                  -- 'Pull-up' | 'Dips' | 'Lari'
  metric_type text not null,           -- 'reps' | 'distance' | 'duration'
  target_sets int,
  target_reps int,                     -- utk metric_type 'reps'
  target_distance numeric,             -- km, utk 'distance'
  target_duration_min numeric,         -- menit, utk 'duration'/tahan
  floor_sets int,                      -- lantai = versi kilat hari sibuk
  floor_reps int,
  floor_distance numeric,
  floor_duration_min numeric,
  order_index int
);

create table workout_logs (            -- catatan latihan aktual per tanggal (progresi manual)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  exercise_id uuid references exercises(id) on delete cascade,
  log_date date not null default current_date,
  sets_done int,
  reps_done int,
  distance_done numeric,
  duration_done numeric,
  done boolean default true,
  unique (exercise_id, log_date)
);
```

Progresi bersifat **manual**: user menaikkan `target_*` sendiri saat siap; `workout_logs` menyimpan riwayat untuk grafik progres sederhana. Tidak ada mesin auto-progress (menjaga prinsip tanpa intimidasi).

---

## 6. Aturan Mesin (algoritma — tulis persis, jangan mengarang)

### 6A. Mesin Muraja'ah Berjenjang (spaced repetition)

Sistem tingkat (mirip kotak Leitner). Tiap `hafalan_units` punya `review_stage` & `next_review_date`.

**Tabel interval:**

| review_stage | Interval (hari) |
|---|---|
| 0 | 1 |
| 1 | 3 |
| 2 | 7 |
| 3 | 14 |
| 4 | 30 |

**Saat unit baru selesai dihafal (dari setoran):**
- Buat baris `hafalan_units` dengan `review_stage = 0`, `next_review_date = besok (memorized_date + 1)`.

**Menyusun daftar muraja'ah hari ini (dijalankan tiap app dibuka / awal hari):**
1. Ambil semua `hafalan_units` milik user dengan `next_review_date <= hari_ini`, urutkan by `next_review_date` lalu `memorized_date` (yang paling lama tertunda & paling baru dihafal didahulukan).
2. Terapkan **batas harian** = `user_settings.muraja_daily_cap`. Ambil sejumlah cap teratas. Sisanya **tidak hilang** — otomatis muncul lagi besok karena `next_review_date`-nya sudah lewat (rollover alami).
3. Tampilkan sebagai daftar "Muraja'ah hari ini", ditandai asal (`plan.content_type`) & `unit_ref`.

**Saat user menandai hasil sebuah unit:**
- **Lancar** → `review_stage = min(stage + 1, 4)`; `next_review_date = hari_ini + interval(stage_baru)`.
- **Tersendat/lupa** → `review_stage = 0`; `next_review_date = hari_ini + 1`.
- Catat ke `review_logs` (opsional).

**Aturan hari khusus (Minggu, `day_off_of_week`):**
- Penjadwal **tidak** menaruh setoran hafalan baru di hari itu.
- Muraja'ah tetap berjalan tiap hari (termasuk Minggu); Minggu enak dipakai membereskan yang jatuh tempo.

**Menambahkan hafalan lama (yang sudah dikuasai sebelum pakai app):**
- Saat input massal, user boleh set `review_stage` awal (mis. 3 atau 4) supaya tidak dibanjiri ulangan dari nol. `next_review_date = hari_ini + interval(stage tsb)`.

**Catatan:** Semua jenis hafalan (Qur'an/hadis/matan) memakai mesin & tabel yang sama; daftar harian bisa gabungan lintas-`plan`.

### 6B. Prioritas & Lantai/Atap

Tiap kegiatan harian punya `priority_tier`, `floor_amount`, `target_amount`.

**Tingkat & default cerdas (app mengisi tebakan awal berdasarkan prinsip "menjaga > menambah"; user boleh geser):**
- **Wajib** — ditinggalkan = kehilangan. Default: **muraja'ah**, dan **lantai baca** (Qur'an/hadis).
- **Rutin** — normalnya dikerjakan. Default: **kajian**, **setoran hafalan baru** (paling mudah digeser), dan **workout** (dijaga ringkas, mengalah saat waktu sempit).
- **Bonus** — dikerjakan bila waktu tersisa.

**Perilaku:**
- Hari normal → tampilkan Wajib + Rutin pada `target_amount`.
- Hari sibuk / waktu tidak cukup (lihat 6C) → app turun ke **set lantai**: hanya Wajib pada `floor_amount`, Rutin dikecilkan/ditunda, Bonus disembunyikan.
- **Streak** dihitung aman selama `floor_amount` tercapai (bukan harus target).

### 6C. Anggaran Waktu Harian (fondasi realisme)

Tujuan: memastikan rencana harian benar-benar muat.

**Hitung waktu luang hari-X:**
```
waktu_luang = 24 jam
            − sleep_hours
            − durasi kuliah hari-X (dari courses, sesuai semester aktif & day_of_week,
              dengan menerapkan schedule_exceptions untuk tanggal itu)
            − durasi recurring_events yang berlaku di hari-X
            − durasi events pada tanggal-X
```

**Bandingkan dengan rencana:**
- `total_rencana = Σ est_duration_min` semua kegiatan harian terjadwal hari itu.
- Jika `total_rencana > waktu_luang` → tampilkan **peringatan** dan turunkan ke set lantai (6B) sampai muat.

**Pengecekan per-slot (bukan hanya total):**
- Kelompokkan kegiatan per `time_slot`. Untuk tiap slot, jumlahkan durasinya & bandingkan dengan jatah waktu slot (`user_settings.slots`). Jika satu slot kelebihan muatan (mis. ba'da Maghrib ditumpuk 4 kegiatan padahal 40 menit), **peringatkan slot itu** meski total harian masih muat.

**Interaksi dengan Event (menimpa di tengah jalan):**
- Menambahkan `event` pada suatu tanggal otomatis mengurangi `waktu_luang` tanggal itu → mesin 6B/6C menyesuaikan (turun ke lantai, setoran hafalan baru pertama dikorbankan, muraja'ah dilindungi, estimasi selesai hafalan bergeser).
- Saat event ditambahkan, tampilkan **dampaknya lebih awal** ("Hari itu waktu luang tinggal ±1 jam — rencana rohani akan turun ke set lantai").
- Jika event bentrok dengan jam kuliah → **jangan putuskan otomatis**; tandai bentrokan & minta user memilih (lewati kelas / buat `schedule_exception` / event diprioritaskan).

---

## 7. Urutan Build (fase demi fase)

### FASE 0 — Setup
1. Buat akun gratis: GitHub, Supabase, Vercel.
2. `npm create vite@latest . -- --template react` (di dalam folder ini).
3. Install `@supabase/supabase-js lucide-react`; setup Tailwind + vite-plugin-pwa.
4. Di Supabase: buat project, jalankan SQL Bagian 5.1–5.2 dulu (bagian lain menyusul sesuai fasenya). Salin URL & anon key ke `.env`.
5. Buat `src/supabaseClient.js`.
6. **Tes:** `npm run dev` jalan.

### FASE 1 — Login & Kerangka
1. Login/Daftar (email+password) via Supabase Auth.
2. Layout utama: sidebar (laptop) / bar bawah (HP). Menu: Dashboard, Jadwal, Tugas, Proyek, Kebiasaan, Rohani.
3. **Dashboard "Hari Ini":** kerangka kosong dulu (diisi bertahap).
4. **Tes:** daftar/login/logout; layout responsif.

### FASE 2 — Semester, Jadwal, Tugas, Proyek
1. **Semester:** CRUD; tandai aktif; arsipkan saat lewat `end_date`. Data akademik menempel ke semester aktif.
2. **Jadwal kuliah:** grid mingguan Senin–Minggu, CRUD `courses` (berwarna). Terapkan `schedule_exceptions` (batal/pindah satu sesi per-tanggal).
3. **Item template berulang** (`recurring_events`): komitmen mingguan non-kuliah.
4. **Event** (`events`): kejadian sekali bertanggal, tampil di tampilan hari/kalender; tandai bila bentrok dengan kuliah (belum ada perhitungan waktu; itu Fase 8).
5. **Tugas & Proyek:** CRUD; tugas bisa tertaut course/proyek; filter status & prioritas; urut deadline.
6. **Realtime:** aktifkan `postgres_changes` agar list auto-update.
7. **Tes:** 2 perangkat, ubah di satu, berubah di lain; per-date exception tampil benar; semester berakhir → jadwal berhenti tampil.

### FASE 3 — Kategori & Kebiasaan sederhana
1. **Kategori** (`categories`): CRUD, warna.
2. **Kebiasaan** (`habits`): CRUD dengan kategori; centang harian (`habit_logs`); streak sederhana. (Kolom lantai/atap/slot/durasi disiapkan tapi belum dipakai penuh sampai Fase 8.)
3. **Tes:** centang tersimpan & bertahan.

### FASE 4 — Notifikasi & PWA
1. Konfigurasi `vite-plugin-pwa` (manifest + service worker) → installable.
2. Notification API: izin + pengingat saat jadwal/deadline/kegiatan dekat.
3. **Tes:** app bisa di-install; notifikasi muncul.

### FASE 5 — Deploy (MVP live)
1. Push ke GitHub → hubungkan Vercel → deploy; isi env var.
2. **Tes:** buka URL di HP & laptop, login sama, data sinkron.

### FASE 6 — Modul Rohani dasar
1. **Baca** (`reading_plans`/`reading_logs`): centang + posisi menuju khatam + streak; loop saat khatam.
2. **Kajian** (`kajian_series`/`kajian_logs`): maju 1 sesi/hari; lacak "sesi ke berapa dari total".
3. **Hafalan** (`hafalan_plans`): setoran ber-pace; hitung "setoran hari ini" dari pace + posisi; tampilkan estimasi selesai yang santai bergeser (info saja). Saat setoran ditandai selesai → **buat `hafalan_units`** (masuk kolam muraja'ah, stage 0).
4. Bagian "Rohani" di Dashboard.
5. **Tes:** setoran menambah unit; posisi baca & sesi kajian tersimpan.

### FASE 7 — Mesin Muraja'ah berjenjang
1. Implement algoritma Bagian 6A **persis** (interval, penyusunan daftar, lancar/tersendat, batas harian + rollover, aturan Minggu, input hafalan lama).
2. Layar "Muraja'ah hari ini" + tandai hasil.
3. **Tes:** unit baru muncul tiap hari; yang "lancar" makin jarang; melebihi cap → geser ke besok; Minggu tanpa setoran.

### FASE 8 — Anggaran waktu, prioritas & event pintar
1. `user_settings` (tidur, cap muraja'ah, hari khusus, definisi slot).
2. **Prioritas lantai/atap** (6B) dengan default cerdas; hari sibuk turun ke set lantai; streak berbasis lantai.
3. **Anggaran waktu** (6C): hitung waktu luang dari semester+jadwal+exceptions+recurring+events; total harian **dan** per-slot; peringatan bila lebih.
4. **Event pintar:** menimpa & menghitung ulang; peringatan dampak lebih awal; penanganan bentrok kuliah.
5. **Tes:** tambah event → rencana hari itu turun ke lantai & diperingatkan; slot penuh terdeteksi.

### FASE 9 — Modul Workout
1. **Split mingguan** (`workout_routines`): tetapkan hari ini latihan apa + hari istirahat.
2. **Latihan** (`exercises`): CRUD dengan tipe metrik (reps/distance/duration), target & lantai.
3. **Catat & progres** (`workout_logs`): input latihan aktual per hari; grafik progres sederhana; progresi manual.
4. Terhubung ke anggaran waktu (6C) & lantai/atap (6B): durasi sesi ikut dihitung, hari sibuk turun ke set lantai (versi kilat), streak berbasis lantai.
5. **Tes:** split tampil per hari; hari istirahat kosong; catatan tersimpan; sesi masuk hitungan waktu luang.

---

## 8. Checklist Penerimaan

- [ ] Daftar/login/logout.
- [ ] Semester: buat, aktif, arsip; jadwal berhenti setelah berakhir.
- [ ] Jadwal + pengecualian per-tanggal + item template berulang + event sekali.
- [ ] Tugas/Proyek CRUD & tautan.
- [ ] Kategori + kebiasaan + streak.
- [ ] Baca (khatam progress), kajian (sesi), hafalan (setoran pace, estimasi bergeser).
- [ ] Muraja'ah berjenjang sesuai 6A (termasuk cap + aturan Minggu).
- [ ] Anggaran waktu (total + per-slot) memberi peringatan realistis.
- [ ] Prioritas lantai/atap; hari sibuk turun ke lantai; streak berbasis lantai.
- [ ] Event menimpa & memicu penyesuaian; bentrok kuliah ditandai.
- [ ] Workout: split mingguan + hari istirahat + metrik fleksibel + progres manual; ringkas & masuk anggaran waktu.
- [ ] Sinkron 2 perangkat; PWA installable; notifikasi jalan; online di Vercel; semua gratis.

---

## 9. Fitur Ditunda (Pengembangan Lanjutan — jangan dibangun dulu)

- **#4 Template per hari otomatis** dari kapasitas jadwal (hari padat → kapasitas kecil).
- **#5 Umpan balik realitas:** app memantau tingkat penyelesaian; bila kronis kelebihan muatan, sarankan memangkas pace/kegiatan. Termasuk saran menaikkan pace hafalan saat libur.
- **Penanda rentang libur di tengah semester** (pekan tenang/libur nasional) yang menyesuaikan anggaran waktu.
- **Muraja'ah:** statistik & grafik retensi.

---

## 10. Tips Gratis & Aman

- Supabase free cukup untuk data pribadi; jangan upload file besar. Free tier "pause" setelah ~1 pekan nganggur — cukup klik unpause di dashboard (tak masalah untuk pemakaian rutin).
- Simpan **anon key** di `.env`; tambahkan `.env` ke `.gitignore`. **Jangan** pakai `service_role key` di frontend (RLS yang melindungi data).
- Backup skema SQL (Bagian 5) di repo.

---

*Mulai Fase 0. Kerjakan berurutan. Tes tiap fase sebelum lanjut.*
