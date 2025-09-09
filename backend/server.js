const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 2025;
const DB_SOURCE = "database.sqlite";
const DB_JSON_SEED_SOURCE = path.join(__dirname, 'db.json');

// --- Cuti Bersama 2024 ---
// Sumber: SKB 3 Menteri
const CUTI_BERSAMA_2024 = [
    '2024-02-09', // Cuti Bersama Tahun Baru Imlek 2575 Kongzili
    '2024-03-12', // Cuti Bersama Hari Suci Nyepi Tahun Baru Saka 1946
    '2024-04-08', // Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah
    '2024-04-09', // Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah
    '2024-04-12', // Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah
    '2024-04-15', // Cuti Bersama Hari Raya Idul Fitri 1445 Hijriah
    '2024-05-10', // Cuti Bersama Kenaikan Isa Al Masih
    '2024-05-24', // Cuti Bersama Hari Raya Waisak
    '2024-06-18', // Cuti Bersama Hari Raya Idul Adha 1445 Hijriah
    '2024-12-26', // Cuti Bersama Hari Raya Natal
];

// --- Database Connection ---
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        throw err;
    }
    console.log('Connected to the SQLite database.');
    initializeDb();
});

// --- Promisified DB Helpers ---
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) return reject(new Error(err.message));
        resolve(rows);
    });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) return reject(new Error(err.message));
        resolve(row);
    });
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) return reject(new Error(err.message));
        resolve(this); // 'this' contains info like lastID, changes
    });
});


// --- Helper Functions ---
const parseJsonFields = (records) => {
    if (!records) return [];
    const fieldsToParse = ['educationHistory', 'workHistory', 'trainingCertificates', 'payrollInfo', 'incomes', 'deductions', 'kpis'];
    return records.map(record => {
        const newRecord = { ...record };
        for (const field of fieldsToParse) {
            if (newRecord[field] && typeof newRecord[field] === 'string') {
                try {
                    newRecord[field] = JSON.parse(newRecord[field]);
                } catch (e) {
                    console.error(`Error parsing JSON for field ${field} in record:`, record.id, e);
                    newRecord[field] = (field.endsWith('s') || field.endsWith('History')) ? [] : {};
                }
            }
        }
        // Fix document URLs that might be stored as local file URLs
        if (newRecord.supportingDocument && newRecord.supportingDocument.startsWith('file://')) {
            // Extract filename from local URL and construct proper server URL
            const filename = newRecord.supportingDocument.split('/').pop();
            if (filename) {
                newRecord.supportingDocument = `/uploads/${filename}`;
            } else {
                newRecord.supportingDocument = null;
            }
        } else if (newRecord.supportingDocument && !newRecord.supportingDocument.startsWith('/')) {
            // If it's not a local URL but doesn't start with '/', make it relative to uploads
            newRecord.supportingDocument = `/uploads/${newRecord.supportingDocument}`;
        }
        if (newRecord.hasOwnProperty('isActive')) {
             newRecord.isActive = newRecord.isActive === 1;
        }
        return newRecord;
    });
};

const calculateLeaveDuration = (startDateStr, endDateStr) => {
    let count = 0;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const curDate = new Date(startDate.getTime());

    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Bukan Minggu (0) atau Sabtu (6)
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};


// --- Database Initialization ---
const initializeDb = () => {
    db.serialize(() => {
        console.log("Initializing database schema...");
        
        // Create Tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, employeeId TEXT
            );
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY, nip TEXT UNIQUE, position TEXT, pangkat TEXT, golongan TEXT, department TEXT, joinDate TEXT, avatarUrl TEXT, leaveBalance INTEGER, isActive INTEGER, address TEXT, phone TEXT, pob TEXT, dob TEXT, religion TEXT, maritalStatus TEXT, numberOfChildren INTEGER, educationHistory TEXT, workHistory TEXT, trainingCertificates TEXT, payrollInfo TEXT
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
        `, (err) => {
            if (err) return console.error("Error creating tables:", err.message);
            console.log("Tables created or already exist.");
        });
    });
};

const seedDatabase = () => {
    // Check if we should skip seeding (for manual control)
    if (process.env.SKIP_SEEDING === 'true') {
        console.log("Skipping database seeding as requested by SKIP_SEEDING environment variable.");
        return;
    }
    
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) return console.error("Error checking for users:", err.message);
        
        if (row.count === 0) {
            console.log("Database is empty. Seeding from db.json...");
            try {
                const seedData = JSON.parse(fs.readFileSync(DB_JSON_SEED_SOURCE, 'utf8'));
                
                db.serialize(() => {
                    const insertStmt = (table, keys) => `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
                    
                    // Seed Users
                    const userStmt = db.prepare(insertStmt('users', ['id', 'name', 'email', 'password', 'role', 'employeeId']));
                    const salt = bcrypt.genSaltSync(10);
                    const hashedPassword = bcrypt.hashSync('password123', salt); // Default password for all
                    seedData.users.forEach(u => userStmt.run(u.id, u.name, u.email, hashedPassword, u.role, u.employeeDetails.id));
                    userStmt.finalize();

                    // Seed Employees
                    const empStmt = db.prepare(insertStmt('employees', ['id', 'nip', 'position', 'pangkat', 'golongan', 'department', 'joinDate', 'avatarUrl', 'leaveBalance', 'isActive', 'address', 'phone', 'pob', 'dob', 'religion', 'maritalStatus', 'numberOfChildren', 'educationHistory', 'workHistory', 'trainingCertificates', 'payrollInfo']));
                    seedData.employees.forEach(e => empStmt.run(e.id, e.nip, e.position, e.pangkat, e.golongan, e.department, e.joinDate, e.avatarUrl, e.leaveBalance, e.isActive ? 1 : 0, e.address, e.phone, e.pob, e.dob, e.religion, e.maritalStatus, e.numberOfChildren, JSON.stringify(e.educationHistory), JSON.stringify(e.workHistory), JSON.stringify(e.trainingCertificates), JSON.stringify(e.payrollInfo)));
                    empStmt.finalize();
                    
                    // Seed Leave Requests
                    const leaveStmt = db.prepare(insertStmt('leaveRequests', ['id', 'employeeId', 'employeeName', 'leaveType', 'startDate', 'endDate', 'reason', 'status', 'supportingDocument', 'rejectionReason']));
                    seedData.leaveRequests.forEach(r => leaveStmt.run(r.id, r.employeeId, r.employeeName, r.leaveType, r.startDate, r.endDate, r.reason, r.status, r.supportingDocument, r.rejectionReason));
                    leaveStmt.finalize();
                    
                    // Seed Payrolls
                    const payrollStmt = db.prepare(insertStmt('payrolls', ['id', 'employeeId', 'employeeName', 'period', 'baseSalary', 'incomes', 'deductions', 'totalIncome', 'totalDeductions', 'netSalary']));
                    seedData.payrolls.forEach(p => payrollStmt.run(p.id, p.employeeId, p.employeeName, p.period, p.baseSalary, JSON.stringify(p.incomes), JSON.stringify(p.deductions), p.totalIncome, p.totalDeductions, p.netSalary));
                    payrollStmt.finalize();
                    
                    // Seed Performance Reviews
                    const reviewStmt = db.prepare(insertStmt('performanceReviews', ['id', 'employeeId', 'employeeName', 'period', 'reviewerName', 'reviewDate', 'overallScore', 'status', 'strengths', 'areasForImprovement', 'employeeFeedback', 'kpis']));
                    seedData.performanceReviews.forEach(pr => reviewStmt.run(pr.id, pr.employeeId, pr.employeeName, pr.period, pr.reviewerName, pr.reviewDate, pr.overallScore, pr.status, pr.strengths, pr.areasForImprovement, pr.employeeFeedback, JSON.stringify(pr.kpis)));
                    reviewStmt.finalize();
                    
                    // Seed Attendance
                    const attendanceStmt = db.prepare(insertStmt('attendance', ['id', 'employeeId', 'employeeName', 'date', 'clockIn', 'clockOut', 'status', 'workDuration']));
                    seedData.attendance.forEach(a => attendanceStmt.run(a.id, a.employeeId, a.employeeName, a.date, a.clockIn, a.clockOut, a.status, a.workDuration));
                    attendanceStmt.finalize();
                    
                    console.log("Database seeded successfully.");
                });
            } catch (seedErr) {
                console.error("Error reading or parsing seed file:", seedErr);
            }
        } else {
            console.log("Database already contains data. Skipping seed.");
        }
    });
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API Routes ---

// GET all data
app.get('/api/data', async (req, res) => {
    try {
        const tableQueries = {
            users: 'SELECT * FROM users',
            employees: 'SELECT * FROM employees',
            leaveRequests: 'SELECT * FROM leaveRequests',
            payrolls: 'SELECT * FROM payrolls',
            performanceReviews: 'SELECT * FROM performanceReviews',
            attendance: 'SELECT * FROM attendance',
            dataChangeRequests: 'SELECT * FROM dataChangeRequests'
        };

        const promises = Object.entries(tableQueries).map(async ([tableName, sql]) => {
            const rows = await dbAll(sql);
            return [tableName, parseJsonFields(rows)];
        });
        
        const results = await Promise.all(promises);
        const dbData = Object.fromEntries(results);

        res.json(dbData);
    } catch (err) {
        console.error("Fatal error in /api/data endpoint:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred.", details: err.message });
        }
    }
});


// GET leave requests data
app.get('/api/leave-requests', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM leaveRequests");
        res.json(parseJsonFields(rows));
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// GET leave summary for an employee
app.get('/api/employees/:id/leave-summary', async (req, res) => {
    const { id } = req.params;
    try {
        const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [id]);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const approvedRequests = await dbAll("SELECT * FROM leaveRequests WHERE employeeId = ? AND status = 'Disetujui'", [id]);
        
        let approvedLeaveTaken = 0;
        approvedRequests.forEach(req => {
            if (req.leaveType === 'Cuti Tahunan') {
                approvedLeaveTaken += calculateLeaveDuration(req.startDate, req.endDate);
            }
        });

        const summary = {
            initialAllotment: 18,
            nationalHolidays: CUTI_BERSAMA_2024.length,
            approvedLeaveTaken: approvedLeaveTaken,
            currentBalance: employee.leaveBalance, // The actual balance stored in DB
            calculatedRemaining: 18 - CUTI_BERSAMA_2024.length - approvedLeaveTaken,
        };

        res.json(summary);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});


// POST login with credentials
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [user.employeeId]);
        user.employeeDetails = parseJsonFields([employee])[0];
        
        const { password: _, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST register (REFACTORED WITH TRANSACTIONS)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body; // Added password
    try {
        const existingUser = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newEmployeeId = `emp-${Date.now()}`;
        const newUserId = `user-${Date.now()}`;
        const joinDate = new Date().toISOString().split('T')[0];

        const newEmployee = {
            id: newEmployeeId, nip: `NIP${Date.now().toString().slice(-4)}`, position: 'Staf Junior', pangkat: 'Staf', golongan: 'II/a', department: 'Belum Ditentukan', joinDate, avatarUrl: `https://picsum.photos/seed/${newEmployeeId}/200`, leaveBalance: 18, isActive: 1, address: '', phone: '', pob: '', dob: '', religion: 'Lainnya', maritalStatus: 'Lajang', numberOfChildren: 0, educationHistory: '[]', workHistory: '[]', trainingCertificates: '[]', payrollInfo: JSON.stringify({ baseSalary: 5000000, incomes: [], deductions: [] })
        };
        const newUser = { id: newUserId, name, email, password: hashedPassword, role: 'EMPLOYEE', employeeId: newEmployeeId };

        await dbRun('BEGIN TRANSACTION');
        await dbRun('INSERT INTO employees (id, nip, position, pangkat, golongan, department, joinDate, avatarUrl, leaveBalance, isActive, address, phone, pob, dob, religion, maritalStatus, numberOfChildren, educationHistory, workHistory, trainingCertificates, payrollInfo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', Object.values(newEmployee));
        await dbRun('INSERT INTO users (id, name, email, password, role, employeeId) VALUES (?,?,?,?,?,?)', Object.values(newUser));
        await dbRun('COMMIT');
        
        res.status(201).json({ message: 'Registration successful', userId: newUserId });
    } catch (err) {
        await dbRun('ROLLBACK');
        console.error("Registration error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred.", details: err.message });
        }
    }
});


// POST create employee (REFACTORED WITH TRANSACTIONS)
app.post('/api/employees', async (req, res) => {
    const { name, email, ...employeeData } = req.body;
    const newId = `emp-${Date.now()}`;
    try {
        const fullEmployeeRecord = {
            id: newId,
            nip: employeeData.nip || `NIP${Date.now().toString().slice(-4)}`,
            position: employeeData.position || 'N/A',
            pangkat: employeeData.pangkat || 'N/A',
            golongan: employeeData.golongan || 'N/A',
            department: employeeData.department || 'N/A',
            joinDate: employeeData.joinDate || new Date().toISOString().split('T')[0],
            avatarUrl: employeeData.avatarUrl || 'https://picsum.photos/id/1/200',
            leaveBalance: employeeData.leaveBalance ?? 18,
            isActive: employeeData.hasOwnProperty('isActive') ? (employeeData.isActive ? 1 : 0) : 1,
            address: employeeData.address || '',
            phone: employeeData.phone || '',
            pob: employeeData.pob || '',
            dob: employeeData.dob || '',
            religion: employeeData.religion || 'Lainnya',
            maritalStatus: employeeData.maritalStatus || 'Lajang',
            numberOfChildren: employeeData.numberOfChildren ?? 0,
            educationHistory: JSON.stringify(employeeData.educationHistory || []),
            workHistory: JSON.stringify(employeeData.workHistory || []),
            trainingCertificates: JSON.stringify(employeeData.trainingCertificates || []),
            payrollInfo: JSON.stringify(employeeData.payrollInfo || { baseSalary: 0, incomes: [], deductions: [] }),
        };
        const newUser = { id: `user-${Date.now()}`, name, email, role: 'EMPLOYEE', employeeId: newId };
        const empColumns = Object.keys(fullEmployeeRecord);
        const empPlaceholders = empColumns.map(() => '?').join(',');

        await dbRun('BEGIN TRANSACTION');
        await dbRun(`INSERT INTO employees (${empColumns.join(',')}) VALUES (${empPlaceholders})`, Object.values(fullEmployeeRecord));
        await dbRun('INSERT INTO users (id, name, email, role, employeeId) VALUES (?,?,?,?,?)', Object.values(newUser));
        await dbRun('COMMIT');
        
        res.status(201).json(parseJsonFields([fullEmployeeRecord])[0]);
    } catch (err) {
        await dbRun('ROLLBACK');
        console.error("Create employee error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred.", details: err.message });
        }
    }
});

// PUT update employee (REFACTORED WITH TRANSACTIONS)
app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, ...employeeData } = req.body;
    try {
        await dbRun('BEGIN TRANSACTION');
        const fieldsToUpdate = {
            ...employeeData,
            educationHistory: JSON.stringify(employeeData.educationHistory || []),
            workHistory: JSON.stringify(employeeData.workHistory || []),
            trainingCertificates: JSON.stringify(employeeData.trainingCertificates || []),
            payrollInfo: JSON.stringify(employeeData.payrollInfo || {}),
            isActive: employeeData.hasOwnProperty('isActive') ? (employeeData.isActive ? 1 : 0) : 1
        };
        delete fieldsToUpdate.id; // Prevent updating the primary key

        const empSetClause = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const empValues = [...Object.values(fieldsToUpdate), id];

        const empResult = await dbRun(`UPDATE employees SET ${empSetClause} WHERE id = ?`, empValues);
        if (empResult.changes === 0) {
            // No need to rollback, just means no record was found.
            await dbRun('COMMIT');
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        await dbRun(`UPDATE users SET name = ?, email = ? WHERE employeeId = ?`, [name, email, id]);
        await dbRun('COMMIT');
        
        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        await dbRun('ROLLBACK');
        console.error(`Update employee ${id} error:`, err);
        if (!res.headersSent) {
           res.status(500).json({ error: "An internal server error occurred.", details: err.message });
       }
    }
});


// PUT update leave request status
app.put('/api/leave-requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    try {
        await dbRun('BEGIN TRANSACTION');

        const request = await dbGet("SELECT * FROM leaveRequests WHERE id = ?", [id]);
        if (!request) {
            await dbRun('ROLLBACK');
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Update status cuti
        const result = await dbRun(`UPDATE leaveRequests SET status = ?, rejectionReason = ? WHERE id = ?`, [status, rejectionReason || null, id]);
        if (result.changes === 0) {
             await dbRun('ROLLBACK');
             return res.status(404).json({ message: 'Leave request not found during update' });
        }

        // Jika disetujui dan merupakan Cuti Tahunan, kurangi jatah cuti
        if (status === 'Disetujui' && request.leaveType === 'Cuti Tahunan') {
            const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [request.employeeId]);
            if (employee) {
                const duration = calculateLeaveDuration(request.startDate, request.endDate);
                const newBalance = employee.leaveBalance - duration;
                await dbRun("UPDATE employees SET leaveBalance = ? WHERE id = ?", [newBalance, request.employeeId]);
            }
        }

        await dbRun('COMMIT');
        res.json({ message: 'Leave request updated' });
    } catch (err) {
        await dbRun('ROLLBACK');
        res.status(500).json({ "error": err.message });
    }
});

const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept pdf, jpg, jpeg, png files
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/jpg' || 
            file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Only PDF, JPG, JPEG, and PNG files are allowed.'));
        }
    }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// POST submit leave request with file upload
app.post('/api/leave-requests', upload.single('supportingDocument'), async (req, res) => {
    try {
        const newRequest = { 
            id: `leave-${Date.now()}`, 
            employeeId: req.body.employeeId,
            employeeName: req.body.employeeName,
            leaveType: req.body.leaveType,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            reason: req.body.reason,
            status: 'Menunggu',
            supportingDocument: req.file ? `/uploads/${req.file.filename}` : null,
            rejectionReason: null
        };
        
        await dbRun('INSERT INTO leaveRequests (id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, supportingDocument, rejectionReason) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [newRequest.id, newRequest.employeeId, newRequest.employeeName, newRequest.leaveType, newRequest.startDate, newRequest.endDate, newRequest.reason, newRequest.status, newRequest.supportingDocument, newRequest.rejectionReason]
        );
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("Error creating leave request:", err);
        res.status(500).json({ "error": err.message });
    }
});

// POST Clock In
app.post('/api/attendance/clock-in', async (req, res) => {
    const { employeeId, employeeName } = req.body;
    const today = new Date().toISOString().split('T')[0];
    try {
        const row = await dbGet("SELECT * FROM attendance WHERE employeeId = ? AND date = ?", [employeeId, today]);
        if (row) return res.status(400).json({ message: 'Already clocked in today.' });

        const clockInTime = new Date().toLocaleTimeString('en-GB');
        const isLate = clockInTime > '09:00:00';
        const newRecord = { id: `att-${Date.now()}`, employeeId, employeeName, date: today, clockIn: clockInTime, clockOut: null, status: isLate ? 'Terlambat' : 'Tepat Waktu', workDuration: null };

        await dbRun('INSERT INTO attendance VALUES (?,?,?,?,?,?,?,?)', Object.values(newRecord));
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST Clock Out
app.post('/api/attendance/clock-out', async (req, res) => {
    const { employeeId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    try {
        const rec = await dbGet("SELECT * FROM attendance WHERE employeeId = ? AND date = ? AND clockIn IS NOT NULL AND clockOut IS NULL", [employeeId, today]);
        if (!rec) return res.status(404).json({ message: 'No active clock-in record found for today.' });
        
        const clockOutTime = new Date().toLocaleTimeString('en-GB');
        const startTime = new Date(`${today}T${rec.clockIn}`);
        const endTime = new Date(`${today}T${clockOutTime}`);
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const workDuration = `${diffHrs}j ${diffMins}m`;
        
        await dbRun("UPDATE attendance SET clockOut = ?, workDuration = ? WHERE id = ?", [clockOutTime, workDuration, rec.id]);
        res.json({ message: 'Clock out successful' });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST bulk attendance
app.post('/api/attendance/bulk', async (req, res) => {
    const records = req.body;
    if (!Array.isArray(records)) {
        return res.status(400).json({ message: 'Invalid request body. Expected an array of attendance records.' });
    }

    const insertStmt = db.prepare('INSERT INTO attendance (id, employeeId, employeeName, date, clockIn, clockOut, status, workDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    try {
        await dbRun('BEGIN TRANSACTION');
        for (const rec of records) {
            const workDuration = rec.clockIn && rec.clockOut ? calculateDuration(rec.clockIn, rec.clockOut) : null;
            insertStmt.run(`att-${Date.now()}-${Math.random()}`, rec.employeeId, rec.employeeName, rec.date, rec.clockIn, rec.clockOut, rec.status, workDuration);
        }
        await dbRun('COMMIT');
        insertStmt.finalize();
        res.status(201).json({ message: 'Bulk attendance uploaded successfully' });
    } catch (err) {
        await dbRun('ROLLBACK');
        insertStmt.finalize();
        res.status(500).json({ error: err.message });
    }
});


// POST create performance review
app.post('/api/performance-reviews', async (req, res) => {
    const reviewData = req.body;
    try {
        const totalWeight = reviewData.kpis.reduce((sum, kpi) => sum + kpi.weight, 0) || 1;
        const weightedScore = reviewData.kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0);
        const overallScore = parseFloat((weightedScore / totalWeight).toFixed(2));
        
        const newReview = { ...reviewData, id: `pr-${Date.now()}`, overallScore, kpis: JSON.stringify(reviewData.kpis) };

        await dbRun('INSERT INTO performanceReviews (id, employeeId, employeeName, period, reviewerName, reviewDate, overallScore, status, strengths, areasForImprovement, kpis) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [newReview.id, newReview.employeeId, newReview.employeeName, newReview.period, newReview.reviewerName, newReview.reviewDate, newReview.overallScore, newReview.status, newReview.strengths, newReview.areasForImprovement, newReview.kpis]
        );
        res.status(201).json(parseJsonFields([newReview])[0]);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// PUT add employee feedback to performance review
app.put('/api/performance-reviews/:id/feedback', async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    try {
        const result = await dbRun(`UPDATE performanceReviews SET employeeFeedback = ? WHERE id = ?`, [feedback, id]);
        if (result.changes === 0) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: 'Feedback submitted' });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// PUT update employee payroll info
app.put('/api/employees/:id/payroll-info', async (req, res) => {
    const { id } = req.params;
    const payrollInfo = req.body;
    try {
        const result = await dbRun(`UPDATE employees SET payrollInfo = ? WHERE id = ?`, [JSON.stringify(payrollInfo), id]);
        if (result.changes === 0) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Payroll info updated' });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// GET pending data change requests
app.get('/api/data-change-requests/pending', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM dataChangeRequests WHERE status = 'pending' ORDER BY requestDate DESC");
        res.json(parseJsonFields(rows));
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST data change request
app.post('/api/data-change-requests', async (req, res) => {
    const { employeeId, employeeName, message } = req.body;
    const newRequest = { 
        id: `dcr-${Date.now()}`, 
        employeeId, 
        employeeName, 
        message,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending'
    };
    
    try {
        await dbRun('INSERT INTO dataChangeRequests (id, employeeId, employeeName, requestDate, message, status) VALUES (?,?,?,?,?,?)',
            [newRequest.id, newRequest.employeeId, newRequest.employeeName, newRequest.requestDate, newRequest.message, newRequest.status]
        );
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// PUT update data change request status
app.put('/api/data-change-requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const result = await dbRun(`UPDATE dataChangeRequests SET status = ? WHERE id = ?`, [status, id]);
        if (result.changes === 0) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Request status updated' });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST for misc requests
app.post('/api/misc/:type', (req, res) => {
    console.log(`Received misc request for: ${req.params.type}`, req.body);
    res.json({ message: 'Request received and logged on server.' });
});

// TEMPORARY ENDPOINT TO CLEAR ALL SEEDED DATA
// WARNING: This will delete all data from all tables
app.delete('/api/clear-all-data', async (req, res) => {
    try {
        await dbRun('BEGIN TRANSACTION');
        
        // Clear all tables
        await dbRun('DELETE FROM users');
        await dbRun('DELETE FROM employees');
        await dbRun('DELETE FROM leaveRequests');
        await dbRun('DELETE FROM payrolls');
        await dbRun('DELETE FROM performanceReviews');
        await dbRun('DELETE FROM attendance');
        await dbRun('DELETE FROM dataChangeRequests');
        
        await dbRun('COMMIT');
        
        console.log('All data cleared successfully');
        res.json({ message: 'All data cleared successfully' });
    } catch (err) {
        await dbRun('ROLLBACK');
        console.error('Error clearing data:', err);
        res.status(500).json({ error: 'Failed to clear data', details: err.message });
    }
});

// USER MANAGEMENT ENDPOINTS
// GET all users
app.get('/api/users', async (req, res) => {
    try {
        const rows = await dbAll("SELECT id, name, email, role FROM users ORDER BY name");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST create new user
app.post('/api/users', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Check if user already exists
        const existingUser = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUserId = `user-${Date.now()}`;
        await dbRun('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
            [newUserId, name, email, hashedPassword, role]);
        
        res.status(201).json({ id: newUserId, name, email, role });
    } catch (err) {
        console.error("Create user error:", err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// PUT update user
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;
    try {
        // Check if email is already used by another user
        const existingUser = await dbGet("SELECT * FROM users WHERE email = ? AND id != ?", [email, id]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const result = await dbRun(`UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`, 
            [name, email, role, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error(`Update user ${id} error:`, err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check if user exists
        const user = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deletion of the last admin user
        if (user.role === 'ADMIN') {
            const adminCount = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'");
            if (adminCount.count <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin user' });
            }
        }

        // Delete user
        await dbRun('DELETE FROM users WHERE id = ?', [id]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(`Delete user ${id} error:`, err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
    } else {
        res.status(404).json({ message: 'API endpoint not found' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Sistem Manajemen SDM berjalan di http://localhost:${PORT}`);
    console.log(`Database file is at: ${path.join(__dirname, DB_SOURCE)}`);
});