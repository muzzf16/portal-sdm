=====================================================
SISTEM MANAJEMEN SDM - PETUNJUK INSTALASI LOKAL
=====================================================

PENDAHULUAN
-----------
Dokumen ini berisi panduan untuk melakukan instalasi dan menjalankan aplikasi Sistem Manajemen SDM di komputer lokal Anda. Aplikasi ini adalah aplikasi full-stack dengan frontend React dan backend Node.js (Express) yang sekarang menggunakan database SQLite untuk persistensi data.

Perubahan Kunci: Aplikasi ini telah dimigrasi dari database file-JSON (`db.json`) ke database SQL (`database.sqlite`). Ini memberikan penyimpanan data yang lebih kuat, aman, dan andal. Perubahan yang Anda buat di aplikasi (misalnya, menambah karyawan) akan disimpan secara permanen di file database ini.

PRASYARAT
---------
1. Web Browser Modern: Google Chrome, Mozilla Firefox, Microsoft Edge, atau sejenisnya.
2. Node.js dan npm (Node Package Manager) terinstal di komputer Anda. Anda bisa mengunduhnya dari https://nodejs.org/.

STRUKTUR FOLDER
---------------
Pastikan Anda membuat struktur folder dan file persis seperti di bawah ini di dalam folder proyek utama Anda (misalnya, `proyek-sdm`):

proyek-sdm/
├── components/
│   ├── Layout.tsx
│   └── ui.tsx
├── context/
│   ├── DataContext.tsx
│   └── ToastContext.tsx
├── pages/
│   ├── Admin.tsx
│   ├── Employee.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── ForgotPassword.tsx
├── services/
│   └── api.ts
├── App.tsx
├── constants.tsx
├── database_schema.txt
├── db.json               <-- (HANYA UNTUK DATA AWAL/SEED)
├── index.html
├── index.tsx
├── metadata.json
├── package.json
├── readme.txt
├── server.js             <-- (DIPERBARUI: Backend Server dengan SQLite)
└── types.ts

*CATATAN: File `database.sqlite` akan dibuat secara otomatis saat Anda menjalankan server untuk pertama kalinya.*

STRUKTUR DATA (SKEMA DATABASE)
-----------------------------
Aplikasi ini menggunakan skema database SQL yang didefinisikan dalam `server.js` dan didokumentasikan dalam file `database_schema.txt`.

LANGKAH-LANGKAH INSTALASI
-------------------------
1. Buat folder utama untuk proyek, misalnya `proyek-sdm`.
2. Di dalam `proyek-sdm`, buat subfolder berikut: `components`, `context`, `pages`, dan `services`.
3. Buat setiap file di dalam folder yang sesuai seperti yang tercantum dalam STRUKTUR FOLDER di atas.
4. Salin (copy) dan tempel (paste) seluruh konten dari setiap file yang telah disediakan ke dalam file yang baru saja Anda buat. Pastikan nama file dan lokasinya sudah benar.

MENJALANKAN APLIKASI
--------------------
Aplikasi ini sekarang dijalankan menggunakan server Node.js dengan database SQLite. Ikuti langkah-langkah berikut:

1. Buka Terminal atau Command Prompt.

2. Arahkan direktori ke folder utama proyek Anda.
   Contoh: `cd path/ke/folder/proyek-sdm`

3. Instal dependensi yang diperlukan. Perintah ini akan membaca file `package.json` dan mengunduh library yang dibutuhkan (Express.js dan driver SQLite).
   `npm install`

4. Setelah instalasi selesai, jalankan server backend.
   `npm start`

5. Anda akan melihat pesan di terminal yang menandakan server sudah berjalan dan terhubung ke database SQLite, contohnya:
   `Server Sistem Manajemen SDM berjalan di http://localhost:3000`
   `Connected to the SQLite database.`
   `Database file is at: /path/ke/folder/proyek-sdm/database.sqlite`

   Pada saat pertama kali dijalankan, server akan secara otomatis:
   a. Membuat file `database.sqlite`.
   b. Membuat semua tabel yang diperlukan.
   c. Mengisi tabel-tabel tersebut dengan data awal dari `db.json`.

6. Buka web browser Anda dan kunjungi alamat berikut:
   `http://localhost:3000`

Aplikasi Sistem Manajemen SDM sekarang seharusnya sudah berjalan. Semua data diambil dari dan disimpan ke database SQLite secara permanen.

CARA PENGGUNAAN
---------------
1. Setelah aplikasi terbuka, Anda akan disambut oleh Landing Page.
2. Klik tombol "Masuk" untuk pergi ke halaman login.
3. Di halaman login, Anda dapat memilih untuk masuk sebagai "Admin (SDM)" atau "Karyawan".
4. Semua data yang Anda ubah (menambah karyawan, menyetujui cuti, dll.) sekarang akan dikirim ke server dan disimpan secara permanen di file `database.sqlite`.