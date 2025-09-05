
import React, { useState, createContext, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role } from './types';
import { LoginPage } from './pages/Login';
import { AdminPage } from './pages/Admin';
import { EmployeePage } from './pages/Employee';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { LandingPage } from './pages/Landing';

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

    const renderAuthenticatedApp = () => {
        if (!user) {
            // Should not happen with the new routing, but as a fallback.
            return <Navigate to="/" replace />;
        }
        return user.role === Role.ADMIN ? <AdminPage /> : <EmployeePage />;
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            <DataProvider>
                <ToastProvider>
                    <HashRouter>
                        <Routes>
                            {user ? (
                                <>
                                    {/* All authenticated routes are handled within the Admin/Employee pages */}
                                    <Route path="/*" element={renderAuthenticatedApp()} />
                                </>
                            ) : (
                                <>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    {/* Redirect any other path to landing if not logged in */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </>
                            )}
                        </Routes>
                    </HashRouter>
                </ToastProvider>
            </DataProvider>
        </AuthContext.Provider>
    );
};

export default App;
