# CLAUDE.md — Panduan untuk Claude di VSCode

File ini otomatis dibaca sebagai konteks. **Baca `SPEC.md` untuk spesifikasi lengkap sebelum menulis kode.**

## Ringkasan Proyek
Aplikasi web "KampusKu": organizer mahasiswa dua lapisan.
- **Akademik (sementara, per-semester):** jadwal kuliah, tugas, proyek. Terikat Semester (tanggal mulai–berakhir), diarsipkan saat berakhir.
- **Rohani/pribadi (permanen):** baca (Qur'an/hadis menuju khatam), kajian (course program luar), hafalan (setoran ber-pace), muraja'ah (spaced repetition berjenjang), kebiasaan, workout (kebiasaan sederhana; modul split ditunda).
PWA, real-time sync antar perangkat, solo, gratis total.

**Revisi 20 Jul 2026:** Dashboard + jadwal sholat (adhan-js, jangkar bangun tidur user) = jantung app; quick-capture inbox; notifikasi push sungguhan; beban mingguan proyek (`weekly_hours` — proyek "Website Kampus" dari organisasi) & durasi tugas masuk anggaran waktu; interval muraja'ah 7 stage. Detail di catatan revisi atas `SPEC.md`.

## Tech Stack (jangan diganti tanpa diminta)
- React + Vite
- Tailwind CSS
- Supabase (Postgres DB + Auth + Realtime) — dipilih karena user paham SQL/MySQL
- Vercel (hosting)
- vite-plugin-pwa (PWA)
- lucide-react (ikon)

## Prinsip Desain (ruh aplikasi — patuhi di setiap fitur)
1. **Menjaga > menambah.** Muraja'ah & nyala baca = pokok; setoran hafalan baru = paling lentur (pertama dikorbankan saat sibuk).
2. **Tanpa deadline mengintimidasi.** Hafalan digerakkan *pace* harian, bukan tenggat. Estimasi selesai hanya info yang bergeser santai.
3. **Realistis, bukan angan-angan.** Anggaran waktu (SPEC 6C) menjaga rencana harian muat; hari sibuk turun ke "set lantai".
4. **Tidak menghukum.** Absen tak menumpuk beban / tak memutus streak selama "lantai" terpenuhi.

## Aturan Kerja (PENTING)
1. **Kerjakan fase demi fase** sesuai urutan di `SPEC.md` Bagian 7 (Fase 0 → 12; Fase 0–7 sudah live). Jangan lompat fase.
2. **Selesaikan & minta user menguji satu fase** sebelum lanjut.
   - Saat sebuah fase selesai & lolos tes: update checklist Status Progres di bawah, lalu **ingatkan user untuk memulai sesi/percakapan BARU** untuk fase berikutnya (konteks segar, tidak terbawa keputusan lama). Jangan lanjut fase berikutnya di sesi yang sama.
3. **Jangan ubah skema database** (`SPEC.md` Bagian 5) tanpa persetujuan user.
4. **Aturan mesin di `SPEC.md` Bagian 6 (muraja'ah, prioritas, anggaran waktu) ditulis persis — implementasikan apa adanya, jangan mengarang logika sendiri.**
5. Semua akses data lewat `src/supabaseClient.js`.
6. Gunakan Supabase Realtime (`postgres_changes`) untuk fitur yang butuh sinkronisasi.
7. Komponen **responsif** (HP & laptop) dengan Tailwind.
8. Hanya layanan **tier gratis**.
9. Fitur di `SPEC.md` Bagian 9 (Ditunda) **jangan dibangun dulu**.

## Keamanan
- Kunci Supabase di `.env`, jangan hardcode. Pastikan `.env` ada di `.gitignore`.
- Frontend hanya pakai **anon key**, JANGAN `service_role key`.

## Status Progres
- [x] Fase 0 — Setup
- [x] Fase 1 — Login & Kerangka
- [x] Fase 2 — Semester, Jadwal, Tugas, Proyek
- [x] Fase 3 — Kategori & Kebiasaan sederhana
- [x] Fase 4 — Notifikasi in-app & PWA
- [x] Fase 5 — Deploy (MVP live)
- [x] Fase 6 — Modul Rohani dasar (baca, kajian, hafalan)
- [x] Fase 7 — Mesin Muraja'ah berjenjang
- [x] Fase 8 — Dashboard "Hari Ini" + Jadwal Sholat
- [ ] Fase 9 — Quick-capture (Inbox) *(mulai dari sini)*
- [ ] Fase 10 — Notifikasi Push sungguhan
- [ ] Fase 11 — Anggaran waktu, prioritas & event pintar
- [ ] Fase 12 — Weekly Review
- ~~Modul Workout~~ → 2 kebiasaan sederhana saja; modul split masuk Bagian 9 (Ditunda)

> Update checklist ini setiap kali sebuah fase selesai & lolos tes.
