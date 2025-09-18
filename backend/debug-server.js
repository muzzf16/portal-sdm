const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');

console.log("Starting server initialization...");

const app = express();
const PORT = process.env.PORT || 3333;
const DB_SOURCE = "database.sqlite";
const DB_JSON_SEED_SOURCE = path.join(__dirname, 'db.json');

console.log(`Database source: ${DB_SOURCE}`);
console.log(`Database JSON seed source: ${DB_JSON_SEED_SOURCE}`);

// --- Database Connection ---
console.log("Connecting to database...");
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        throw err;
    }
    console.log("Database connected successfully");

    // Enable foreign key constraints
    db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
            console.error("Error enabling foreign key constraints:", err.message);
        } else {
            console.log("Foreign key constraints enabled");
        }
    });
    
    console.log("Calling initializeDb...");
    initializeDb();
});

// --- Database Initialization ---
const initializeDb = () => {
    console.log("In initializeDb function");
    db.serialize(() => {
        console.log("Initializing database schema...");
        
        // Create Tables
        const schemaSQL = `
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY, nip TEXT UNIQUE, position TEXT, pangkat TEXT, golongan TEXT, department TEXT, joinDate TEXT, avatarUrl TEXT, leaveBalance INTEGER, isActive INTEGER, address TEXT, phone TEXT, pob TEXT, dob TEXT, gender TEXT, religion TEXT, maritalStatus TEXT, numberOfChildren INTEGER, educationHistory TEXT, workHistory TEXT, trainingCertificates TEXT, payrollInfo TEXT
            );
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, employeeId TEXT,
                FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS leaveRequests (
                id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, leaveType TEXT, startDate TEXT, endDate TEXT, reason TEXT, status TEXT, supportingDocument TEXT, rejectionReason TEXT
            );
            CREATE TABLE IF NOT EXISTS payrolls (
                id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, period TEXT, baseSalary REAL, incomes TEXT, deductions TEXT, totalIncome REAL, totalDeductions REAL, netSalary REAL
            );
            CREATE TABLE IF NOT EXISTS performanceReviews (
                id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, period TEXT, reviewerName TEXT, reviewDate TEXT, overallScore REAL, status TEXT, strengths TEXT, areasForImprovement TEXT, employeeFeedback TEXT, kpis TEXT
            );
            CREATE TABLE IF NOT EXISTS attendance (
                id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, date TEXT, clockIn TEXT, clockOut TEXT, status TEXT, workDuration TEXT
            );
            CREATE TABLE IF NOT EXISTS dataChangeRequests (
                id TEXT PRIMARY KEY, employeeId TEXT, employeeName TEXT, requestDate TEXT, message TEXT, status TEXT
            );
            CREATE TABLE IF NOT EXISTS announcements (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                author TEXT
            );
        `;
        
        console.log("Executing schema creation SQL...");
        db.exec(schemaSQL, (err) => {
            if (err) {
                console.error("Error creating tables:", err.message);
                return;
            }
            console.log("Tables created or already exist.");
            // Seed the database after ensuring tables are created
            console.log("Calling seedDatabase...");
            seedDatabase();
        });
    });
};

const seedDatabase = () => {
    console.log("In seedDatabase function");
    // Check if we should skip seeding (for manual control)
    if (process.env.SKIP_SEEDING === 'true') {
        console.log("Skipping database seeding as requested by SKIP_SEEDING environment variable.");
        return;
    }
    
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error("Error checking for users:", err.message);
            return;
        }
        
        if (row.count === 0) {
            console.log("Database is empty. Seeding from db.json...");
            try {
                if (fs.existsSync(DB_JSON_SEED_SOURCE)) {
                    const seedData = JSON.parse(fs.readFileSync(DB_JSON_SEED_SOURCE, 'utf8'));
                    console.log("Seed data loaded successfully");
                    // For now, just log that we would seed
                    console.log("Would seed database with data");
                } else {
                    console.log("Seed file not found, continuing without seeding");
                }
            } catch (seedErr) {
                console.error("Error reading or parsing seed file:", seedErr);
            }
        } else {
            console.log("Database already contains data. Skipping seed.");
        }
    });
};

// Middleware
console.log("Setting up middleware...");
app.use(cors());
app.use(express.json());

// Serve frontend files from the 'frontend/dist' directory (built files)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

console.log("Setting up routes...");

// Simple test route
app.get('/api/test', (req, res) => {
    console.log("Test route called");
    res.json({ message: 'Server is running' });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    console.log(`Fallback route called for: ${req.originalUrl}`);
    if (!req.originalUrl.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    } else {
        res.status(404).json({ message: 'API endpoint not found' });
    }
});

console.log(`Setting up server to listen on port ${PORT}...`);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Sistem Manajemen SDM berjalan di http://localhost:${PORT}`);
    console.log(`Database file is at: ${path.join(__dirname, DB_SOURCE)}`);
    console.log('Server started successfully with comprehensive API logging enabled');
});