=====================================================
SISTEM MANAJEMEN SDM - PETUNJUK INSTALASI LOKAL
=====================================================

PENDAHULUAN
-----------
Dokumen ini berisi panduan untuk melakukan instalasi dan menjalankan aplikasi Sistem Manajemen SDM di komputer lokal Anda. Aplikasi ini adalah aplikasi full-stack dengan frontend React dan backend Node.js (Express) yang menyajikan data dari file `db.json`.

Perubahan Kunci: Aplikasi ini sekarang memiliki backend nyata yang menangani semua logika data. Perubahan yang Anda buat di aplikasi (misalnya, menambah karyawan) akan disimpan secara permanen di file `db.json`, bahkan setelah server di-restart.

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
│   └── api.ts              <-- (BARU: Layanan API Frontend)
├── App.tsx
├── constants.tsx
├── database_schema.txt
├── db.json               <-- (BARU: Database File-JSON)
├── index.html
├── index.tsx
├── metadata.json
├── package.json
├── readme.txt
├── server.js             <-- (DIPERBARUI: Backend Server)
└── types.ts

STRUKTUR DATA (SKEMA DATABASE)
-----------------------------
Aplikasi ini menggunakan model data yang didefinisikan dalam file `db.json` untuk berfungsi sebagai database. Untuk pemahaman mendalam tentang struktur data, silakan merujuk ke file:

`database_schema.txt`

LANGKAH-LANGKAH INSTALASI
-------------------------
1. Buat folder utama untuk proyek, misalnya `proyek-sdm`.
2. Di dalam `proyek-sdm`, buat subfolder berikut: `components`, `context`, `pages`, dan `services`.
3. Buat setiap file di dalam folder yang sesuai seperti yang tercantum dalam STRUKTUR FOLDER di atas.
4. Salin (copy) dan tempel (paste) seluruh konten dari setiap file yang telah disediakan ke dalam file yang baru saja Anda buat. Pastikan nama file dan lokasinya sudah benar.

MENJALANKAN APLIKASI
--------------------
Aplikasi ini sekarang dijalankan menggunakan server Node.js. Ikuti langkah-langkah berikut:

1. Buka Terminal atau Command Prompt.

2. Arahkan direktori ke folder utama proyek Anda.
   Contoh: `cd path/ke/folder/proyek-sdm`

3. Instal dependensi yang diperlukan. Perintah ini akan membaca file `package.json` dan mengunduh library yang dibutuhkan (seperti Express.js).
   `npm install`

4. Setelah instalasi selesai, jalankan server backend.
   `npm start`

5. Anda akan melihat pesan di terminal yang menandakan server sudah berjalan, contohnya:
   `Server Sistem Manajemen SDM berjalan di http://localhost:3000`
   `Database file is at: /path/ke/folder/proyek-sdm/db.json`

6. Buka web browser Anda dan kunjungi alamat berikut:
   `http://localhost:3000`

Aplikasi Sistem Manajemen SDM sekarang seharusnya sudah berjalan. Semua data diambil dari dan disimpan ke backend Node.js.

CARA PENGGUNAAN
---------------
1. Setelah aplikasi terbuka, Anda akan disambut oleh Landing Page.
2. Klik tombol "Masuk" untuk pergi ke halaman login.
3. Di halaman login, Anda dapat memilih untuk masuk sebagai "Admin (SDM)" atau "Karyawan".
4. Semua data yang Anda ubah (menambah karyawan, menyetujui cuti, dll.) sekarang akan dikirim ke server dan disimpan secara permanen di file `db.json`.
