import React, { useState, createContext, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role } from './types';
import { LoginPage } from './pages/Login';
import { AdminPage } from './pages/Admin';
import { EmployeePage } from './pages/Employee';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => {},
    logout: () => {},
});

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('hrms_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = useCallback((userData: User) => {
        localStorage.setItem('hrms_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('hrms_user');
        setUser(null);
    }, []);

    const authContextValue = useMemo(() => ({ user, login, logout }), [user, login, logout]);

    const renderApp = () => {
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        if (user.role === Role.ADMIN) {
            return <AdminPage />;
        }
        if (user.role === Role.EMPLOYEE) {
            return <EmployeePage />;
        }
        return <Navigate to="/login" replace />;
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            <DataProvider>
                <ToastProvider>
                    <HashRouter>
                        <Routes>
                            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
                            <Route path="/*" element={renderApp()} />
                        </Routes>
                    </HashRouter>
                </ToastProvider>
            </DataProvider>
        </AuthContext.Provider>
    );
};

export default App;
