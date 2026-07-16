# Belajar Ngoding Lewat Aplikasimu — Panduan Super Sederhana

> Tujuan panduan ini: kamu paham **cara berpikir seorang programmer**, tanpa harus jadi ahli dulu.
> Ditulis sesederhana mungkin. Kalau ada kata sulit, selalu ada contoh sehari-hari.

---

## 1. Programmer itu seperti apa?

Bayangkan seorang **koki**. Koki tidak memasak semua hal sekaligus. Ia punya banyak **resep kecil**: satu resep untuk menggoreng telur, satu untuk membuat nasi, satu untuk menyeduh teh. Kalau digabung, jadilah satu hidangan lengkap.

Programmer juga begitu. Ia tidak membuat "aplikasi" dalam satu kali kerja. Ia membuat banyak **mesin kecil**, masing-masing mengerjakan satu tugas. Kalau digabung, jadilah aplikasi.

**Berpikir seperti programmer = terbiasa memecah satu pekerjaan besar menjadi mesin-mesin kecil.**

---

## 2. Apa itu "fungsi"? (mesin kecil itu)

Dalam ngoding, "mesin kecil" itu namanya **fungsi** (function).

Cara paling gampang membayangkannya: **mesin jus**.

```
   🍊 buah masuk   →   [ MESIN JUS ]   →   🥤 jus keluar
   (MASUKAN)          (DIKERJAKAN)        (KELUARAN)
```

Setiap fungsi selalu punya 3 bagian ini:

- **Masukan** — apa yang kamu berikan ke mesin. (buah)
- **Dikerjakan** — langkah-langkah di dalam mesin. (diblender)
- **Keluaran** — hasil yang keluar. (jus)

Kalau kamu bisa menyebutkan 3 bagian ini untuk sebuah fungsi, **berarti kamu sudah paham fungsi itu.** Itu saja rahasianya.

---

## 3. Mesin-mesin kecil di dalam aplikasimu

Yuk kita bedah beberapa "mesin" penting di aplikasi KampusKu-mu. Coba baca tiap kotak dan lihat pola **Masukan → Dikerjakan → Keluaran**-nya.

### Mesin A — "Setoran hafalan hari ini"
Kamu ingin tahu: hari ini aku harus menghafal bagian yang mana?

- **Masukan:** posisi terakhir hafalanmu (misal sudah sampai baris ke-10) + kecepatanmu (misal 2 baris/hari).
- **Dikerjakan:** ambil posisi terakhir, tambah sesuai kecepatan.
- **Keluaran:** "Hari ini hafalkan baris ke-11 dan ke-12."

Sama seperti kamu membaca buku dengan pembatas halaman: mesin ini cuma melihat pembatasmu ada di mana, lalu berkata "lanjut dari sini".

### Mesin B — "Muraja'ah hari ini" (mengulang hafalan)
Kamu ingin tahu: hari ini aku harus mengulang bagian yang mana biar tidak lupa?

- **Masukan:** daftar semua bagian yang sudah kamu hafal, masing-masing punya "tanggal harus diulang".
- **Dikerjakan:** pilih yang tanggal ulangnya sudah tiba (atau lewat), urutkan, ambil secukupnya (biar tidak kebanyakan).
- **Keluaran:** daftar "Hari ini ulang bagian ini, ini, dan ini."

Mirip kotak surat: mesin ini cuma mengambil surat yang **hari ini waktunya dibaca**, sisanya dibiarkan dulu.

### Mesin C — "Naik/turun tingkat" (biar ulangannya makin jarang)
Setelah kamu mengulang satu bagian, mesin memutuskan kapan bagian itu perlu diulang lagi.

- **Masukan:** hasil ulanganmu (lancar / tersendat) + tingkat bagian itu sekarang.
- **Dikerjakan:**
  - kalau **lancar** → naik satu tingkat → jarak ulang berikutnya jadi lebih lama (1 → 3 → 7 → 14 → 30 hari).
  - kalau **tersendat** → balik ke tingkat awal → besok diulang lagi.
- **Keluaran:** tingkat baru + tanggal ulang berikutnya.

Seperti tangga: makin sering kamu lancar, makin naik, dan makin santai jadwalnya. Kalau lupa, turun lagi. Adil, kan?

### Mesin D — "Menghitung streak" (berapa hari berturut-turut)
- **Masukan:** catatan hari-hari kamu mencentang sebuah kebiasaan.
- **Dikerjakan:** hitung mundur dari hari ini, selama tiap hari ada centang, terus tambah.
- **Keluaran:** angka, misal "7 hari berturut-turut 🔥".

### Mesin E — "Progres baca menuju khatam"
- **Masukan:** posisi bacaanmu + berapa halaman kamu baca hari ini.
- **Dikerjakan:** tambahkan; kalau sudah sampai halaman terakhir → tandai "khatam!" lalu mulai lagi dari awal.
- **Keluaran:** posisi baru + berapa persen menuju khatam.

> **Latihan:** ambil satu mesin di atas, tutup penjelasannya, lalu coba sebutkan sendiri **Masukan, Dikerjakan, Keluaran**-nya. Kalau bisa, kamu sudah paham. 🎉

---

## 4. Cara belajar setiap kali AI membuat kode

Setiap kali AI (Claude di VSCode) selesai membuat sebuah fungsi, **jangan langsung lanjut.** Tempel prompt di bawah ini supaya AI menjelaskannya dengan cara yang gampang.

### 🔖 Prompt Penjelas (salin-tempel ke AI)
```
Tolong jelaskan fungsi yang barusan kamu buat, untuk orang yang baru belajar ngoding. Pakai bahasa sangat sederhana. Jawab dengan urutan ini:
1. Fungsi ini gunanya buat apa? (satu kalimat)
2. MASUKAN: apa yang masuk ke fungsi ini?
3. DIKERJAKAN: langkah-langkahnya apa saja? (bahasa manusia, bukan istilah teknis)
4. KELUARAN: apa hasil yang keluar?
5. Beri satu contoh nyata: kalau masukannya X, keluarannya jadi apa?
6. Kalau saya ubah satu bagian, apa yang berubah?
Hindari kata-kata rumit. Kalau terpaksa memakai istilah teknis, jelaskan dengan contoh sehari-hari.
```

Kalau kamu rutin melakukan ini, tanpa sadar kamu sedang belajar membaca kode — pelan tapi menempel.

---

## 5. "Sihir" dari data: satu catatan bisa jadi banyak hal

Ini bagian paling seru, dan inilah yang membuat seseorang benar-benar berpikir seperti programmer.

**Data** itu artinya cuma "catatan". Aplikasimu diam-diam mencatat banyak hal: kapan kamu mengulang hafalan, hasilnya lancar atau tidak, berapa hari kamu rajin, dan seterusnya. Catatan-catatan ini disimpan rapi seperti **buku tabel** (bayangkan buku absen di sekolah: ada baris dan kolom).

Nah, keajaibannya: **dari satu catatan, kamu bisa membuat banyak hal baru.**

Contoh, ambil satu catatan saja: `review_logs` — buku catatan tiap kali kamu muraja'ah (isinya: unit apa, tanggal berapa, hasilnya lancar/tersendat). Dari buku sekecil ini, kamu bisa membuat:

- **Nilai kerajinan:** "Bulan ini kamu muraja'ah 25 dari 30 hari (83%)." (tinggal menghitung).
- **Peta kelemahan:** "Bagian yang paling sering kamu lupa: Juz 30 halaman 5." (cari yang hasilnya paling sering 'tersendat').
- **Ramalan:** "Dengan kecepatan ini, kamu khatam menghafal sekitar bulan Desember." (hitung sisa dibagi kecepatan).
- **Hari emas:** "Kamu paling rajin di hari Sabtu." (kelompokkan catatan per hari).
- **Lencana/penghargaan:** "🏅 Lencana: 100 kali muraja'ah!" (hitung total baris catatan).

Semua ide di atas lahir dari **buku catatan yang sama**. Itulah cara programmer berpikir:

> "Aku punya catatan ini... kira-kira hal berguna apa lagi yang bisa kubuat darinya?"

Setiap kali kamu bertanya seperti itu, kamu sedang berlatih menjadi programmer sungguhan — bahkan sebelum menulis satu baris kode pun.

---

## 6. Latihan kecil (santai saja)

1. Pilih satu mesin dari Bagian 3. Ceritakan ke temanmu (atau ke diri sendiri) Masukan–Dikerjakan–Keluaran-nya, seolah menjelaskan mesin jus.
2. Lihat data yang aplikasimu kumpulkan (streak, posisi baca, catatan muraja'ah). Tuliskan **3 ide** hal baru yang bisa dibuat darinya. Tidak apa-apa kalau kelihatannya susah — yang penting idenya.
3. Setiap AI membuat fungsi baru, pakai **Prompt Penjelas** di Bagian 4.

Ingat: kamu tidak perlu paham semuanya sekaligus. Sedikit demi sedikit, tiap hari. Sama seperti hafalanmu — **menjaga lebih penting daripada menambah banyak.** 🙂
