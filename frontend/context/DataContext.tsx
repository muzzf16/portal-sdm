import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, Employee, LeaveRequest, Payroll, PerformanceReview, AttendanceRecord, DataChangeRequest } from '../types';
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

            setDb({ ...data, users: hydratedUsers, employees: employeesWithUsers });
            
            // If there's a current user, update their data with the latest from the database
            if (currentUser) {
                const updatedUser = hydratedUsers.find((u: User) => u.id === currentUser.id);
                if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
                    updateCurrentUser(updatedUser);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data from API:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, updateCurrentUser]);

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
