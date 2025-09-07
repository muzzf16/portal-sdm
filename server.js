const express = require('express');
const cors = require('cors');
const path = require('path');
const { MOCK_DB } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Untuk mem-parsing body JSON

// Menyajikan file statis dari direktori root
// Ini akan menyajikan index.html, index.tsx, dll.
app.use(express.static(path.join(__dirname, '/')));

// --- API Routes ---

// Endpoint untuk mendapatkan seluruh database
app.get('/api/data', (req, res) => {
    res.json(MOCK_DB);
});

// Endpoint spesifik untuk setiap "tabel" data
app.get('/api/users', (req, res) => {
    res.json(MOCK_DB.users);
});

app.get('/api/employees', (req, res) => {
    res.json(MOCK_DB.employees);
});

app.get('/api/leave-requests', (req, res) => {
    res.json(MOCK_DB.leaveRequests);
});

app.get('/api/payrolls', (req, res) => {
    res.json(MOCK_DB.payrolls);
});

app.get('/api/performance-reviews', (req, res) => {
    res.json(MOCK_DB.performanceReviews);
});

app.get('/api/attendance', (req, res) => {
    res.json(MOCK_DB.attendance);
});


// Rute catch-all untuk menyajikan index.html bagi rute non-API
// Penting untuk aplikasi satu halaman (SPA) dengan routing sisi klien (React Router)
app.get('*', (req, res) => {
    // Periksa apakah permintaan ditujukan untuk API endpoint
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'Endpoint tidak ditemukan' });
    }
    // Jika tidak, kirim file index.html
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server Sistem Manajemen SDM berjalan di http://localhost:${PORT}`);
    console.log('Frontend disajikan dari direktori root.');
    console.log('API endpoint tersedia di /api/data, /api/employees, dll.');
});
