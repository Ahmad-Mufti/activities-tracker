# Spesifikasi Aplikasi "KampusKu" — Organizer Kegiatan Mahasiswa

> Instruksi lengkap pembuatan aplikasi. Kerjakan **berurutan per fase** (Bagian 7). Jangan lompat.
> Selesaikan & minta user menguji satu fase sebelum lanjut.
>
> **REVISI 20 Juli 2026** (hasil diskusi dengan user; Fase 0–7 sudah live): Dashboard + jadwal sholat jadi jantung app (6D), quick-capture inbox (5.7), notifikasi push sungguhan, beban mingguan proyek & durasi tugas masuk anggaran waktu (6C), interval muraja'ah diperpanjang (6A), aturan kebiasaan aspirasional (6B), modul workout split ditunda (Bagian 9). Urutan fase baru: lihat Bagian 7.

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
- **Workout** (kategori Kesehatan, lapisan permanen) = **kebiasaan sederhana** di tabel `habits` (mis. "10 pull-up, 10 dips, 10 squat sebelum mandi" — Rutin; "Jogging" — Bonus karena kebiasaan baru). Modul split mingguan lengkap (skema 5.6) **ditunda** — bangun hanya bila latihan user berkembang melampaui kebiasaan sederhana.
- **Kategori** = label pada kebiasaan/kegiatan (Rohani, Akademik, Kesehatan, dll).
- **Prioritas (lantai/atap)** = tiap kegiatan harian punya *lantai* (minimal, penyelamat hari sibuk) & *target* (kondisi normal), serta tingkat **Wajib / Rutin / Bonus** (Bagian 6B).
- **Anggaran waktu** = tiap kegiatan punya estimasi durasi & jangkar waktu (slot); app mengecek total harian **dan per-slot** terhadap waktu luang (Bagian 6C).
- **Beban mingguan proyek** = proyek besar (mis. website kampus dari organisasi) punya `weekly_hours`: jam per minggu yang mengurangi waktu luang meski jadwal detailnya belum jelas — pemodelan jujur untuk komitmen tak terprediksi. Yang mengikat user adalah *proyeknya* (punya kondisi selesai), bukan keanggotaan organisasinya.
- **Inbox (quick-capture)** = tombol "+" global untuk mencatat apa pun dalam ≤5 detik tanpa memilah; dipilah nanti jadi tugas/event/kebiasaan — memisahkan *menangkap* dari *memilah* (prinsip GTD).
- **Jadwal sholat** = jangkar harian user (dicek tiap bangun tidur). Tampil paling atas Dashboard sebagai pintu masuk app (habit stacking); jam sholat asli per hari juga menjadi **batas slot dinamis** (Bagian 6D).

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
  est_duration_min int,                -- boleh null → pakai default per konteks (6C); JANGAN jadikan input wajib
  planned_for date,                    -- "kerjakan hari ini" (ala Ivy Lee); masuk anggaran waktu tanggal tsb
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  description text,
  deadline timestamptz,
  status text default 'active',        -- active | done | archived
  weekly_hours numeric,                -- beban jam/minggu; mengurangi waktu luang (6C). Utk proyek "Website Kampus" dll
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
  review_stage int default 0,          -- 0..6 (lihat Bagian 6A)
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

### 5.5 Pengaturan pengguna (Fase 8 & 11)

```sql
create table user_settings (
  user_id uuid primary key references auth.users default auth.uid(),
  sleep_hours numeric default 7,
  muraja_daily_cap int default 15,     -- batas jumlah unit muraja'ah / hari
  day_off_of_week int default 7,       -- hari khusus muraja'ah tanpa hafalan (7=Minggu)
  slots jsonb,                          -- override manual; default batas slot dihitung dari jam sholat (6D)
  latitude numeric,                    -- lokasi utk hitung jam sholat lokal (adhan-js, offline)
  longitude numeric,
  calc_method text default 'KEMENAG',  -- metode perhitungan jam sholat (default Indonesia)
  last_review_at timestamptz           -- kapan weekly review terakhir (Fase 12)
);
```

### 5.6 Modul Workout — **DITUNDA** (lihat Bagian 9; jangan bangun tabel-tabel ini dulu)

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

### 5.7 Inbox — quick-capture (Fase 9)

```sql
create table inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  content text not null,
  processed boolean default false,     -- sudah dipilah (jadi tugas/event/kebiasaan/dihapus)
  created_at timestamptz default now()
);
```

(Jangan lupa RLS dengan pola di awal Bagian 5.)

### 5.8 Migrasi untuk DB yang sudah berjalan

DB sudah live sejak revisi ini — jalankan **sekali** di Supabase SQL Editor:

```sql
alter table projects add column if not exists weekly_hours numeric;
alter table tasks add column if not exists est_duration_min int;
alter table tasks add column if not exists planned_for date;
alter table user_settings add column if not exists latitude numeric;
alter table user_settings add column if not exists longitude numeric;
alter table user_settings add column if not exists calc_method text default 'KEMENAG';
alter table user_settings add column if not exists last_review_at timestamptz;
-- lalu buat tabel inbox_items (5.7) + RLS-nya
```

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
| 5 | 60 |
| 6 | 120 |

> Stage 5–6 (revisi Jul 2026): tanpa interval panjang, unit matang selamanya makan ~1/30 jatah cap per hari — dengan cap 15/hari sistem jenuh di ±400 unit. Interval yang terus tumbuh (cara Anki) menunda kejenuhan itu. Unit lama yang sudah ada tetap valid; tidak perlu migrasi data.

**Saat unit baru selesai dihafal (dari setoran):**
- Buat baris `hafalan_units` dengan `review_stage = 0`, `next_review_date = besok (memorized_date + 1)`.

**Menyusun daftar muraja'ah hari ini (dijalankan tiap app dibuka / awal hari):**
1. Ambil semua `hafalan_units` milik user dengan `next_review_date <= hari_ini`, urutkan by `next_review_date` lalu `memorized_date` (yang paling lama tertunda & paling baru dihafal didahulukan).
2. Terapkan **batas harian** = `user_settings.muraja_daily_cap`. Ambil sejumlah cap teratas. Sisanya **tidak hilang** — otomatis muncul lagi besok karena `next_review_date`-nya sudah lewat (rollover alami).
3. Tampilkan sebagai daftar "Muraja'ah hari ini", ditandai asal (`plan.content_type`) & `unit_ref`.

**Saat user menandai hasil sebuah unit:**
- **Lancar** → `review_stage = min(stage + 1, 6)`; `next_review_date = hari_ini + interval(stage_baru)`.
- **Tersendat/lupa** → `review_stage = 0`; `next_review_date = hari_ini + 1`.
- Catat ke `review_logs` (opsional).

**Aturan hari khusus (Minggu, `day_off_of_week`):**
- Penjadwal **tidak** menaruh setoran hafalan baru di hari itu.
- Muraja'ah tetap berjalan tiap hari (termasuk Minggu); Minggu enak dipakai membereskan yang jatuh tempo.

**Menambahkan hafalan lama (yang sudah dikuasai sebelum pakai app):**
- Saat input massal, user boleh set `review_stage` awal (mis. 4 atau 5) supaya tidak dibanjiri ulangan dari nol. `next_review_date = hari_ini + interval(stage tsb)`.

**Catatan:** Semua jenis hafalan (Qur'an/hadis/matan) memakai mesin & tabel yang sama; daftar harian bisa gabungan lintas-`plan`.

### 6B. Prioritas & Lantai/Atap

Tiap kegiatan harian punya `priority_tier`, `floor_amount`, `target_amount`.

**Tingkat & default cerdas (app mengisi tebakan awal berdasarkan prinsip "menjaga > menambah"; user boleh geser):**
- **Wajib** — ditinggalkan = kehilangan. Default: **muraja'ah**, dan **lantai baca** (Qur'an/hadis).
- **Rutin** — normalnya dikerjakan. Default: **kajian**, **setoran hafalan baru** (paling mudah digeser), dan **workout** (dijaga ringkas, mengalah saat waktu sempit).
- **Bonus** — dikerjakan bila waktu tersisa.

**Aturan kebiasaan baru (aspirasional):** kebiasaan yang belum terbukti berjalan (mis. jogging yang baru mulai, rencana baca baru) masuk sebagai **Bonus** dulu — naik ke Rutin/Wajib setelah bertahan ±14 hari dengan lantai tercapai. "Menjaga > menambah" berlaku juga saat *membangun* kebiasaan: jangan biarkan default Wajib membuat minggu pertama terasa gagal. Bolong 1–2 hari pada kebiasaan yang sudah jalan (mis. kajian) bukan kegagalan — cukup lanjut dari posisi terakhir, tanpa penalti.

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
            − beban_proyek_hari_X (lihat di bawah)
```

**Beban mingguan proyek (anti hitung-ganda):** untuk tiap proyek aktif ber-`weekly_hours`:
1. `sisa_beban_minggu = weekly_hours − Σ durasi events & recurring_events ber-project_id proyek itu pada pekan berjalan` (minimal 0). Event yang sudah tercatat **memakan** jatah beban, bukan menambah di atasnya — hari yang sama tidak boleh terpotong dua kali.
2. `beban_proyek_hari_X = sisa_beban_minggu ÷ jumlah hari tersisa pekan itu` (dibagi rata).
3. `weekly_hours` adalah tebakan user — dicek ulang tiap weekly review (Fase 12).

**Bandingkan dengan rencana:**
- `total_rencana = Σ est_duration_min` semua kegiatan harian terjadwal hari itu, **termasuk tugas** dengan `planned_for = hari itu` atau `due_date ≤ besok`.
- **Durasi tugas yang null memakai default per konteks:** nilai `est_duration_min` terakhir dari tugas se-course / se-proyek / se-kategori. UI memakai chip cepat (15 / 30 / 60 / 120 menit) — user hanya mengoreksi saat default meleset, **tidak pernah wajib mengetik** (user tipe menghitung-di-kepala tapi lupa mengisi).
- Jika `total_rencana > waktu_luang` → tampilkan **peringatan** dan turunkan ke set lantai (6B) sampai muat.

**Pengecekan per-slot (bukan hanya total):**
- Kelompokkan kegiatan per `time_slot`. Untuk tiap slot, jumlahkan durasinya & bandingkan dengan jatah waktu slot. Jatah slot **default dihitung dinamis dari jam sholat hari itu** (Bagian 6D); `user_settings.slots` hanya override manual. Jika satu slot kelebihan muatan (mis. ba'da Maghrib ditumpuk 4 kegiatan padahal jarak Maghrib–Isya hari itu cuma 70 menit), **peringatkan slot itu** meski total harian masih muat.

**Interaksi dengan Event (menimpa di tengah jalan):**
- Menambahkan `event` pada suatu tanggal otomatis mengurangi `waktu_luang` tanggal itu → mesin 6B/6C menyesuaikan (turun ke lantai, setoran hafalan baru pertama dikorbankan, muraja'ah dilindungi, estimasi selesai hafalan bergeser).
- Saat event ditambahkan, tampilkan **dampaknya lebih awal** ("Hari itu waktu luang tinggal ±1 jam — rencana rohani akan turun ke set lantai").
- Jika event bentrok dengan jam kuliah → **jangan putuskan otomatis**; tandai bentrokan & minta user memilih (lewati kelas / buat `schedule_exception` / event diprioritaskan).

### 6D. Jadwal Sholat & Slot Dinamis (revisi Jul 2026)

Jadwal sholat adalah jangkar harian user — kebiasaan nyata yang sudah jalan: **cek jadwal sholat tiap bangun tidur**. App menumpang kebiasaan itu (habit stacking): cek jadwal sholat = buka Dashboard = lihat rencana hari ini. Ini jawaban utama untuk masalah "app jarang dibuka".

- **Perhitungan lokal** dengan library `adhan` (adhan-js): tanpa API, tanpa server, jalan offline, gratis. Input sekali di Pengaturan: `latitude`, `longitude`, `calc_method` (default **KEMENAG** untuk Indonesia).
- **Tampilan:** jadwal sholat hari ini di **posisi teratas Dashboard**, dengan penanda waktu sholat berikutnya.
- **Batas slot dinamis** (dipakai pengecekan per-slot 6C), default:

| Slot | Batas |
|---|---|
| bada_subuh | Subuh → Syuruq |
| pagi | Syuruq → Dzuhur |
| bada_dzuhur | Dzuhur → Ashar |
| sore | Ashar → Maghrib |
| bada_maghrib | Maghrib → Isya |
| malam | Isya → jam tidur (dihitung dari `sleep_hours`) |

- Durasi kuliah/event yang jatuh di dalam sebuah slot mengurangi jatah slot itu.
- `user_settings.slots` (jsonb) boleh meng-override batas ini secara manual; tanpa override, semuanya otomatis — user tidak perlu setting apa pun selain lokasi.

---

## 7. Urutan Build (fase demi fase)

> **Status (revisi 20 Jul 2026):** Fase 0–7 sudah dibangun & live di Vercel. Lanjutkan dari **Fase 8 versi revisi** di bawah. Fase "Anggaran waktu" lama menjadi Fase 11; modul Workout split dipindah ke Bagian 9 (Ditunda). Sebelum mulai Fase 8, jalankan migrasi 5.8.

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
4. **Event** (`events`): kejadian sekali bertanggal, tampil di tampilan hari/kalender; tandai bila bentrok dengan kuliah (belum ada perhitungan waktu; itu Fase 11).
5. **Tugas & Proyek:** CRUD; tugas bisa tertaut course/proyek; filter status & prioritas; urut deadline.
6. **Realtime:** aktifkan `postgres_changes` agar list auto-update.
7. **Tes:** 2 perangkat, ubah di satu, berubah di lain; per-date exception tampil benar; semester berakhir → jadwal berhenti tampil.

### FASE 3 — Kategori & Kebiasaan sederhana
1. **Kategori** (`categories`): CRUD, warna.
2. **Kebiasaan** (`habits`): CRUD dengan kategori; centang harian (`habit_logs`); streak sederhana. (Kolom lantai/atap/slot/durasi disiapkan tapi belum dipakai penuh sampai Fase 11.)
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

### FASE 8 (revisi) — Dashboard "Hari Ini" + Jadwal Sholat

> Tujuan fase ini: membuat app **layak dibuka tiap pagi**. Kecepatan-paham > kelengkapan.

1. Integrasi `adhan` (Bagian 6D): jadwal sholat hari ini tampil **paling atas** Dashboard + penanda sholat berikutnya; setting lokasi & metode (default KEMENAG) di Pengaturan.
2. Dashboard menjawab "sekarang ngapain?" dalam 5 detik tanpa klik: muraja'ah hari ini (jumlah + daftar), setoran hafalan hari ini, kebiasaan belum dicentang, tugas `planned_for` hari ini + deadline dekat, kuliah & event hari ini.
3. Batas slot dinamis dari jam sholat (6D) — cukup ditampilkan dulu; penegakan penuh di Fase 11.
4. **Tes:** buka app ba'da subuh → semua info harian terlihat tanpa navigasi.

### FASE 9 (revisi) — Quick-capture (Inbox)
1. Tombol "+" global di semua layar → simpan ke `inbox_items` (5.7) dalam ≤5 detik.
2. Layar Inbox: pilah item jadi tugas / event / kebiasaan, atau hapus; tandai `processed`.
3. Badge jumlah item belum dipilah di sidebar / bar bawah.
4. **Tes:** dari layar mana pun, ide tercatat ≤5 detik; hasil pilahan muncul di tempat yang benar.

### FASE 10 — Notifikasi Push sungguhan
1. Web Push (VAPID) + Supabase Edge Functions + penjadwal (cron) — pengingat bunyi **walau app tertutup**. (Notification API lama hanya bunyi saat app terbuka — tidak cukup untuk user yang belum terbiasa membuka app.)
2. Pengingat utama: muraja'ah pagi, tugas `planned_for` & deadline, event hari ini, weekly review Minggu pagi.
3. Notifikasi in-app lama tetap sebagai fallback. Catatan: iOS butuh PWA ter-install dari Safari & punya batasan.
4. **Tes:** HP terkunci tetap menerima pengingat.

### FASE 11 — Anggaran waktu, prioritas & event pintar (6B + 6C penuh)
1. `user_settings` lengkap; `weekly_hours` di proyek (buat proyek "Website Kampus" sungguhan); durasi tugas dengan default per konteks + chip (6C).
2. Prioritas lantai/atap (6B) termasuk aturan kebiasaan aspirasional (mulai Bonus); streak berbasis lantai.
3. Anggaran waktu (6C): total harian + per-slot dinamis + beban mingguan proyek (anti hitung-ganda); peringatan bila lebih.
4. Event pintar: dampak ditampilkan lebih awal; bentrok kuliah ditandai & user memilih.
5. **Tes:** tambah event ber-`project_id` → beban proyek pekan itu berkurang (tidak dobel); hari sibuk turun ke lantai; slot penuh terdeteksi.

### FASE 12 — Weekly Review (Minggu, ±5 menit)
1. Layar review dipicu hari Minggu (`day_off_of_week` — sinergi: Minggu memang hari beres-beres muraja'ah): bersihkan inbox → `weekly_hours` masih akurat? → pace hafalan realistis? → event pekan depan?
2. Simpan `last_review_at`; tampilkan "terakhir review X hari lalu" **tanpa nada menghukum**; pengingat via push Minggu pagi.
3. **Tes:** alur review selesai ≤5 menit; ubah `weekly_hours` → anggaran waktu langsung menyesuaikan.

**Workout — tanpa fase build:** cukup tambahkan dua kebiasaan lewat modul Kebiasaan yang sudah ada: "10 pull-up, 10 dips, 10 squat (sebelum mandi)" — Rutin, menempel kebiasaan lama; dan "Jogging" — **Bonus** (kebiasaan baru, aturan 6B). Modul split lengkap → Bagian 9 (Ditunda).

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
- [ ] Jadwal sholat tampil paling atas Dashboard; batas slot dinamis dari jam sholat asli.
- [ ] Quick-capture: catat ≤5 detik dari layar mana pun; inbox terpilah jadi tugas/event/kebiasaan.
- [ ] Push sungguhan: pengingat masuk saat app tertutup / HP terkunci.
- [ ] Beban mingguan proyek mengurangi waktu luang tanpa hitung-ganda dengan event ber-`project_id`.
- [ ] Weekly review Minggu selesai ≤5 menit; `weekly_hours` terkalibrasi ulang.
- [ ] Workout sebagai 2 kebiasaan sederhana (10-10-10 Rutin; jogging Bonus) — tanpa modul khusus.
- [ ] Sinkron 2 perangkat; PWA installable; notifikasi jalan; online di Vercel; semua gratis.

---

## 9. Fitur Ditunda (Pengembangan Lanjutan — jangan dibangun dulu)

- **#4 Template per hari otomatis** dari kapasitas jadwal (hari padat → kapasitas kecil).
- **#5 Umpan balik realitas:** app memantau tingkat penyelesaian; bila kronis kelebihan muatan, sarankan memangkas pace/kegiatan. Termasuk saran menaikkan pace hafalan saat libur.
- **Penanda rentang libur di tengah semester** (pekan tenang/libur nasional) yang menyesuaikan anggaran waktu.
- **Muraja'ah:** statistik & grafik retensi.
- **Modul Workout split mingguan** (skema 5.6: `workout_routines` / `exercises` / `workout_logs`) — bangun hanya bila latihan user berkembang melampaui dua kebiasaan sederhana yang sekarang.

---

## 10. Tips Gratis & Aman

- Supabase free cukup untuk data pribadi; jangan upload file besar. Free tier "pause" setelah ~1 pekan nganggur — cukup klik unpause di dashboard (tak masalah untuk pemakaian rutin).
- Simpan **anon key** di `.env`; tambahkan `.env` ke `.gitignore`. **Jangan** pakai `service_role key` di frontend (RLS yang melindungi data).
- Backup skema SQL (Bagian 5) di repo.

---

*Mulai Fase 0. Kerjakan berurutan. Tes tiap fase sebelum lanjut.*
