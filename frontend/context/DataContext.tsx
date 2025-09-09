import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, Employee, LeaveRequest, Payroll, PerformanceReview, AttendanceRecord, DataChangeRequest } from '../types';
import api from '../services/api';

export interface MockDatabase {
    users: User[];
    employees: Employee[];
    leaveRequests: LeaveRequest[];
    payrolls: Payroll[];
    performanceReviews: PerformanceReview[];
    attendance: AttendanceRecord[];
    dataChangeRequests: DataChangeRequest[];
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

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getFullDatabase();
            
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
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const contextValue = {
        db,
        refreshData: fetchData,
        isLoading
    };

    if (isLoading) {
        return (
            <DataContext.Provider value={contextValue}>
                <div className="flex h-screen items-center justify-center">
                    <p className="text-lg text-gray-600">Memuat data...</p>
                </div>
            </DataContext.Provider>
        );
    }

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};
