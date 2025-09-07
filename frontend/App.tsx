
import React, { useState, createContext, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role } from './types';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
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
            // This should not be reached with the new routing logic, but as a safe fallback,
            // redirect to the login page.
            return <Navigate to="/login" replace />;
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
                                    {/* Redirect auth-related pages to the main app dashboard if already logged in */}
                                    <Route path="/login" element={<Navigate to="/" replace />} />
                                    <Route path="/register" element={<Navigate to="/" replace />} />
                                    <Route path="/forgot-password" element={<Navigate to="/" replace />} />
                                    
                                    {/* The authenticated app handles all other routes, including the root "/" */}
                                    <Route path="/*" element={renderAuthenticatedApp()} />
                                </>
                            ) : (
                                <>
                                    {/* Publicly accessible routes for non-authenticated users */}
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    
                                    {/* Redirect any other path to the landing page if not logged in */}
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