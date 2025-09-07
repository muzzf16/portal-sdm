const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_SOURCE = "database.sqlite";
const DB_JSON_SEED_SOURCE = path.join(__dirname, 'db.json');

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
        if (newRecord.hasOwnProperty('isActive')) {
             newRecord.isActive = newRecord.isActive === 1;
        }
        return newRecord;
    });
};


// --- Database Initialization ---
const initializeDb = () => {
    db.serialize(() => {
        console.log("Initializing database schema...");
        
        // Create Tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, role TEXT, employeeId TEXT
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
        `, (err) => {
            if (err) return console.error("Error creating tables:", err.message);
            console.log("Tables created or already exist.");
            seedDatabase();
        });
    });
};

const seedDatabase = () => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) return console.error("Error checking for users:", err.message);
        
        if (row.count === 0) {
            console.log("Database is empty. Seeding from db.json...");
            try {
                const seedData = JSON.parse(fs.readFileSync(DB_JSON_SEED_SOURCE, 'utf8'));
                
                db.serialize(() => {
                    const insertStmt = (table, keys) => `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
                    
                    // Seed Users
                    const userStmt = db.prepare(insertStmt('users', ['id', 'name', 'email', 'role', 'employeeId']));
                    seedData.users.forEach(u => userStmt.run(u.id, u.name, u.email, u.role, u.employeeDetails.id));
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

app.use((req, res, next) => {
  if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
    res.type('text/javascript');
  }
  next();
});

app.use(express.static(path.join(__dirname, '/')));

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
            attendance: 'SELECT * FROM attendance'
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

// POST login
app.post('/api/login', async (req, res) => {
    const { role } = req.body;
    try {
        const user = await dbGet("SELECT * FROM users WHERE role = ?", [role]);
        if (!user) return res.status(404).json({ message: `User with role ${role} not found` });

        const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [user.employeeId]);
        user.employeeDetails = parseJsonFields([employee])[0];
        res.json(user);
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST register (REFACTORED WITH ASYNC/AWAIT)
app.post('/api/register', async (req, res) => {
    const { name, email } = req.body;
    try {
        const existingUser = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newEmployeeId = `emp-${Date.now()}`;
        const newUserId = `user-${Date.now()}`;
        const joinDate = new Date().toISOString().split('T')[0];

        const newEmployee = {
            id: newEmployeeId, nip: `NIP${Date.now().toString().slice(-4)}`, position: 'Staf Junior', pangkat: 'Staf', golongan: 'II/a', department: 'Belum Ditentukan', joinDate, avatarUrl: `https://picsum.photos/seed/${newEmployeeId}/200`, leaveBalance: 12, isActive: 1, address: '', phone: '', pob: '', dob: '', religion: 'Lainnya', maritalStatus: 'Lajang', numberOfChildren: 0, educationHistory: '[]', workHistory: '[]', trainingCertificates: '[]', payrollInfo: JSON.stringify({ baseSalary: 5000000, incomes: [], deductions: [] })
        };
        const newUser = { id: newUserId, name, email, role: 'EMPLOYEE', employeeId: newEmployeeId };

        await dbRun('INSERT INTO employees (id, nip, position, pangkat, golongan, department, joinDate, avatarUrl, leaveBalance, isActive, address, phone, pob, dob, religion, maritalStatus, numberOfChildren, educationHistory, workHistory, trainingCertificates, payrollInfo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', Object.values(newEmployee));
        await dbRun('INSERT INTO users (id, name, email, role, employeeId) VALUES (?,?,?,?,?)', Object.values(newUser));
        
        res.status(201).json({ message: 'Registration successful', userId: newUserId });
    } catch (err) {
        console.error("Registration error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred.", details: err.message });
        }
    }
});


// POST create employee (REFACTORED WITH ASYNC/AWAIT)
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
            leaveBalance: employeeData.leaveBalance ?? 12,
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

        await dbRun(`INSERT INTO employees (${empColumns.join(',')}) VALUES (${empPlaceholders})`, Object.values(fullEmployeeRecord));
        await dbRun('INSERT INTO users (id, name, email, role, employeeId) VALUES (?,?,?,?,?)', Object.values(newUser));
        
        res.status(201).json(parseJsonFields([fullEmployeeRecord])[0]);
    } catch (err) {
        console.error("Create employee error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred.", details: err.message });
        }
    }
});

// PUT update employee (REFACTORED WITH ASYNC/AWAIT)
app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, ...employeeData } = req.body;
    try {
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
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        await dbRun(`UPDATE users SET name = ?, email = ? WHERE employeeId = ?`, [name, email, id]);
        
        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
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
        const result = await dbRun(`UPDATE leaveRequests SET status = ?, rejectionReason = ? WHERE id = ?`, [status, rejectionReason || null, id]);
        if (result.changes === 0) return res.status(404).json({ message: 'Leave request not found' });
        res.json({ message: 'Leave request updated' });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// POST submit leave request
app.post('/api/leave-requests', async (req, res) => {
    const newRequest = { ...req.body, id: `leave-${Date.now()}`, status: 'Menunggu' };
    try {
        await dbRun('INSERT INTO leaveRequests (id, employeeId, employeeName, leaveType, startDate, endDate, reason, status) VALUES (?,?,?,?,?,?,?,?)',
            [newRequest.id, newRequest.employeeId, newRequest.employeeName, newRequest.leaveType, newRequest.startDate, newRequest.endDate, newRequest.reason, newRequest.status]
        );
        res.status(201).json(newRequest);
    } catch (err) {
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

// POST for misc requests
app.post('/api/misc/:type', (req, res) => {
    console.log(`Received misc request for: ${req.params.type}`, req.body);
    res.json({ message: 'Request received and logged on server.' });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ message: 'API endpoint not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server Sistem Manajemen SDM berjalan di http://localhost:${PORT}`);
    console.log(`Database file is at: ${path.join(__dirname, DB_SOURCE)}`);
});