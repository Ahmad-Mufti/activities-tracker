-- ============================================================================
-- Fase 10 — Penjadwal Notifikasi Push Otomatis (pg_cron + pg_net)
-- ============================================================================
-- Jalankan SEKALI di Supabase Dashboard -> SQL Editor.
-- Inilah yang membuat pengingat DATANG SENDIRI walau app tertutup. Tanpa ini,
-- Edge Function `send-push-reminders` hanya jalan bila dipicu manual.
--
-- Fungsi ini dideploy `--no-verify-jwt`, jadi cron memanggilnya TANPA kunci
-- apa pun (sudah dites: HTTP 200). Aman disimpan di repo — tak ada rahasia.
--
-- ZONA WAKTU: pg_cron memakai UTC; app ini untuk WIB (UTC+7).
--   jam_UTC = jam_WIB - 7   (kalau negatif: +24, mundur 1 hari)
--   contoh: 05:00 WIB = 22:00 UTC
-- ============================================================================

-- 1) Aktifkan ekstensi (aman diulang) ----------------------------------------
--    Kalau baris ini error "permission denied", aktifkan lewat
--    Dashboard -> Database -> Extensions (cari pg_cron & pg_net, nyalakan).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Hapus jadwal lama kalau sudah pernah dibuat (biar file ini bisa diulang) -
--    Termasuk nama-nama lama dari percobaan terdahulu, supaya tak ada duplikat.
select cron.unschedule(jobid)
from cron.job
where jobname in (
  'push-digest-pagi', 'push-deadline-cek',       -- nama sekarang
  'push-morning-digest', 'push-deadline-check'   -- nama lama (percobaan terdahulu)
);

-- 3) Ringkasan pagi: muraja'ah, tugas hari ini, event, + nudge review Minggu --
--    05:00 WIB tiap hari  =  22:00 UTC
select cron.schedule(
  'push-digest-pagi',
  '0 22 * * *',
  $$
  select net.http_post(
    url     := 'https://tnvmyiqgjunguvpmysfr.supabase.co/functions/v1/send-push-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{"job": "digest"}'::jsonb
  );
  $$
);

-- 4) Cek deadline tugas: tiap 30 menit, hanya jam bangun (05:00-22:59 WIB) ----
--    supaya tak mengganggu tengah malam.
--    UTC 22-23 & 00-15  =  WIB 05:00-22:59
select cron.schedule(
  'push-deadline-cek',
  '*/30 0-15,22-23 * * *',
  $$
  select net.http_post(
    url     := 'https://tnvmyiqgjunguvpmysfr.supabase.co/functions/v1/send-push-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{"job": "deadline"}'::jsonb
  );
  $$
);

-- ============================================================================
-- CEK SETELAH DIJALANKAN
-- ============================================================================
-- Daftar jadwal aktif:
--   select jobname, schedule, active from cron.job;
--
-- Riwayat eksekusi + status HTTP (untuk memastikan cron benar memanggil fungsi):
--   select * from cron.job_run_details order by start_time desc limit 20;
--
-- Hasil balasan HTTP dari pg_net (status_code harus 200):
--   select id, status_code, content from net._http_response order by id desc limit 20;
-- ============================================================================
