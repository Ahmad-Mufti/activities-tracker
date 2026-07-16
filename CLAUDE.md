# CLAUDE.md — Panduan untuk Claude di VSCode

File ini otomatis dibaca sebagai konteks. **Baca `SPEC.md` untuk spesifikasi lengkap sebelum menulis kode.**

## Ringkasan Proyek
Aplikasi web "KampusKu": organizer mahasiswa dua lapisan.
- **Akademik (sementara, per-semester):** jadwal kuliah, tugas, proyek. Terikat Semester (tanggal mulai–berakhir), diarsipkan saat berakhir.
- **Rohani/pribadi (permanen):** baca (Qur'an/hadis menuju khatam), kajian (course program luar), hafalan (setoran ber-pace), muraja'ah (spaced repetition berjenjang), kebiasaan, workout (split mingguan, dijaga ringkas).
PWA, real-time sync antar perangkat, solo, gratis total.

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
1. **Kerjakan fase demi fase** sesuai urutan di `SPEC.md` Bagian 7 (Fase 0 → 9). Jangan lompat fase.
2. **Selesaikan & minta user menguji satu fase** sebelum lanjut.
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
- [ ] Fase 0 — Setup
- [ ] Fase 1 — Login & Kerangka
- [ ] Fase 2 — Semester, Jadwal, Tugas, Proyek
- [ ] Fase 3 — Kategori & Kebiasaan sederhana
- [ ] Fase 4 — Notifikasi & PWA
- [ ] Fase 5 — Deploy (MVP live)
- [ ] Fase 6 — Modul Rohani dasar (baca, kajian, hafalan)
- [ ] Fase 7 — Mesin Muraja'ah berjenjang
- [ ] Fase 8 — Anggaran waktu, prioritas & event pintar
- [ ] Fase 9 — Modul Workout (split mingguan, ringkas)

> Update checklist ini setiap kali sebuah fase selesai & lolos tes.
