import React, { createContext, useState, useEffect, useCallback } from 'react';
import { MOCK_DB as initialDb } from '../constants';
import { User, Employee, LeaveRequest, Payroll, PerformanceReview, AttendanceRecord } from '../types';

interface MockDatabase {
    users: User[];
    employees: Employee[];
    leaveRequests: LeaveRequest[];
    payrolls: Payroll[];
    performanceReviews: PerformanceReview[];
    attendance: AttendanceRecord[];
}

interface DataContextType {
    db: MockDatabase;
    updateDb: (newDb: MockDatabase) => void;
    isLoading: boolean;
}

export const DataContext = createContext<DataContextType>({
    db: initialDb,
    // FIX: The default value for `updateDb` in `createContext` must match the `DataContextType` interface. It expects one argument but was provided with zero.
    updateDb: (newDb: MockDatabase) => {},
    isLoading: true,
});

const DB_STORAGE_KEY = 'hrms_mock_db';

// Custom hook for listening to storage events
const useEventListener = (eventName: string, handler: (event: any) => void, element = window) => {
    const savedHandler = React.useRef<(event: any) => void>();

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const isSupported = element && element.addEventListener;
        if (!isSupported) return;

        const eventListener = (event: any) => savedHandler.current && savedHandler.current(event);
        element.addEventListener(eventName, eventListener);

        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
};


export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [db, setDb] = useState<MockDatabase>(initialDb);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize DB from localStorage or use initial data
    useEffect(() => {
        try {
            const storedDb = localStorage.getItem(DB_STORAGE_KEY);
            if (storedDb) {
                setDb(JSON.parse(storedDb));
            } else {
                localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(initialDb));
            }
        } catch (error) {
            console.error("Failed to parse DB from localStorage", error);
            setDb(initialDb);
        }
        setIsLoading(false);
    }, []);

    const updateDb = useCallback((newDb: MockDatabase) => {
        setDb(newDb);
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(newDb));
    }, []);
    
    // Listen for changes from other tabs/windows
    const handleStorageChange = useCallback((event: StorageEvent) => {
        if (event.key === DB_STORAGE_KEY && event.newValue) {
            console.log("Database updated from another tab. Syncing...");
            try {
                setDb(JSON.parse(event.newValue));
            } catch (error) {
                console.error("Failed to parse DB from storage event", error);
            }
        }
    }, []);
    
    useEventListener('storage', handleStorageChange);


    return (
        <DataContext.Provider value={{ db, updateDb, isLoading }}>
            {!isLoading && children}
        </DataContext.Provider>
    );
};