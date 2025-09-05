=====================================================
SISTEM MANAJEMEN SDM - PETUNJUK INSTALASI LOKAL
=====================================================

PENDAHULUAN
-----------
Dokumen ini berisi panduan untuk melakukan instalasi dan menjalankan aplikasi Sistem Manajemen SDM (Sumber Daya Manusia) di komputer lokal Anda. Aplikasi ini adalah aplikasi frontend murni yang tidak memerlukan database atau backend khusus karena menggunakan data tiruan (mock data) yang disimpan di localStorage browser.

PRASYARAT
---------
1. Web Browser Modern: Google Chrome, Mozilla Firefox, Microsoft Edge, atau sejenisnya.
2. (Opsional, tapi sangat direkomendasikan) Python 3 atau Node.js terinstal untuk menjalankan server web lokal.

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
├── hooks/
│   └── useApi.ts
├── pages/
│   ├── Admin.tsx
│   ├── Employee.tsx
│   ├── Landing.tsx
│   └── Login.tsx
├── App.tsx
├── constants.tsx
├── index.html
├── index.tsx
├── metadata.json
├── readme.txt
└── types.ts


LANGKAH-LANGKAH INSTALASI
-------------------------
1. Buat folder utama untuk proyek, misalnya `proyek-sdm`.
2. Di dalam `proyek-sdm`, buat subfolder berikut: `components`, `context`, `hooks`, dan `pages`.
3. Buat setiap file di dalam folder yang sesuai seperti yang tercantum dalam STRUKTUR FOLDER di atas.
4. Salin (copy) dan tempel (paste) seluruh konten dari setiap file yang telah disediakan ke dalam file yang baru saja Anda buat. Pastikan nama file dan lokasinya sudah benar.

MENJALANKAN APLIKASI
--------------------
Karena aplikasi ini menggunakan ES Modules, Anda tidak bisa hanya membuka file `index.html` langsung dari file explorer (menggunakan protokol `file:///`). Anda harus menjalankannya melalui server web lokal.

Berikut cara termudah menggunakan Python (biasanya sudah terinstal di macOS/Linux):

1. Buka Terminal atau Command Prompt.
2. Arahkan direktori ke folder utama proyek Anda.
   Contoh: `cd path/ke/folder/proyek-sdm`

3. Jalankan perintah server web sederhana:
   - Jika Anda menggunakan Python 3:
     `python -m http.server 8000`
   - Jika Anda menggunakan Python 2 (lebih lama):
     `python -m SimpleHTTPServer 8000`

4. Buka web browser Anda dan kunjungi alamat berikut:
   `http://localhost:8000`

Aplikasi Sistem Manajemen SDM sekarang seharusnya sudah berjalan.

Alternatif (menggunakan Node.js):
Jika Anda memiliki Node.js, Anda bisa menggunakan paket `serve`.
1. Buka Terminal atau Command Prompt di folder proyek.
2. Jalankan perintah: `npx serve`
3. Buka browser Anda ke alamat yang ditampilkan di terminal (biasanya `http://localhost:3000`).

CARA PENGGUNAAN
---------------
1. Setelah aplikasi terbuka, Anda akan disambut oleh Landing Page.
2. Klik tombol "Masuk" untuk pergi ke halaman login.
3. Di halaman login, Anda dapat memilih untuk masuk sebagai "Admin (SDM)" atau "Karyawan".
   - **Admin**: Memiliki akses penuh untuk mengelola data karyawan, cuti, penggajian, dll.
   - **Karyawan**: Memiliki akses ke dasbor pribadi, profil, pengajuan cuti, dan melihat slip gaji.
4. Semua data yang Anda ubah (menambah karyawan, menyetujui cuti, dll.) akan disimpan di localStorage browser, sehingga perubahan akan tetap ada bahkan setelah Anda me-refresh halaman.
