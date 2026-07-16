# Git untuk Pemula — Titik Simpan Proyekmu

> Bayangkan Git seperti **titik simpan (checkpoint) di game**.
> Tiap kali kamu "commit", kamu membuat satu titik simpan. Kalau ada file rusak/terhapus,
> kamu bisa kembali ke titik simpan mana pun. Jadi kerjamu tidak akan hilang lagi.

Semua perintah di bawah dijalankan di **Terminal** VSCode (menu: Terminal → New Terminal), di dalam folder proyek ini.

---

## Langkah 1 — Kenalkan dirimu (cukup sekali seumur hidup)
Git ingin tahu siapa yang menyimpan. Ketik ini (ganti dengan nama & email-mu):

```
git config --global user.name "Mufti"
git config --global user.email "ahmadmufti1104@gmail.com"
```

## Langkah 2 — Nyalakan Git di folder ini (cukup sekali per proyek)
```
git init
```
Artinya: "Git, mulai pantau folder ini." Setelah ini Git diam-diam mengawasi setiap perubahan.

## Langkah 3 — Buat daftar "jangan disimpan" (file .gitignore)
Ada file yang TIDAK boleh ikut disimpan/di-upload, terutama kunci rahasia (`.env`) dan folder besar (`node_modules`). Buat file bernama `.gitignore` berisi:

```
node_modules
.env
dist
```

## Langkah 4 — Buat titik simpan pertama
Dua perintah ini akan sering kamu pakai:

```
git add .
git commit -m "Simpanan pertama: dokumen rencana aplikasi"
```

- `git add .` = "siapkan semua perubahan untuk disimpan." (titik `.` artinya semua)
- `git commit -m "..."` = "simpan sekarang, dengan catatan di dalam tanda kutip."

Selamat — kamu baru saja membuat titik simpan pertamamu. 🎉

---

## Sehari-hari: menyimpan lagi setelah bekerja
Setiap kali selesai satu bagian (misal selesai Langkah 2 versi instan), simpan lagi:

```
git add .
git commit -m "Selesai Langkah 2: jadwal & tugas jalan"
```

Tips: tulis catatan (`-m "..."`) yang jelas, seperti judul bab. Nanti mudah mencarinya.

## Melihat semua titik simpan
```
git log --oneline
```
Muncul daftar titik simpanmu, terbaru di atas.

## Kalau ada file terhapus / ingin dikembalikan
Untuk mengembalikan satu file ke kondisi titik simpan terakhir:
```
git restore NAMA_FILE
```
Contoh: `git restore SPEC.md`

Untuk mengembalikan SEMUA file yang belum di-commit ke kondisi terakhir:
```
git restore .
```

---

## (Opsional, nanti) Cadangan online di GitHub
Titik simpan di atas ada di komputermu. Supaya ada cadangan di internet (dan bisa dibuka dari perangkat lain), kamu bisa unggah ke **GitHub**. Ini juga langkah yang dibutuhkan sebelum deploy ke Vercel (lihat `PROMPT-VERSI-INSTAN.md` Langkah 6). Kita bahas saat kamu sudah sampai tahap itu.

---

## Ringkasan yang perlu diingat
| Mau apa | Ketik |
|---|---|
| Simpan kemajuan | `git add .` lalu `git commit -m "catatan"` |
| Lihat riwayat | `git log --oneline` |
| Kembalikan file terhapus | `git restore NAMA_FILE` |

Kebiasaan baik: **commit tiap kali selesai satu langkah.** Sedikit-sedikit, sering. 🙂
