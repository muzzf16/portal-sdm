=====================================================
SISTEM MANAJEMEN SDM - PETUNJUK INSTALASI LOKAL
=====================================================

PENDAHULUAN
-----------
Dokumen ini berisi panduan untuk melakukan instalasi dan menjalankan aplikasi Sistem Manajemen SDM di komputer lokal Anda. Aplikasi ini adalah aplikasi full-stack dengan frontend React yang terpisah dan backend Node.js (Express) yang menggunakan database SQLite.

Perubahan Kunci: Proyek ini telah direstrukturisasi menjadi dua folder utama: `frontend` dan `backend` untuk keteraturan yang lebih baik. Backend sekarang menyajikan file-file frontend.

PRASYARAT
---------
1. Web Browser Modern: Google Chrome, Mozilla Firefox, Microsoft Edge, atau sejenisnya.
2. Node.js dan npm (Node Package Manager) terinstal di komputer Anda. Anda bisa mengunduhnya dari https://nodejs.org/.

STRUKTUR FOLDER
---------------
Pastikan Anda membuat struktur folder dan file persis seperti di bawah ini di dalam folder proyek utama Anda.

proyek-sdm/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── db.json               <-- (DATA AWAL/SEED)
│   └── database.sqlite   <-- (Akan dibuat secara otomatis)
├── frontend/
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── ui.tsx
│   ├── context/
│   │   ├── DataContext.tsx
│   │   └── ToastContext.tsx
│   ├── pages/
│   │   ├── Admin.tsx
│   │   ├── Employee.tsx
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ForgotPassword.tsx
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   ├── constants.tsx
│   ├── index.html
│   ├── index.tsx
│   └── types.ts
├── database_schema.txt
├── metadata.json
└── readme.txt

LANGKAH-LANGKAH INSTALASI
-------------------------
1. Buat folder utama untuk proyek, misalnya `proyek-sdm`.
2. Di dalam `proyek-sdm`, buat subfolder `frontend` dan `backend`.
3. Di dalam `frontend`, buat subfolder `components`, `context`, `pages`, dan `services`.
4. Buat setiap file di dalam folder yang sesuai seperti yang tercantum dalam STRUKTUR FOLDER di atas.
5. Salin (copy) dan tempel (paste) seluruh konten dari setiap file yang telah disediakan ke dalam file yang baru saja Anda buat. Pastikan nama file dan lokasinya sudah benar.

MENJALANKAN APLIKASI
--------------------
Aplikasi ini sekarang memiliki folder terpisah untuk backend dan frontend. Server backend akan menyajikan file frontend.

1. Buka Terminal atau Command Prompt.

2. Arahkan direktori ke folder `backend` di dalam proyek Anda.
   Contoh: `cd path/ke/folder/proyek-sdm/backend`

3. Instal dependensi yang diperlukan untuk server. Perintah ini akan membaca file `package.json` dan mengunduh library yang dibutuhkan.
   `npm install`

4. Setelah instalasi selesai, jalankan server backend dari dalam folder `backend`.
   `npm start`

5. Anda akan melihat pesan di terminal yang menandakan server sudah berjalan dan terhubung ke database SQLite, contohnya:
   `Server Sistem Manajemen SDM berjalan di http://localhost:3000`
   `Connected to the SQLite database.`
   `Database file is at: /path/ke/folder/proyek-sdm/backend/database.sqlite`

   Pada saat pertama kali dijalankan, server akan secara otomatis:
   a. Membuat file `database.sqlite` di dalam folder `backend`.
   b. Membuat semua tabel yang diperlukan.
   c. Mengisi tabel-tabel tersebut dengan data awal dari `db.json`.

6. Buka web browser Anda dan kunjungi alamat berikut:
   `http://localhost:3000`

Aplikasi Sistem Manajemen SDM sekarang seharusnya sudah berjalan.

CARA PENGGUNAAN
---------------
1. Setelah aplikasi terbuka, Anda akan disambut oleh Landing Page.
2. Klik tombol "Masuk" untuk pergi ke halaman login.
3. Di halaman login, Anda dapat memilih untuk masuk sebagai "Admin (SDM)" atau "Karyawan".
4. Semua data yang Anda ubah akan dikirim ke server dan disimpan secara permanen di file `database.sqlite` di dalam folder `backend`.
