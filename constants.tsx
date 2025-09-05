
import { Employee, LeaveRequest, LeaveStatus, LeaveType, Payroll, User, Role, PerformanceReview, AttendanceRecord, AttendanceStatus } from './types';

export const ICONS = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    employees: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 12a4 4 0 110 8 4 4 0 010-8z" /></svg>,
    leave: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    payroll: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    performance: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2Z" /></svg>,
    reports: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    profile: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    attendance: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

export const ADMIN_NAV_LINKS = [
    { name: 'Dasbor', icon: ICONS.dashboard, view: 'dashboard' },
    { name: 'Karyawan', icon: ICONS.employees, view: 'employees' },
    { name: 'Absensi', icon: ICONS.attendance, view: 'attendance' },
    { name: 'Pengajuan Cuti', icon: ICONS.leave, view: 'leaves' },
    { name: 'Penilaian Kinerja', icon: ICONS.performance, view: 'performance' },
    { name: 'Penggajian', icon: ICONS.payroll, view: 'payroll' },
    { name: 'Laporan', icon: ICONS.reports, view: 'reports' },
];

export const EMPLOYEE_NAV_LINKS = [
    { name: 'Dasbor', icon: ICONS.dashboard, view: 'dashboard' },
    { name: 'Profil Saya', icon: ICONS.profile, view: 'profile' },
    { name: 'Absensi Saya', icon: ICONS.attendance, view: 'my-attendance' },
    { name: 'Cuti Saya', icon: ICONS.leave, view: 'my-leave' },
    { name: 'Kinerja Saya', icon: ICONS.performance, view: 'my-performance' },
    { name: 'Slip Gaji Saya', icon: ICONS.payroll, view: 'my-payslips' },
];

export const COMPANY_WORK_START_TIME = '09:00:00';

// MOCK DATA
const MOCK_EMPLOYEES: Employee[] = [
    { 
        id: 'emp-001', nip: 'NIP001', grade: 'Staf Senior (3A)', position: 'Pengembang Frontend', joinDate: '2022-01-15', phone: '081234567890', department: 'Teknologi', avatarUrl: 'https://picsum.photos/id/1005/200', leaveBalance: 12, isActive: true,
        address: 'Jl. Merdeka No. 1, Jakarta', pob: 'Jakarta', dob: '1995-05-10', religion: 'Islam', maritalStatus: 'Menikah', numberOfChildren: 1,
        educationHistory: [{ level: 'S1', institution: 'Universitas Indonesia', major: 'Ilmu Komputer', graduationYear: 2017 }],
        workHistory: [{ company: 'Tech Corp', position: 'Junior Frontend Developer', startDate: '2018-01-01', endDate: '2021-12-31' }],
        trainingCertificates: [{ name: 'React Advanced', issuer: 'Coursera', issueDate: '2020-03-15' }],
        payrollInfo: {
            baseSalary: 12000000,
            incomes: [
                { id: 'inc-1', name: 'Tunjangan Transportasi', amount: 750000 },
                { id: 'inc-2', name: 'Tunjangan Makan', amount: 500000 },
            ],
            deductions: [
                { id: 'ded-1', name: 'Potongan BPJS Kesehatan', amount: 120000 },
                { id: 'ded-2', name: 'Potongan BPJS Ketenagakerjaan', amount: 240000 },
                { id: 'ded-3', name: 'Pajak (PPh 21)', amount: 350000 },
            ],
        }
    },
    { 
        id: 'emp-002', nip: 'NIP002', grade: 'Staf Senior (3B)', position: 'Pengembang Backend', joinDate: '2021-11-20', phone: '081234567891', department: 'Teknologi', avatarUrl: 'https://picsum.photos/id/1012/200', leaveBalance: 10, isActive: true,
        address: 'Jl. Sudirman No. 2, Bandung', pob: 'Bandung', dob: '1993-08-20', religion: 'Kristen', maritalStatus: 'Lajang', numberOfChildren: 0,
        educationHistory: [{ level: 'S1', institution: 'Institut Teknologi Bandung', major: 'Teknik Informatika', graduationYear: 2015 }],
        workHistory: [{ company: 'Data Solutions', position: 'Software Engineer', startDate: '2016-02-01', endDate: '2021-10-31' }],
        trainingCertificates: [{ name: 'Certified Kubernetes Administrator', issuer: 'Linux Foundation', issueDate: '2021-01-20' }],
        payrollInfo: {
            baseSalary: 15000000,
            incomes: [
                { id: 'inc-1', name: 'Tunjangan Transportasi', amount: 1000000 },
                { id: 'inc-2', name: 'Tunjangan Makan', amount: 750000 },
            ],
            deductions: [
                 { id: 'ded-1', name: 'Potongan BPJS Kesehatan', amount: 150000 },
                { id: 'ded-2', name: 'Potongan BPJS Ketenagakerjaan', amount: 300000 },
                { id: 'ded-3', name: 'Pajak (PPh 21)', amount: 650000 },
            ],
        }
    },
    { 
        id: 'emp-003', nip: 'NIP003', grade: 'Staf Junior (2A)', position: 'Desainer UI/UX', joinDate: '2022-03-01', phone: '081234567892', department: 'Desain', avatarUrl: 'https://picsum.photos/id/1027/200', leaveBalance: 14, isActive: false,
        address: 'Jl. Gajah Mada No. 3, Surabaya', pob: 'Surabaya', dob: '1998-01-15', religion: 'Islam', maritalStatus: 'Lajang', numberOfChildren: 0,
        educationHistory: [{ level: 'D3', institution: 'Politeknik Negeri Surabaya', major: 'Desain Komunikasi Visual', graduationYear: 2019 }],
        workHistory: [],
        trainingCertificates: [{ name: 'UI/UX Design Masterclass', issuer: 'Udemy', issueDate: '2021-05-10' }],
        payrollInfo: { baseSalary: 8000000, incomes: [], deductions: [] }
    },
    { 
        id: 'emp-004', nip: 'NIP004', grade: 'Manajer (4A)', position: 'Manajer Proyek', joinDate: '2020-05-10', phone: '081234567893', department: 'Manajemen', avatarUrl: 'https://picsum.photos/id/1025/200', leaveBalance: 8, isActive: true,
        address: 'Jl. Pahlawan No. 4, Yogyakarta', pob: 'Yogyakarta', dob: '1990-11-30', religion: 'Katolik', maritalStatus: 'Menikah', numberOfChildren: 2,
        educationHistory: [{ level: 'S2', institution: 'Universitas Gadjah Mada', major: 'Manajemen', graduationYear: 2014 }],
        workHistory: [{ company: 'Creative Agency', position: 'Project Lead', startDate: '2015-01-15', endDate: '2020-04-30' }],
        trainingCertificates: [{ name: 'Project Management Professional (PMP)', issuer: 'PMI', issueDate: '2018-07-22' }],
        payrollInfo: {
            baseSalary: 20000000,
            incomes: [
                { id: 'inc-1', name: 'Tunjangan Jabatan', amount: 2500000 },
                { id: 'inc-2', name: 'Tunjangan Transportasi', amount: 1500000 },
            ],
            deductions: [
                { id: 'ded-1', name: 'Potongan BPJS Kesehatan', amount: 200000 },
                { id: 'ded-2', name: 'Potongan BPJS Ketenagakerjaan', amount: 400000 },
                { id: 'ded-3', name: 'Pajak (PPh 21)', amount: 1250000 },
                { id: 'ded-4', name: 'Cicilan Pinjaman', amount: 1000000 },
            ],
        }
    },
    { 
        id: 'emp-005', nip: 'NIP005', grade: 'Manajer (4B)', position: 'Spesialis SDM', joinDate: '2019-08-22', phone: '081234567894', department: 'Sumber Daya Manusia', avatarUrl: 'https://picsum.photos/id/10/200', leaveBalance: 12, isActive: true,
        address: 'Jl. Diponegoro No. 5, Semarang', pob: 'Semarang', dob: '1992-04-25', religion: 'Islam', maritalStatus: 'Menikah', numberOfChildren: 1,
        educationHistory: [{ level: 'S1', institution: 'Universitas Diponegoro', major: 'Psikologi', graduationYear: 2014 }],
        workHistory: [],
        trainingCertificates: [],
        payrollInfo: { baseSalary: 18000000, incomes: [], deductions: [] }
    },
];

const MOCK_USERS: User[] = [
    { id: 'user-admin', name: 'Admin SDM', email: 'admin@company.com', role: Role.ADMIN, employeeDetails: MOCK_EMPLOYEES[4] },
    { id: 'user-001', name: 'Budi Santoso', email: 'budi.santoso@company.com', role: Role.EMPLOYEE, employeeDetails: MOCK_EMPLOYEES[0] },
    { id: 'user-002', name: 'Ani Lestari', email: 'ani.lestari@company.com', role: Role.EMPLOYEE, employeeDetails: MOCK_EMPLOYEES[1] },
    { id: 'user-003', name: 'Citra Dewi', email: 'citra.dewi@company.com', role: Role.EMPLOYEE, employeeDetails: MOCK_EMPLOYEES[2] },
    { id: 'user-004', name: 'Dodi Hidayat', email: 'dodi.hidayat@company.com', role: Role.EMPLOYEE, employeeDetails: MOCK_EMPLOYEES[3] },
];

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
    { id: 'leave-001', employeeId: 'emp-001', employeeName: 'Budi Santoso', leaveType: LeaveType.ANNUAL, startDate: '2024-08-10', endDate: '2024-08-12', reason: 'Liburan keluarga.', status: LeaveStatus.PENDING },
    { id: 'leave-002', employeeId: 'emp-002', employeeName: 'Ani Lestari', leaveType: LeaveType.SICK, startDate: '2024-07-22', endDate: '2024-07-22', reason: 'Demam dan sakit kepala.', status: LeaveStatus.APPROVED, supportingDocument: 'surat-dokter.pdf' },
    { id: 'leave-003', employeeId: 'emp-003', employeeName: 'Citra Dewi', leaveType: LeaveType.SPECIAL, startDate: '2024-09-01', endDate: '2024-09-01', reason: 'Keperluan keluarga mendesak.', status: LeaveStatus.REJECTED, rejectionReason: 'Tidak ada dokumen pendukung yang dilampirkan.' },
    { id: 'leave-004', employeeId: 'emp-004', employeeName: 'Dodi Hidayat', leaveType: LeaveType.ANNUAL, startDate: '2024-08-15', endDate: '2024-08-20', reason: 'Perjalanan pribadi.', status: LeaveStatus.PENDING },
];

const MOCK_PAYROLLS: Payroll[] = [
    { 
        id: 'pay-001', employeeId: 'emp-001', employeeName: 'Budi Santoso', period: 'Juni 2024',
        baseSalary: 12000000,
        incomes: [
            { id: 'inc-1', name: 'Tunjangan Transportasi', amount: 750000 },
            { id: 'inc-2', name: 'Tunjangan Makan', amount: 500000 },
            { id: 'inc-3', name: 'Bonus Kinerja', amount: 1000000 },
        ],
        deductions: [
            { id: 'ded-1', name: 'Potongan BPJS Kesehatan', amount: 120000 },
            { id: 'ded-2', name: 'Potongan BPJS Ketenagakerjaan', amount: 240000 },
            { id: 'ded-3', name: 'Pajak (PPh 21)', amount: 450000 },
        ],
        totalIncome: 14250000,
        totalDeductions: 810000,
        netSalary: 13440000
    },
    { 
        id: 'pay-002', employeeId: 'emp-002', employeeName: 'Ani Lestari', period: 'Juni 2024',
        baseSalary: 15000000,
        incomes: [
             { id: 'inc-1', name: 'Tunjangan Transportasi', amount: 1000000 },
             { id: 'inc-2', name: 'Tunjangan Makan', amount: 750000 },
        ],
        deductions: [
            { id: 'ded-1', name: 'Potongan BPJS Kesehatan', amount: 150000 },
            { id: 'ded-2', name: 'Potongan BPJS Ketenagakerjaan', amount: 300000 },
            { id: 'ded-3', name: 'Pajak (PPh 21)', amount: 650000 },
        ],
        totalIncome: 16750000,
        totalDeductions: 1100000,
        netSalary: 15650000
    },
    { 
        id: 'pay-004', employeeId: 'emp-004', employeeName: 'Dodi Hidayat', period: 'Juni 2024',
        baseSalary: 20000000,
        incomes: [
            { id: 'inc-1', name: 'Tunjangan Jabatan', amount: 2500000 },
            { id: 'inc-2', name: 'Tunjangan Transportasi', amount: 1500000 },
            { id: 'inc-3', name: 'Lembur', amount: 1200000 },
        ],
        deductions: [
            { id: 'ded-1', name: 'Potongan BPJS Kesehatan', amount: 200000 },
            { id: 'ded-2', name: 'Potongan BPJS Ketenagakerjaan', amount: 400000 },
            { id: 'ded-3', name: 'Pajak (PPh 21)', amount: 1250000 },
            { id: 'ded-4', name: 'Cicilan Pinjaman', amount: 1000000 },
        ],
        totalIncome: 25200000,
        totalDeductions: 2850000,
        netSalary: 22350000
    },
];

const MOCK_PERFORMANCE_REVIEWS: PerformanceReview[] = [
    {
        id: 'pr-001',
        employeeId: 'emp-001',
        employeeName: 'Budi Santoso',
        period: 'Q2 2024',
        reviewerName: 'Admin SDM',
        reviewDate: '2024-07-15',
        overallScore: 4.2,
        status: 'Completed',
        strengths: 'Kemampuan coding yang sangat baik pada React, selalu menyelesaikan tugas tepat waktu. Komunikatif dan proaktif dalam tim.',
        areasForImprovement: 'Perlu meningkatkan pemahaman tentang arsitektur backend untuk kolaborasi yang lebih baik dengan tim backend.',
        employeeFeedback: 'Terima kasih atas masukannya. Saya akan mengikuti kursus Node.js untuk meningkatkan pemahaman saya.',
        kpis: [
            { id: 'kpi-1-1', metric: 'Penyelesaian Tiket JIRA', target: '20 tiket/sprint', result: '22 tiket/sprint', weight: 0.4, score: 5, notes: 'Melebihi target secara konsisten.' },
            { id: 'kpi-1-2', metric: 'Kualitas Kode (Bug Rate)', target: '< 5 bug kritikal', result: '3 bug kritikal', weight: 0.4, score: 4, notes: 'Kualitas kode baik, beberapa bug minor ditemukan.' },
            { id: 'kpi-1-3', metric: 'Kehadiran Rapat Tim', target: '100%', result: '95%', weight: 0.2, score: 3, notes: 'Absen sekali karena sakit.' },
        ]
    },
    {
        id: 'pr-002',
        employeeId: 'emp-002',
        employeeName: 'Ani Lestari',
        period: 'Q2 2024',
        reviewerName: 'Admin SDM',
        reviewDate: '2024-07-16',
        overallScore: 3.8,
        status: 'Completed',
        strengths: 'Logika pemecahan masalah yang kuat dan arsitektur database yang efisien.',
        areasForImprovement: 'Manajemen waktu bisa ditingkatkan, beberapa tugas melewati tenggat waktu.',
        kpis: [
            { id: 'kpi-2-1', metric: 'Pengembangan Fitur API', target: '3 fitur utama', result: '3 fitur utama', weight: 0.5, score: 4, notes: 'Semua fitur selesai, namun 1 fitur sedikit terlambat.' },
            { id: 'kpi-2-2', metric: 'Uptime Layanan', target: '99.9%', result: '99.95%', weight: 0.5, score: 4, notes: 'Layanan sangat stabil.' },
        ]
    }
];

const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
    { id: 'att-001', employeeId: 'emp-001', employeeName: 'Budi Santoso', date: '2024-07-29', clockIn: '08:55:10', clockOut: '17:30:05', status: AttendanceStatus.ON_TIME, workDuration: '8j 34m' },
    { id: 'att-002', employeeId: 'emp-002', employeeName: 'Ani Lestari', date: '2024-07-29', clockIn: '09:15:30', clockOut: '18:00:15', status: AttendanceStatus.LATE, workDuration: '8j 44m' },
    { id: 'att-003', employeeId: 'emp-004', employeeName: 'Dodi Hidayat', date: '2024-07-29', clockIn: '08:45:00', clockOut: '17:35:20', status: AttendanceStatus.ON_TIME, workDuration: '8j 50m' },
    { id: 'att-004', employeeId: 'emp-001', employeeName: 'Budi Santoso', date: '2024-07-30', clockIn: '08:58:00', clockOut: '17:32:00', status: AttendanceStatus.ON_TIME, workDuration: '8j 34m' },
    { id: 'att-005', employeeId: 'emp-002', employeeName: 'Ani Lestari', date: '2024-07-30', clockIn: '09:05:00', clockOut: null, status: AttendanceStatus.LATE },
];


export const MOCK_DB = {
    users: MOCK_USERS,
    employees: MOCK_EMPLOYEES,
    leaveRequests: MOCK_LEAVE_REQUESTS,
    payrolls: MOCK_PAYROLLS,
    performanceReviews: MOCK_PERFORMANCE_REVIEWS,
    attendance: MOCK_ATTENDANCE_RECORDS,
};

export const attendanceData = [
    { name: 'Sen', Hadir: 3, Absen: 1, Cuti: 1 },
    { name: 'Sel', Hadir: 4, Absen: 0, Cuti: 1 },
    { name: 'Rab', Hadir: 5, Absen: 0, Cuti: 0 },
    { name: 'Kam', Hadir: 4, Absen: 1, Cuti: 0 },
    { name: 'Jum', Hadir: 5, Absen: 0, Cuti: 0 },
    { name: 'Sab', Hadir: 0, Absen: 5, Cuti: 0 },
    { name: 'Min', Hadir: 0, Absen: 5, Cuti: 0 },
];
