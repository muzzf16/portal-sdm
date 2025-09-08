
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum LeaveStatus {
  PENDING = 'Menunggu',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak',
}

export enum LeaveType {
    ANNUAL = 'Cuti Tahunan',
    SICK = 'Cuti Sakit',
    SPECIAL = 'Izin Khusus',
}

// FIX: Added missing LeaveRequest interface to resolve import errors.
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  supportingDocument?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeDetails?: Employee;
}

export interface Education {
  level: string; // e.g., S1, S2
  institution: string;
  major: string;
  graduationYear: number;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  issueDate: string;
}

export type MaritalStatus = 'Lajang' | 'Menikah' | 'Bercerai' | 'Janda/Duda';

export interface PayComponent {
  id: string;
  name: string;
  amount: number;
}

export interface PayrollInfo {
    baseSalary: number;
    incomes: PayComponent[];
    deductions: PayComponent[];
}

export interface Employee {
  id: string;
  nip: string;
  position: string;
  pangkat: string;
  golongan: string;
  department: string;
  joinDate: string;
  avatarUrl: string;
  leaveBalance: number;
  isActive: boolean;
  
  // Personal Details
  address: string;
  phone: string;
  pob: string; // Place of Birth
  dob: string; // Date of Birth
  religion: string;
  maritalStatus: MaritalStatus;
  numberOfChildren: number;

  // History
  educationHistory: Education[];
  workHistory: WorkExperience[];
  trainingCertificates: Certificate[];

  // Payroll Information
  payrollInfo: PayrollInfo;
}

export interface Payroll {
    id: string;
    employeeId: string;
    employeeName: string;
    period: string; // e.g., "Juni 2024"
    baseSalary: number;
    incomes: PayComponent[];
    deductions: PayComponent[];
    totalIncome: number;
    totalDeductions: number;
    netSalary: number;
}

export interface KPI {
    id: string;
    metric: string;
    target: string;
    result: string;
    weight: number; // 0 to 1
    score: number; // 1 to 5
    notes?: string;
}

export interface PerformanceReview {
    id: string;
    employeeId: string;
    employeeName: string;
    period: string; // e.g., "Q3 2024"
    reviewerName: string; // e.g., "Admin SDM"
    reviewDate: string;
    overallScore: number;
    status: 'Completed' | 'In Progress';
    strengths: string;
    areasForImprovement: string;
    employeeFeedback?: string;
    kpis: KPI[];
}

export enum AttendanceStatus {
    ON_TIME = 'Tepat Waktu',
    LATE = 'Terlambat',
    ABSENT = 'Absen',
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    clockIn: string | null; // HH:mm:ss
    clockOut: string | null; // HH:mm:ss
    status: AttendanceStatus;
    workDuration?: string; // e.g., "8j 15m"
    notes?: string;
}

export interface DataChangeRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    requestDate: string;
    message: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}