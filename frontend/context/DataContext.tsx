import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { User, Employee, LeaveRequest, Payroll, PerformanceReview, AttendanceRecord, DataChangeRequest, Announcement } from '../types';
import api from '../services/api';
import { AuthContext } from '../App';

export interface MockDatabase {
    users: User[];
    employees: Employee[];
    leaveRequests: LeaveRequest[];
    payrolls: Payroll[];
    performanceReviews: PerformanceReview[];
    attendance: AttendanceRecord[];
    dataChangeRequests: DataChangeRequest[];
    announcements: Announcement[];
}

interface DataContextType {
    db: MockDatabase | null;
    refreshData: () => Promise<void>;
    isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

interface DataProviderProps {
    children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const [db, setDb] = useState<MockDatabase | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser, login: updateCurrentUser } = useContext(AuthContext);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getFullDatabase();
            
            const hydratedUsers = data.users.map((user: any) => {
                if (user.employeeId) {
                    const employee = data.employees.find((e: Employee) => e.id === user.employeeId);
                    if (employee) {
                        // Keep the employeeId property and add employeeDetails
                        return { ...user, employeeDetails: employee };
                    }
                }
                // Return users without employee details as is
                return user;
            });

            // Don't filter out employees - keep all employees in the database
            const employeesWithUsers = data.employees;

            setDb(JSON.parse(JSON.stringify({ ...data, users: hydratedUsers, employees: employeesWithUsers })));
        } catch (error) {
            console.error("Failed to fetch data from API:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!db) {
            fetchData();
        }
    }, [db, fetchData]);

    const contextValue = useMemo(() => ({
        db,
        refreshData: fetchData,
        isLoading
    }), [db, isLoading, fetchData]);

    return (
        <DataContext.Provider value={contextValue}>
            {isLoading && !db ? (
                <div className="d-flex vh-100 align-items-center justify-content-center">
                    <p className="text-lg text-muted">Memuat data...</p>
                </div>
            ) : (
                children
            )}
        </DataContext.Provider>
    );
};