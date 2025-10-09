const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();

// --- JWT Authentication ---
const JWT_SECRET = 'your-secret-key'; // Use a more secure key in production

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};
//const PORT = process.env.PORT || 2025;
const PORT = process.env.PORT || 3333;
const DB_SOURCE = "database.sqlite";
const DB_JSON_SEED_SOURCE = path.join(__dirname, 'db.json');

// Collective holidays are now managed in the 'collective_holidays' table.

// --- Database Connection ---
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        throw err;
    }

    // Enable foreign key constraints
    db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
            console.error("Error enabling foreign key constraints:", err.message);
   
        }
    });
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
        `, (err) => {
            if (err) return console.error("Error creating tables:", err.message);
            console.log("Tables created or already exist.");
            // Seed the database after ensuring tables are created
            seedDatabase();
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
                    seedData.users.forEach(u => userStmt.run(u.id, u.name, u.email, hashedPassword, u.role, u.employeeDetails ? u.employeeDetails.id : null));
                    userStmt.finalize();

                    // Seed Employees
                    const empStmt = db.prepare(insertStmt('employees', ['id', 'nip', 'position', 'pangkat', 'golongan', 'department', 'joinDate', 'avatarUrl', 'leaveBalance', 'isActive', 'address', 'phone', 'pob', 'dob', 'gender', 'religion', 'maritalStatus', 'numberOfChildren', 'educationHistory', 'workHistory', 'trainingCertificates', 'payrollInfo']));
                    seedData.employees.forEach(e => empStmt.run(e.id, e.nip, e.position, e.pangkat, e.golongan, e.department, e.joinDate, e.avatarUrl, e.leaveBalance, e.isActive ? 1 : 0, e.address, e.phone, e.pob, e.dob, e.gender || 'Laki-laki', e.religion, e.maritalStatus, e.numberOfChildren, JSON.stringify(e.educationHistory), JSON.stringify(e.workHistory), JSON.stringify(e.trainingCertificates), JSON.stringify(e.payrollInfo)));
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
                // Run cleanup after seeding
                cleanupOrphanedEmployees();
            } catch (seedErr) {
                console.error("Error reading or parsing seed file:", seedErr);
            }
        } else {
            console.log("Database already contains data. Skipping seed.");
            // Run cleanup on existing database
            cleanupOrphanedEmployees();
        }
    });
};

// Cleanup function to remove orphaned employees (employees without corresponding users)
const cleanupOrphanedEmployees = async () => {
    try {
        console.log("Starting cleanup of orphaned employees...");
        
        // Find employees that don't have a corresponding user
        const orphanedEmployees = await dbAll(`
            SELECT e.id, e.nip, e.position
            FROM employees e
            LEFT JOIN users u ON e.id = u.employeeId
            WHERE u.employeeId IS NULL
        `);
        
        if (orphanedEmployees.length === 0) {
            console.log("No orphaned employees found.");
            return;
        }
        
        console.log(`Found ${orphanedEmployees.length} orphaned employees. Deleting...`);
        
        // Delete orphaned employees
        await dbRun('BEGIN TRANSACTION');
        for (const employee of orphanedEmployees) {
            await dbRun('DELETE FROM employees WHERE id = ?', [employee.id]);
            console.log(`Deleted orphaned employee: ${employee.nip} (${employee.id}) - ${employee.position}`);
        }
        await dbRun('COMMIT');
        
        console.log("Cleanup of orphaned employees completed successfully.");
    } catch (error) {
        try {
            await dbRun('ROLLBACK');
        } catch (rollbackError) {
            console.error("Error during rollback:", rollbackError);
        }
        console.error("Error during cleanup of orphaned employees:", error);
    }
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from the 'frontend/dist' directory (built files)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- API Routes ---

// GET all data
app.get('/api/data', async (req, res) => {
    try {
        console.log("API Request: GET /api/data");
        const tableQueries = {
            users: 'SELECT * FROM users',
            employees: 'SELECT * FROM employees',
            leaveRequests: 'SELECT * FROM leaveRequests',
            payrolls: 'SELECT * FROM payrolls',
            performanceReviews: 'SELECT * FROM performanceReviews',
            attendance: 'SELECT * FROM attendance',
            dataChangeRequests: 'SELECT * FROM dataChangeRequests',
            announcements: 'SELECT * FROM announcements ORDER BY createdAt DESC'
        };

        const promises = Object.entries(tableQueries).map(async ([tableName, sql]) => {
            console.log(`Fetching data for table: ${tableName}`);
            const rows = await dbAll(sql);
            console.log(`Retrieved ${rows.length} rows from ${tableName}`);
            return [tableName, parseJsonFields(rows)];
        });
        
        const results = await Promise.all(promises);
        const dbData = Object.fromEntries(results);
        console.log("API Response: GET /api/data completed successfully");

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
        console.log("API Request: GET /api/leave-requests");
        const rows = await dbAll("SELECT * FROM leaveRequests");
        console.log(`Retrieved ${rows.length} leave requests`);
        res.json(parseJsonFields(rows));
    } catch (err) {
        console.error("Error in /api/leave-requests endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// GET leave summary for an employee
app.get('/api/employees/:id/leave-summary', async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`API Request: GET /api/employees/${id}/leave-summary`);
        const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [id]);
        if (!employee) {
            console.log(`Employee not found for ID: ${id}`);
            return res.status(404).json({ message: 'Employee not found' });
        }

        const approvedRequests = await dbAll("SELECT * FROM leaveRequests WHERE employeeId = ? AND status = 'Disetujui'", [id]);
        console.log(`Found ${approvedRequests.length} approved leave requests for employee ${id}`);
        
        let approvedLeaveTaken = 0;
        approvedRequests.forEach(req => {
            if (req.leaveType === 'Cuti Tahunan') {
                approvedLeaveTaken += calculateLeaveDuration(req.startDate, req.endDate);
            }
        });

        const nationalHolidaysCount = await dbGet("SELECT COUNT(*) as count FROM collective_holidays");

        const summary = {
            initialAllotment: 18,
            nationalHolidays: nationalHolidaysCount.count,
            approvedLeaveTaken: approvedLeaveTaken,
            currentBalance: employee.leaveBalance, // The actual balance stored in DB
            calculatedRemaining: employee.leaveBalance, // Corrected: This is the true remaining balance
        };

        console.log(`Leave summary for employee ${id}:`, summary);
        res.json(summary);
    } catch (err) {
        console.error("Error in /api/employees/:id/leave-summary endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});


// POST login with credentials
app.post('/api/auth/login', async (req, res) => {
    const { name, password } = req.body;
    try {
        console.log(`API Request: POST /api/auth/login for user: ${name}`);
        const user = await dbGet("SELECT * FROM users WHERE name = ?", [name]);
        if (!user) {
            console.log(`User not found: ${name}`);
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Invalid credentials for user: ${name}`);
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // Fetch employee details to include in the response
        const employee = user.employeeId ? await dbGet("SELECT * FROM employees WHERE id = ?", [user.employeeId]) : null;

        // Create JWT
        const payload = {
            id: user.id,
            name: user.name,
            role: user.role,
            employeeId: user.employeeId
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        console.log(`Login successful for user: ${name}`);
        res.json({ 
            message: "Login successful",
            token,
            user: {
                ...user,
                avatar: employee ? employee.avatarUrl : null
            }
        });
    } catch (err) {
        console.error("Error in /api/auth/login endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});


// POST create employee (REFACTORED WITH TRANSACTIONS)
app.post('/api/employees', async (req, res) => {
    const { name, email, ...employeeData } = req.body;
    const newId = `emp-${Date.now()}`;
    try {
        console.log(`API Request: POST /api/employees for user: ${name}, email: ${email}`);
        const fullEmployeeRecord = {
            id: newId,
            nip: employeeData.nip || `NIP${Date.now().toString().slice(-4)}`,
            position: employeeData.position || 'N/A',
            pangkat: employeeData.pangkat || 'N/A',
            golongan: employeeData.golongan || 'N/A',
            department: employeeData.department || 'N/A',
            joinDate: employeeData.joinDate || new Date().toISOString().split('T')[0],
            avatarUrl: employeeData.avatarUrl || '/uploads/default-avatar.png',
            leaveBalance: employeeData.leaveBalance ?? 18,
            isActive: employeeData.hasOwnProperty('isActive') ? (employeeData.isActive ? 1 : 0) : 1,
            address: employeeData.address || '',
            phone: employeeData.phone || '',
            pob: employeeData.pob || '',
            dob: employeeData.dob || '',
            gender: employeeData.gender || 'Laki-laki',
            religion: employeeData.religion || 'Lainnya',
            maritalStatus: employeeData.maritalStatus || 'Lajang',
            numberOfChildren: employeeData.numberOfChildren ?? 0,
            educationHistory: JSON.stringify(employeeData.educationHistory || []),
            workHistory: JSON.stringify(employeeData.workHistory || []),
            trainingCertificates: JSON.stringify(employeeData.trainingCertificates || []),
            payrollInfo: JSON.stringify(employeeData.payrollInfo || { baseSalary: 0, incomes: [], deductions: [] }),
        };
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt); // Default password
        const newUser = { id: `user-${Date.now()}`, name, email, password: hashedPassword, role: 'EMPLOYEE', employeeId: newId };
        const empColumns = Object.keys(fullEmployeeRecord);
        const empPlaceholders = empColumns.map(() => '?').join(',');

        await dbRun('BEGIN TRANSACTION');
        await dbRun(`INSERT INTO employees (${empColumns.join(',')}) VALUES (${empPlaceholders})`, Object.values(fullEmployeeRecord));
        await dbRun('INSERT INTO users (id, name, email, password, role, employeeId) VALUES (?,?,?,?,?,?)', Object.values(newUser));
        await dbRun('COMMIT');
        
        console.log(`Employee created successfully: ${newId}`);
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
        console.log(`API Request: PUT /api/employees/${id} for user: ${name}, email: ${email}`);
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
            console.log(`Employee not found for update: ${id}`);
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        await dbRun(`UPDATE users SET name = ?, email = ? WHERE employeeId = ?`, [name, email, id]);
        await dbRun('COMMIT');
        
        console.log(`Employee updated successfully: ${id}`);
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
        console.log(`API Request: PUT /api/leave-requests/${id} with status: ${status}`);
        await dbRun('BEGIN TRANSACTION');

        const request = await dbGet("SELECT * FROM leaveRequests WHERE id = ?", [id]);
        if (!request) {
            await dbRun('ROLLBACK');
            console.log(`Leave request not found: ${id}`);
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Update status cuti
        const result = await dbRun(`UPDATE leaveRequests SET status = ?, rejectionReason = ? WHERE id = ?`, [status, rejectionReason || null, id]);
        if (result.changes === 0) {
             await dbRun('ROLLBACK');
             console.log(`Leave request not found during update: ${id}`);
             return res.status(404).json({ message: 'Leave request not found during update' });
        }

        // Jika disetujui dan merupakan Cuti Tahunan, kurangi jatah cuti
        if (status === 'Disetujui' && request.leaveType === 'Cuti Tahunan') {
            const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [request.employeeId]);
            if (employee) {
                const duration = calculateLeaveDuration(request.startDate, request.endDate);
                const newBalance = employee.leaveBalance - duration;
                await dbRun("UPDATE employees SET leaveBalance = ? WHERE id = ?", [newBalance, request.employeeId]);
                console.log(`Updated leave balance for employee ${request.employeeId}: ${employee.leaveBalance} -> ${newBalance}`);
            }
        }

        await dbRun('COMMIT');
        console.log(`Leave request updated successfully: ${id}`);
        res.json({ message: 'Leave request updated' });
    } catch (err) {
        await dbRun('ROLLBACK');
        console.error("Error in /api/leave-requests/:id endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

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

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Always name the company logo file the same way to overwrite it
        cb(null, 'company-logo' + path.extname(file.originalname));
    }
});

const uploadLogo = multer({
    storage: logoStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Only image files are allowed.'));
        }
    }
});

// POST upload company logo
app.post('/api/settings/logo', uploadLogo.single('logo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No logo file uploaded.' });
    }
    console.log('API Request: POST /api/settings/logo');
    // The file is saved by multer's diskStorage. We just need to send back a success response.
    const logoUrl = `/uploads/${req.file.filename}`;
    console.log(`Company logo uploaded successfully: ${logoUrl}`);
    res.status(200).json({ message: 'Logo uploaded successfully', url: logoUrl });
});

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Only image files are allowed.'));
        }
    }
});

// POST upload user avatar
app.post('/api/employees/:id/avatar', uploadAvatar.single('avatar'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No avatar file uploaded.' });
    }
    console.log(`API Request: POST /api/employees/${id}/avatar`);
    try {
        const avatarUrl = `/uploads/${req.file.filename}`;
        await dbRun("UPDATE employees SET avatarUrl = ? WHERE id = ?", [avatarUrl, id]);
        console.log(`Employee ${id} avatar updated successfully: ${avatarUrl}`);
        res.status(200).json({ message: 'Avatar updated successfully', url: avatarUrl });
    } catch (err) {
        console.error(`Error updating avatar for employee ${id}:`, err);
        res.status(500).json({ "error": err.message });
    }
});

// --- Endpoint for user to upload their own avatar ---

const myAvatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // req.user should be available from authenticateToken middleware
        const userId = req.user ? req.user.employeeId : 'unknown-user';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + userId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadMyAvatar = multer({
    storage: myAvatarStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Only image files are allowed.'));
        }
    }
});

app.post('/api/me/avatar', authenticateToken, uploadMyAvatar.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No avatar file uploaded.' });
    }
    
    const userId = req.user.employeeId;
    console.log(`API Request: POST /api/me/avatar for user ID: ${userId}`);
    
    try {
        const avatarUrl = `/uploads/${req.file.filename}`;
        await dbRun("UPDATE employees SET avatarUrl = ? WHERE id = ?", [avatarUrl, userId]);
        
        console.log(`User ${userId} avatar updated successfully: ${avatarUrl}`);
        res.status(200).json({ message: 'Avatar updated successfully', url: avatarUrl });
    } catch (err) {
        console.error(`Error updating avatar for user ${userId}:`, err);
        res.status(500).json({ "error": err.message });
    }
});


// POST submit leave request with file upload
app.post('/api/leave-requests', upload.single('supportingDocument'), async (req, res) => {
    try {
        console.log("API Request: POST /api/leave-requests");
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
        console.log(`Leave request created successfully: ${newRequest.id}`);
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
        console.log(`API Request: POST /api/attendance/clock-in for employee: ${employeeName} (${employeeId})`);
        const row = await dbGet("SELECT * FROM attendance WHERE employeeId = ? AND date = ?", [employeeId, today]);
        if (row) {
            console.log(`Employee ${employeeName} already clocked in today`);
            return res.status(400).json({ message: 'Already clocked in today.' });
        }

        const clockInTime = new Date().toLocaleTimeString('en-GB');
        
        // Get default clock-in time from settings
        const defaultClockInSetting = await dbGet("SELECT value FROM settings WHERE key = 'defaultClockIn'");
        const defaultClockIn = defaultClockInSetting ? defaultClockInSetting.value : '09:00:00'; // Fallback to 09:00

        const isLate = clockInTime > defaultClockIn;
        const newRecord = { id: `att-${Date.now()}`, employeeId, employeeName, date: today, clockIn: clockInTime, clockOut: null, status: isLate ? 'Terlambat' : 'Tepat Waktu', workDuration: null };

        await dbRun('INSERT INTO attendance VALUES (?,?,?,?,?,?,?,?)', Object.values(newRecord));
        console.log(`Clock in successful for employee ${employeeName}: ${clockInTime}`);
        res.status(201).json(newRecord);
    } catch (err) {
        console.error("Error in /api/attendance/clock-in endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// POST Clock Out
app.post('/api/attendance/clock-out', async (req, res) => {
    const { employeeId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    try {
        console.log(`API Request: POST /api/attendance/clock-out for employee ID: ${employeeId}`);
        const rec = await dbGet("SELECT * FROM attendance WHERE employeeId = ? AND date = ? AND clockIn IS NOT NULL AND clockOut IS NULL", [employeeId, today]);
        if (!rec) {
            console.log(`No active clock-in record found for employee ${employeeId} today`);
            return res.status(404).json({ message: 'No active clock-in record found for today.' });
        }
        
        const clockOutTime = new Date().toLocaleTimeString('en-GB');
        const startTime = new Date(`${today}T${rec.clockIn}`);
        const endTime = new Date(`${today}T${clockOutTime}`);
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const workDuration = `${diffHrs}j ${diffMins}m`;
        
        await dbRun("UPDATE attendance SET clockOut = ?, workDuration = ? WHERE id = ?", [clockOutTime, workDuration, rec.id]);
        console.log(`Clock out successful for employee ${employeeId}: ${clockOutTime}, work duration: ${workDuration}`);
        res.json({ message: 'Clock out successful' });
    } catch (err) {
        console.error("Error in /api/attendance/clock-out endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

const calculateDuration = (start, end) => {
    if (!start || !end) return null;
    // The date doesn't matter, only the time difference
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diffMs = endTime.getTime() - startTime.getTime();
    if (diffMs < 0) return null;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}j ${diffMins}m`;
};

// POST bulk attendance
app.post('/api/attendance/bulk', async (req, res) => {
    const records = req.body;
    if (!Array.isArray(records)) {
        console.log("Invalid request body for bulk attendance upload");
        return res.status(400).json({ message: 'Invalid request body. Expected an array of attendance records.' });
    }
    
    console.log(`API Request: POST /api/attendance/bulk with ${records.length} records`);

    const insertStmt = db.prepare('INSERT INTO attendance (id, employeeId, employeeName, date, clockIn, clockOut, status, workDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const warnings = [];

    try {
        await dbRun('BEGIN TRANSACTION');
        for (const rec of records) {
            if (!rec.employeeName) {
                warnings.push(`Skipping record due to missing employeeName: ${JSON.stringify(rec)}`);
                continue;
            }

            // Find user by name, case-insensitively
            const user = await dbGet('SELECT * FROM users WHERE LOWER(name) = LOWER(?)', [rec.employeeName]);

            if (!user || !user.employeeId) {
                warnings.push(`Skipping record because employee not found for name: "${rec.employeeName}"`);
                continue;
            }

            const workDuration = calculateDuration(rec.clockIn, rec.clockOut);
            const employeeId = user.employeeId;
            
            insertStmt.run(`att-${Date.now()}-${Math.random()}`, employeeId, rec.employeeName, rec.date, rec.clockIn, rec.clockOut, rec.status, workDuration);
        }
        await dbRun('COMMIT');
        insertStmt.finalize();
        console.log(`Bulk attendance upload completed with ${warnings.length} warnings`);
        res.status(201).json({ message: 'Bulk attendance uploaded successfully', warnings });
    } catch (err) {
        await dbRun('ROLLBACK');
        insertStmt.finalize();
        console.error("Error in /api/attendance/bulk endpoint:", err);
        res.status(500).json({ error: err.message });
    }
});


// POST create performance review
app.post('/api/performance-reviews', async (req, res) => {
    const reviewData = req.body;
    try {
        console.log(`API Request: POST /api/performance-reviews for employee: ${reviewData.employeeName}`);
        const totalWeight = reviewData.kpis.reduce((sum, kpi) => sum + kpi.weight, 0) || 1;
        const weightedScore = reviewData.kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0);
        const overallScore = parseFloat((weightedScore / totalWeight).toFixed(2));
        
        const newReview = { ...reviewData, id: `pr-${Date.now()}`, overallScore, kpis: JSON.stringify(reviewData.kpis) };

        await dbRun('INSERT INTO performanceReviews (id, employeeId, employeeName, period, reviewerName, reviewDate, overallScore, status, strengths, areasForImprovement, kpis) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [newReview.id, newReview.employeeId, newReview.employeeName, newReview.period, newReview.reviewerName, newReview.reviewDate, newReview.overallScore, newReview.status, newReview.strengths, newReview.areasForImprovement, newReview.kpis]
        );
        console.log(`Performance review created successfully: ${newReview.id}`);
        res.status(201).json(parseJsonFields([newReview])[0]);
    } catch (err) {
        console.error("Error in /api/performance-reviews endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// PUT add employee feedback to performance review
app.put('/api/performance-reviews/:id/feedback', async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    try {
        console.log(`API Request: PUT /api/performance-reviews/${id}/feedback`);
        const result = await dbRun(`UPDATE performanceReviews SET employeeFeedback = ? WHERE id = ?`, [feedback, id]);
        if (result.changes === 0) {
            console.log(`Performance review not found: ${id}`);
            return res.status(404).json({ message: 'Review not found' });
        }
        console.log(`Feedback submitted for performance review: ${id}`);
        res.json({ message: 'Feedback submitted' });
    } catch (err) {
        console.error("Error in /api/performance-reviews/:id/feedback endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// PUT update employee payroll info
app.put('/api/employees/:id/payroll-info', async (req, res) => {
    const { id } = req.params;
    const payrollInfo = req.body;
    console.log(`API Request: PUT /api/employees/${id}/payroll-info`, payrollInfo);
    try {
        const result = await dbRun(`UPDATE employees SET payrollInfo = ? WHERE id = ?`, [JSON.stringify(payrollInfo), id]);
        if (result.changes === 0) {
            console.log(`Employee not found for payroll update: ${id}`);
            return res.status(404).json({ message: 'Employee not found' });
        }
        console.log(`Successfully updated payroll for employee ${id}. Changes: ${result.changes}`);
        res.json({ message: 'Payroll info updated' });
    } catch (err) {
        console.error(`Error updating payroll for employee ${id}:`, err);
        res.status(500).json({ "error": err.message });
    }
});

// GET pending data change requests
app.get('/api/data-change-requests/pending', async (req, res) => {
    try {
        console.log("API Request: GET /api/data-change-requests/pending");
        const rows = await dbAll("SELECT * FROM dataChangeRequests WHERE status = 'pending' ORDER BY requestDate DESC");
        console.log(`Retrieved ${rows.length} pending data change requests`);
        res.json(parseJsonFields(rows));
    } catch (err) {
        console.error("Error in /api/data-change-requests/pending endpoint:", err);
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
        console.log(`API Request: POST /api/data-change-requests from employee: ${employeeName}`);
        await dbRun('INSERT INTO dataChangeRequests (id, employeeId, employeeName, requestDate, message, status) VALUES (?,?,?,?,?,?)',
                [newRequest.id, newRequest.employeeId, newRequest.employeeName, newRequest.requestDate, newRequest.message, newRequest.status]
            );
        console.log(`Data change request created successfully: ${newRequest.id}`);
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("Error in /api/data-change-requests endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// PUT update data change request status
app.put('/api/data-change-requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        console.log(`API Request: PUT /api/data-change-requests/${id} with status: ${status}`);
        const result = await dbRun(`UPDATE dataChangeRequests SET status = ? WHERE id = ?`, [status, id]);
        if (result.changes === 0) {
            console.log(`Data change request not found: ${id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        console.log(`Data change request status updated successfully: ${id}`);
        res.json({ message: 'Request status updated' });
    } catch (err) {
        console.error("Error in /api/data-change-requests/:id endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// POST for misc requests
app.post('/api/misc/:type', (req, res) => {
    console.log(`API Request: POST /api/misc/${req.params.type}`, req.body);
    console.log(`Received misc request for: ${req.params.type}`, req.body);
    res.json({ message: 'Request received and logged on server.' });
});

// TEMPORARY ENDPOINT TO CLEAR ALL SEEDED DATA
// WARNING: This will delete all data from all tables
app.delete('/api/clear-all-data', async (req, res) => {
    try {
        console.log("API Request: DELETE /api/clear-all-data");
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

// --- Announcement CRUD Endpoints ---

// POST create new announcement
app.post('/api/announcements', async (req, res) => {
    const { title, message, author } = req.body;
    try {
        console.log(`API Request: POST /api/announcements`);
        const newAnnouncement = {
            id: `ann-${Date.now()}`,
            title,
            message,
            author: author || 'Admin',
            createdAt: new Date().toISOString(),
        };

        await dbRun('INSERT INTO announcements (id, title, message, author, createdAt) VALUES (?, ?, ?, ?, ?)',
            [newAnnouncement.id, newAnnouncement.title, newAnnouncement.message, newAnnouncement.author, newAnnouncement.createdAt]);

        console.log(`Announcement created successfully: ${newAnnouncement.id}`);
        res.status(201).json(newAnnouncement);
    } catch (err) {
        console.error("Create announcement error:", err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// PUT update announcement
app.put('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    const { title, message } = req.body;
    try {
        console.log(`API Request: PUT /api/announcements/${id}`);
        const result = await dbRun(`UPDATE announcements SET title = ?, message = ? WHERE id = ?`,
            [title, message, id]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        console.log(`Announcement updated successfully: ${id}`);
        res.json({ message: 'Announcement updated successfully' });
    } catch (err) {
        console.error(`Update announcement ${id} error:`, err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// DELETE announcement
app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`API Request: DELETE /api/announcements/${id}`);
        const result = await dbRun('DELETE FROM announcements WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        console.log(`Announcement deleted successfully: ${id}`);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error(`Delete announcement ${id} error:`, err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// USER MANAGEMENT ENDPOINTS
// GET all users
app.get('/api/users', async (req, res) => {
    try {
        console.log("API Request: GET /api/users");
        const rows = await dbAll("SELECT id, name, email, role FROM users ORDER BY name");
        console.log(`Retrieved ${rows.length} users`);
        res.json(rows);
    } catch (err) {
        console.error("Error in /api/users endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// POST create new user
app.post('/api/users', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        console.log(`API Request: POST /api/users for user: ${name}, email: ${email}, role: ${role}`);
        // Check if user already exists
        const existingUser = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser) {
            console.log(`Email already exists: ${email}`);
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUserId = `user-${Date.now()}`;
        await dbRun('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
            [newUserId, name, email, hashedPassword, role]);
        
        console.log(`User created successfully: ${newUserId}`);
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
        console.log(`API Request: PUT /api/users/${id} for user: ${name}, email: ${email}, role: ${role}`);
        // Check if email is already used by another user
        const existingUser = await dbGet("SELECT * FROM users WHERE email = ? AND id != ?", [email, id]);
        if (existingUser) {
            console.log(`Email already exists: ${email}`);
            return res.status(400).json({ message: 'Email already exists' });
        }

        const result = await dbRun(`UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`, 
            [name, email, role, id]);
        
        if (result.changes === 0) {
            console.log(`User not found for update: ${id}`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`User updated successfully: ${id}`);
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
        console.log(`API Request: DELETE /api/users/${id}`);
        // Check if user exists
        const user = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
        if (!user) {
            console.log(`User not found for deletion: ${id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deletion of the last admin user
        if (user.role === 'ADMIN') {
            const adminCount = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'");
            if (adminCount.count <= 1) {
                console.log(`Cannot delete the last admin user: ${id}`);
                return res.status(400).json({ message: 'Cannot delete the last admin user' });
            }
        }

        // Delete user
        await dbRun('DELETE FROM users WHERE id = ?', [id]);
        
        console.log(`User deleted successfully: ${id}`);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(`Delete user ${id} error:`, err);
        res.status(500).json({ error: "An internal server error occurred.", details: err.message });
    }
});

// --- Settings and Holidays API Endpoints ---

// GET all settings
app.get('/api/settings', async (req, res) => {
    try {
        console.log("API Request: GET /api/settings");
        const rows = await dbAll("SELECT * FROM settings");
        // Convert array of {key, value} to a single object {key1: value1, key2: value2}
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        console.log("Retrieved settings:", settings);
        res.json(settings);
    } catch (err) {
        console.error("Error in /api/settings endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// PUT update settings
app.put('/api/settings', async (req, res) => {
    const settings = req.body; // Expects an object like { defaultClockIn: '08:30' }
    console.log("API Request: PUT /api/settings", settings);
    try {
        await dbRun('BEGIN TRANSACTION');
        for (const [key, value] of Object.entries(settings)) {
            await dbRun("UPDATE settings SET value = ? WHERE key = ?", [value, key]);
        }
        await dbRun('COMMIT');
        console.log("Settings updated successfully");
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        await dbRun('ROLLBACK');
        console.error("Error updating settings:", err);
        res.status(500).json({ "error": err.message });
    }
});

// GET all collective holidays
app.get('/api/holidays', async (req, res) => {
    try {
        console.log("API Request: GET /api/holidays");
        const rows = await dbAll("SELECT * FROM collective_holidays ORDER BY date");
        console.log(`Retrieved ${rows.length} collective holidays`);
        res.json(rows);
    } catch (err) {
        console.error("Error in /api/holidays endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// POST add a new collective holiday
app.post('/api/holidays', async (req, res) => {
    const { date, description } = req.body;
    if (!date || !description) {
        return res.status(400).json({ message: 'Date and description are required.' });
    }
    console.log(`API Request: POST /api/holidays`, req.body);
    try {
        await dbRun("INSERT INTO collective_holidays (date, description) VALUES (?, ?)", [date, description]);
        console.log(`Collective holiday added: ${date}`);
        res.status(201).json({ date, description });
    } catch (err) {
        console.error("Error adding collective holiday:", err);
        if (err.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ message: `Holiday on date ${date} already exists.` });
        } else {
            res.status(500).json({ "error": err.message });
        }
    }
});

// DELETE a collective holiday
app.delete('/api/holidays/:date', async (req, res) => {
    const { date } = req.params;
    console.log(`API Request: DELETE /api/holidays/${date}`);
    try {
        const result = await dbRun("DELETE FROM collective_holidays WHERE date = ?", [date]);
        if (result.changes === 0) {
            console.log(`Collective holiday not found for deletion: ${date}`);
            return res.status(404).json({ message: 'Collective holiday not found' });
        }
        console.log(`Collective holiday deleted: ${date}`);
        res.json({ message: 'Collective holiday deleted successfully' });
    } catch (err) {
        console.error("Error deleting collective holiday:", err);
        res.status(500).json({ "error": err.message });
    }
});

// --- Notification Endpoints ---

// GET all notifications for the logged-in user
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: "User is not an employee." });
        }
        console.log(`API Request: GET /api/notifications for employeeId: ${employeeId}`);
        const notifications = await dbAll("SELECT * FROM notifications WHERE employeeId = ? ORDER BY createdAt DESC", [employeeId]);
        res.json(notifications);
    } catch (err) {
        console.error("Error in /api/notifications endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});

// GET unread notifications for the logged-in user
app.get('/api/notifications/unread', authenticateToken, async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: "User is not an employee." });
        }
        console.log(`API Request: GET /api/notifications/unread for employeeId: ${employeeId}`);
        const notifications = await dbAll("SELECT * FROM notifications WHERE employeeId = ? AND isRead = 0 ORDER BY createdAt DESC", [employeeId]);
        res.json(notifications);
    } catch (err) {
        console.error("Error in /api/notifications/unread endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});


// PUT mark a notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;
        console.log(`API Request: PUT /api/notifications/${id}/read for employeeId: ${employeeId}`);
        
        const result = await dbRun("UPDATE notifications SET isRead = 1 WHERE id = ? AND employeeId = ?", [id, employeeId]);

        if (result.changes === 0) {
            return res.status(404).json({ message: "Notification not found or you don't have permission to update it." });
        }
        
        res.json({ message: "Notification marked as read." });
    } catch (err) {
        console.error("Error in /api/notifications/:id/read endpoint:", err);
        res.status(500).json({ "error": err.message });
    }
});


// --- Scheduled Jobs ---
const checkUpcomingPromotions = async () => {
    console.log('Running scheduled job: checkUpcomingPromotions');
    try {
        const setting = await dbGet("SELECT value FROM settings WHERE key = 'promotionNotificationDays'");
        const daysBefore = setting ? parseInt(setting.value, 10) : 30;

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        const targetDateString = targetDate.toISOString().split('T')[0];

        const employees = await dbAll("SELECT id, employeeName, nextPromotionDate FROM employees WHERE nextPromotionDate = ?", [targetDateString]);

        if (employees.length > 0) {
            console.log(`Found ${employees.length} employees with upcoming promotions.`);
            await dbRun('BEGIN TRANSACTION');
            for (const emp of employees) {
                const notificationId = `notif-${Date.now()}-${emp.id}`;
                const message = `Kenaikan pangkat berkala untuk ${emp.employeeName} dijadwalkan pada ${emp.nextPromotionDate}.`;
                await dbRun(
                    "INSERT INTO notifications (id, employeeId, employeeName, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
                    [notificationId, emp.id, emp.employeeName, message, 'PROMOTION', new Date().toISOString()]
                );
            }
            await dbRun('COMMIT');
        } else {
            console.log('No upcoming promotions found within the notification window.');
        }
    } catch (error) {
        console.error('Error in checkUpcomingPromotions job:', error);
        // If in a transaction, try to roll back
        try {
            await dbRun('ROLLBACK');
        } catch (rbError) {
            // Ignore rollback error
        }
    }
};


// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    } else {
        res.status(404).json({ message: 'API endpoint not found' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Sistem Manajemen SDM berjalan di http://localhost:${PORT}`);
    console.log(`Database file is at: ${path.join(__dirname, DB_SOURCE)}`);
    console.log('Server started successfully with comprehensive API logging enabled');

    // Schedule the job to run once every 24 hours
    // setInterval(checkUpcomingPromotions, 24 * 60 * 60 * 1000);
    // For demonstration, run it every 1 minute
    setInterval(checkUpcomingPromotions, 60 * 1000);
    console.log('Scheduled job "checkUpcomingPromotions" will run every 1 minute.');
    // Run it once on startup as well
    checkUpcomingPromotions();
});