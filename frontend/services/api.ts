import { Role, User, Employee, PayrollInfo, LeaveRequest, PerformanceReview } from '../types';

const API_BASE_URL = '/api'; // Menggunakan proxy relatif

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Terjadi kesalahan pada server');
    }
    return response.json();
};

const api = {
    // --- Auth ---
    login: (credentials: {email: string, password: string}): Promise<User> => {
        return fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        }).then(handleResponse);
    },

    register: (data: any) => {
         return fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },

    // --- Data Fetching ---
    getFullDatabase: () => {
        return fetch(`${API_BASE_URL}/data`).then(handleResponse);
    },

    // --- Employee Management ---
    addEmployee: (data: Partial<Employee> & { name: string; email: string }) => {
        return fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },
    
    updateEmployee: (id: string, data: Partial<Employee> & { name: string; email: string }) => {
        return fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },

    updatePayrollInfo: (employeeId: string, payrollInfo: PayrollInfo) => {
         return fetch(`${API_BASE_URL}/employees/${employeeId}/payroll-info`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payrollInfo),
        }).then(handleResponse);
    },
    
    // --- Leave Management ---
    updateLeaveStatus: (id: string, status: string, rejectionReason?: string) => {
        return fetch(`${API_BASE_URL}/leave-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, rejectionReason }),
        }).then(handleResponse);
    },
    
    submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status'>) => {
         return fetch(`${API_BASE_URL}/leave-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        }).then(handleResponse);
    },

    // --- Attendance ---
    clockIn: (employeeId: string, employeeName: string) => {
         return fetch(`${API_BASE_URL}/attendance/clock-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, employeeName }),
        }).then(handleResponse);
    },
    
    clockOut: (employeeId: string) => {
         return fetch(`${API_BASE_URL}/attendance/clock-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId }),
        }).then(handleResponse);
    },
    
    // --- Performance ---
    createPerformanceReview: (review: Omit<PerformanceReview, 'id'>) => {
        return fetch(`${API_BASE_URL}/performance-reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review),
        }).then(handleResponse);
    },

    submitPerformanceFeedback: (reviewId: string, feedback: string) => {
        return fetch(`${API_BASE_URL}/performance-reviews/${reviewId}/feedback`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback }),
        }).then(handleResponse);
    },

    // --- Misc ---
    submitDataChangeRequest: (message: string) => {
         return fetch(`${API_BASE_URL}/misc/data-change-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        }).then(handleResponse);
    },
};

export default api;