import { Role, User, Employee, PayrollInfo, LeaveRequest, PerformanceReview, DataChangeRequest, AttendanceRecord } from '../types';

const API_BASE_URL = '/api'; // Menggunakan proxy relatif

const handleResponse = async (response: Response) => {
    if (response.status === 401 || response.status === 403) {
        // Handle token-related errors, e.g., by logging out the user
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Terjadi kesalahan pada server');
    }
    // Handle responses that might not have a JSON body
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response.text(); // Or handle as needed
    }
};

const api = {
    // --- Auth ---
    login: async (credentials: { name?: string; password?: string }) => {
        return fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        }).then(handleResponse);
    },

    // --- Data Fetching ---
    getFullDatabase: () => {
        return fetch(`${API_BASE_URL}/data?t=${new Date().getTime()}`).then(handleResponse);
    },

    getLeaveSummary: (employeeId: string) => {
        return fetch(`${API_BASE_URL}/employees/${employeeId}/leave-summary`).then(handleResponse);
    },

    getPendingDataChangeRequests: (): Promise<DataChangeRequest[]> => {
        return fetch(`${API_BASE_URL}/data-change-requests/pending`).then(handleResponse);
    },

    submitDataChangeRequest: (message: string, employeeId?: string, employeeName?: string) => {
         return fetch(`${API_BASE_URL}/data-change-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, employeeName, message }),
        }).then(handleResponse);
    },

    updateDataChangeRequestStatus: (id: string, status: string) => {
        return fetch(`${API_BASE_URL}/data-change-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }).then(handleResponse);
    },

    // --- User Management ---
    getUsers: (): Promise<User[]> => {
        return fetch(`${API_BASE_URL}/users`).then(handleResponse);
    },

    createUser: (userData: { name: string; email: string; password: string; role: string }) => {
        return fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        }).then(handleResponse);
    },

    updateUser: (id: string, userData: { name: string; email: string; role: string }) => {
        return fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        }).then(handleResponse);
    },

    deleteUser: (id: string) => {
        return fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
        }).then(handleResponse);
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

    uploadAvatar: (employeeId: string, avatarFile: File) => {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        return fetch(`${API_BASE_URL}/employees/${employeeId}/avatar`, {
            method: 'POST',
            body: formData,
        }).then(handleResponse);
    },

    uploadMyAvatar: (avatarFile: File) => {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const token = localStorage.getItem('token');

        return fetch(`${API_BASE_URL}/me/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
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
    
    submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status'>, file?: File) => {
        // If there's a file, use FormData, otherwise use JSON
        if (file) {
            const formData = new FormData();
            formData.append('employeeId', request.employeeId);
            formData.append('employeeName', request.employeeName);
            formData.append('leaveType', request.leaveType);
            formData.append('startDate', request.startDate);
            formData.append('endDate', request.endDate);
            formData.append('reason', request.reason);
            formData.append('supportingDocument', file);
            
            return fetch(`${API_BASE_URL}/leave-requests`, {
                method: 'POST',
                body: formData,
            }).then(handleResponse);
        } else {
            return fetch(`${API_BASE_URL}/leave-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            }).then(handleResponse);
        }
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

    uploadAttendance: (data: Partial<AttendanceRecord>[]) => {
        return fetch(`${API_BASE_URL}/attendance/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
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

    // --- Announcements ---
    createAnnouncement: (data: { title: string; message: string; author?: string }) => {
        return fetch(`${API_BASE_URL}/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },

    updateAnnouncement: (id: string, data: { title: string; message: string }) => {
        return fetch(`${API_BASE_URL}/announcements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse);
    },

    deleteAnnouncement: (id: string) => {
        return fetch(`${API_BASE_URL}/announcements/${id}`, {
            method: 'DELETE',
        }).then(handleResponse);
    },

    // --- Settings & Holidays ---
    getSettings: (): Promise<{ [key: string]: string }> => {
        return fetch(`${API_BASE_URL}/settings`).then(handleResponse);
    },

    updateSettings: (settings: { [key: string]: string }) => {
        return fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        }).then(handleResponse);
    },

    getHolidays: (): Promise<{ date: string, description: string }[]> => {
        return fetch(`${API_BASE_URL}/holidays`).then(handleResponse);
    },

    addHoliday: (holiday: { date: string, description: string }) => {
        return fetch(`${API_BASE_URL}/holidays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(holiday),
        }).then(handleResponse);
    },

    deleteHoliday: (date: string) => del(`/holidays/${date}`),

    // Notifications
    getNotifications: () => get('/notifications'),
    getUnreadNotifications: () => get('/notifications/unread'),
    markNotificationAsRead: (id: string) => put(`/notifications/${id}/read`, {}),
};

export default api;