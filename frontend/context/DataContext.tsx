import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, Employee, LeaveRequest, Payroll, PerformanceReview, AttendanceRecord } from '../types';
import api from '../services/api';

export interface MockDatabase {
    users: User[];
    employees: Employee[];
    leaveRequests: LeaveRequest[];
    payrolls: Payroll[];
    performanceReviews: PerformanceReview[];
    attendance: AttendanceRecord[];
}

interface DataContextType {
    db: MockDatabase | null;
    refreshData: () => Promise<void>;
    isLoading: boolean;
}

const defaultDb: MockDatabase = {
    users: [],
    employees: [],
    leaveRequests: [],
    payrolls: [],
    performanceReviews: [],
    attendance: []
};

export const DataContext = createContext<DataContextType>({
    db: defaultDb,
    refreshData: async () => {},
    isLoading: true,
});

export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [db, setDb] = useState<MockDatabase | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getFullDatabase();
            
            // The backend sends user objects with an `employeeId` property.
            // We need to replace this with the full `employeeDetails` object
            // for easier use on the frontend.
            const hydratedUsers = data.users.map((user: any) => {
                if (user.employeeId) {
                    const employee = data.employees.find((e: Employee) => e.id === user.employeeId);
                    const { employeeId, ...userWithoutId } = user;
                    return { ...userWithoutId, employeeDetails: employee };
                }
                return user;
            });

            setDb({ ...data, users: hydratedUsers });
        } catch (error) {
            console.error("Failed to fetch data from API:", error);
            // Optionally, set an error state here to show in the UI
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <DataContext.Provider value={{ db, refreshData: fetchData, isLoading }}>
            {isLoading ? (
                <div className="flex h-screen items-center justify-center">
                    <p className="text-lg text-gray-600">Memuat data...</p>
                </div>
            ) : (
                children
            )}
        </DataContext.Provider>
    );
};
