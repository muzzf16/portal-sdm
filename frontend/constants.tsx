import { Role } from './types';

export const ICONS = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    employees: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 12a4 4 0 110 8 4 4 0 010-8z" /></svg>,
    leave: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    payroll: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    performance: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2Z" /></svg>,
    reports: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    profile: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    attendance: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 12a4 4 0 110 8 4 4 0 010-8z" /></svg>,
    announcement: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.58-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.48-.44H9.24a.49.49 0 0 0-.48.44l-.36 2.54c-.59-.24-1.13-.56-1.62.94l-2.39-.96a.49.49 0 0 0-.58.22L2.03 8.89a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.64-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.58.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.49.49 0 0 0 .48.44h3.84c.26 0 .48-.2.48-.44l.36-2.54c.59-.24 1.13-.56-1.62-.94l2.39.96c.21.08.46 0 .58-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
};

export const ADMIN_NAV_LINKS = [
    { name: 'Dasbor', icon: ICONS.dashboard, view: 'dashboard' },
    { name: 'Karyawan', icon: ICONS.employees, view: 'employees' },
    { name: 'Absensi', icon: ICONS.attendance, view: 'attendance' },
    { name: 'Pengajuan Cuti', icon: ICONS.leave, view: 'leaves' },
    { name: 'Permintaan Data', icon: ICONS.reports, view: 'data-requests' },
    { name: 'Penilaian Kinerja', icon: ICONS.performance, view: 'performance' },
    { name: 'Penggajian', icon: ICONS.payroll, view: 'payroll' },
    { name: 'Pengumuman', icon: ICONS.announcement, view: 'announcements' },
    { name: 'Manajemen Pengguna', icon: ICONS.users, view: 'users' },
    { name: 'Laporan', icon: ICONS.reports, view: 'reports' },
    { name: 'Pengaturan', icon: ICONS.settings, view: 'settings' },
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

export const GOLONGAN_OPTIONS = [
    'I/a', 'I/b', 'I/c', 'I/d',
    'II/a', 'II/b', 'II/c', 'II/d',
    'III/a', 'III/b', 'III/c', 'III/d',
    'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'
];

export const attendanceData = [
    { name: 'Sen', Hadir: 3, Absen: 1, Cuti: 1 },
    { name: 'Sel', Hadir: 4, Absen: 0, Cuti: 1 },
    { name: 'Rab', Hadir: 5, Absen: 0, Cuti: 0 },
    { name: 'Kam', Hadir: 4, Absen: 1, Cuti: 0 },
    { name: 'Jum', Hadir: 5, Absen: 0, Cuti: 0 },
    { name: 'Sab', Hadir: 0, Absen: 5, Cuti: 0 },
    { name: 'Min', Hadir: 0, Absen: 5, Cuti: 0 },
];
