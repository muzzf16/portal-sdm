const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// --- Helper Functions for DB ---
const readDb = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading database file:", error);
        // Fallback to an empty structure if file is corrupted or doesn't exist
        return { users: [], employees: [], leaveRequests: [], payrolls: [], performanceReviews: [], attendance: [] };
    }
};

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to database file:", error);
    }
};

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(express.static(path.join(__dirname, '/'))); // Serve static files

// --- API Routes ---

// GET all data
app.get('/api/data', (req, res) => {
    const db = readDb();
    res.json(db);
});

// GET leave requests data
app.get('/api/leave-requests', (req, res) => {
    const db = readDb();
    res.json(db.leaveRequests);
});

// POST login
app.post('/api/login', (req, res) => {
    const { role } = req.body;
    const db = readDb();
    
    // Find the first user that matches the role
    const user = db.users.find(u => u.role === role);
    
    if (user) {
        // In a real app, you'd verify a password. Here we just find the user.
        // We need to embed the full employee details for the frontend context
        const employeeDetails = db.employees.find(e => e.id === user.employeeDetails.id);
        const userWithDetails = { ...user, employeeDetails };
        res.json(userWithDetails);
    } else {
        res.status(404).json({ message: `User with role ${role} not found` });
    }
});

// POST register
app.post('/api/register', (req, res) => {
    const { name, email } = req.body;
    const db = readDb();

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const newEmployeeId = `emp-${Date.now()}`;
    const newUserId = `user-${Date.now()}`;
    const joinDate = new Date().toISOString().split('T')[0];

    const newEmployee = {
        id: newEmployeeId,
        nip: `NIP${Date.now().toString().slice(-4)}`,
        position: 'Staf Junior',
        pangkat: 'Staf',
        golongan: 'II/a',
        department: 'Belum Ditentukan',
        joinDate,
        avatarUrl: `https://picsum.photos/seed/${newEmployeeId}/200`,
        leaveBalance: 12,
        isActive: true,
        address: '', phone: '', pob: '', dob: '', religion: 'Lainnya',
        maritalStatus: 'Lajang', numberOfChildren: 0,
        educationHistory: [], workHistory: [], trainingCertificates: [],
        payrollInfo: { baseSalary: 5000000, incomes: [], deductions: [] }
    };

    const newUser = {
        id: newUserId,
        name,
        email,
        role: 'EMPLOYEE',
        employeeDetails: { id: newEmployeeId },
    };

    db.employees.push(newEmployee);
    db.users.push(newUser);
    writeDb(db);

    res.status(201).json({ message: 'Registration successful', userId: newUserId });
});


// POST create employee
app.post('/api/employees', (req, res) => {
    const { name, email, ...employeeData } = req.body;
    const db = readDb();

    const newId = `emp-${Date.now()}`;
    const newEmployee = {
        ...employeeData,
        id: newId,
        avatarUrl: 'https://picsum.photos/id/1/200',
        payrollInfo: { baseSalary: 0, incomes: [], deductions: [] },
    };
    const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'EMPLOYEE',
        employeeDetails: { id: newId }
    };

    db.employees.push(newEmployee);
    db.users.push(newUser);
    writeDb(db);
    res.status(201).json(newEmployee);
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, ...employeeData } = req.body;
    const db = readDb();

    let employeeFound = false;
    db.employees = db.employees.map(e => {
        if (e.id === id) {
            employeeFound = true;
            return { ...e, ...employeeData };
        }
        return e;
    });

    if (employeeFound) {
        db.users = db.users.map(u => {
            if (u.employeeDetails?.id === id) {
                return { ...u, name, email };
            }
            return u;
        });
        writeDb(db);
        res.json({ message: 'Employee updated successfully' });
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

// PUT update leave request status
app.put('/api/leave-requests/:id', (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const db = readDb();

    let requestFound = false;
    db.leaveRequests = db.leaveRequests.map(r => {
        if (r.id === id) {
            requestFound = true;
            return { ...r, status, rejectionReason: rejectionReason || r.rejectionReason };
        }
        return r;
    });

    if (requestFound) {
        writeDb(db);
        res.json({ message: 'Leave request updated' });
    } else {
        res.status(404).json({ message: 'Leave request not found' });
    }
});

// POST submit leave request
app.post('/api/leave-requests', (req, res) => {
    const newRequestData = req.body;
    const db = readDb();
    const newRequest = {
        ...newRequestData,
        id: `leave-${Date.now()}`,
        status: 'Menunggu'
    };
    db.leaveRequests.unshift(newRequest); // Add to the top
    writeDb(db);
    res.status(201).json(newRequest);
});

// POST Clock In
app.post('/api/attendance/clock-in', (req, res) => {
    const { employeeId, employeeName } = req.body;
    const db = readDb();
    const today = new Date().toISOString().split('T')[0];

    const existingRecord = db.attendance.find(a => a.employeeId === employeeId && a.date === today);
    if (existingRecord) {
        return res.status(400).json({ message: 'Already clocked in today.' });
    }
    
    const COMPANY_WORK_START_TIME = '09:00:00';
    const clockInTime = new Date().toLocaleTimeString('en-GB');
    const isLate = clockInTime > COMPANY_WORK_START_TIME;

    const newRecord = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName,
        date: today,
        clockIn: clockInTime,
        clockOut: null,
        status: isLate ? 'Terlambat' : 'Tepat Waktu'
    };
    db.attendance.unshift(newRecord);
    writeDb(db);
    res.status(201).json(newRecord);
});

// POST Clock Out
app.post('/api/attendance/clock-out', (req, res) => {
    const { employeeId } = req.body;
    const db = readDb();
    const today = new Date().toISOString().split('T')[0];

    let recordFound = false;
    db.attendance = db.attendance.map(rec => {
        if (rec.employeeId === employeeId && rec.date === today && rec.clockIn && !rec.clockOut) {
            recordFound = true;
            const clockOutTime = new Date().toLocaleTimeString('en-GB');
            const startTime = new Date(`${today}T${rec.clockIn}`);
            const endTime = new Date(`${today}T${clockOutTime}`);
            const diffMs = endTime.getTime() - startTime.getTime();
            const diffHrs = Math.floor(diffMs / 3600000);
            const diffMins = Math.floor((diffMs % 3600000) / 60000);
            
            return {
                ...rec,
                clockOut: clockOutTime,
                workDuration: `${diffHrs}j ${diffMins}m`
            };
        }
        return rec;
    });

    if (recordFound) {
        writeDb(db);
        res.json({ message: 'Clock out successful' });
    } else {
        res.status(404).json({ message: 'No active clock-in record found for today.' });
    }
});


// POST create performance review
app.post('/api/performance-reviews', (req, res) => {
    const reviewData = req.body;
    const db = readDb();
    
    // Simple calculation for overall score
    const totalWeight = reviewData.kpis.reduce((sum, kpi) => sum + kpi.weight, 0) || 1;
    const weightedScore = reviewData.kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0);
    const overallScore = parseFloat((weightedScore / totalWeight).toFixed(2));

    const newReview = {
        ...reviewData,
        id: `pr-${Date.now()}`,
        overallScore,
    };
    db.performanceReviews.unshift(newReview);
    writeDb(db);
    res.status(201).json(newReview);
});

// PUT add employee feedback to performance review
app.put('/api/performance-reviews/:id/feedback', (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const db = readDb();

    let reviewFound = false;
    db.performanceReviews = db.performanceReviews.map(r => {
        if (r.id === id) {
            reviewFound = true;
            return { ...r, employeeFeedback: feedback };
        }
        return r;
    });

    if (reviewFound) {
        writeDb(db);
        res.json({ message: 'Feedback submitted' });
    } else {
        res.status(404).json({ message: 'Review not found' });
    }
});

// PUT update employee payroll info
app.put('/api/employees/:id/payroll-info', (req, res) => {
    const { id } = req.params;
    const payrollInfo = req.body;
    const db = readDb();

    let employeeFound = false;
    db.employees = db.employees.map(e => {
        if (e.id === id) {
            employeeFound = true;
            return { ...e, payrollInfo };
        }
        return e;
    });

    if (employeeFound) {
        writeDb(db);
        res.json({ message: 'Payroll info updated' });
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

// POST for misc requests that are just simulations
app.post('/api/misc/:type', (req, res) => {
    console.log(`Received request for: ${req.params.type}`);
    console.log('Body:', req.body);
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
    console.log(`Database file is at: ${DB_PATH}`);
});