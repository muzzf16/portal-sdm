import React, { useState, createContext, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role } from './types';
import { LoginPage } from './pages/Login';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { AdminPage } from './pages/Admin';
import { EmployeePage } from './pages/Employee';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { LandingPage } from './pages/Landing';
import { ResetPasswordPage } from './pages/ResetPassword';

interface AuthContextType {
    user: User | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUserAvatar: (avatarUrl: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => {},
    logout: () => {},
    updateUserAvatar: () => {},
});

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('hrms_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = useCallback(async (userData: User, token: string) => {
        localStorage.setItem('hrms_user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('hrms_user');
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    const updateUserAvatar = useCallback((avatarUrl: string) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const updatedUser = { ...currentUser, avatar: avatarUrl };
            localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    const authContextValue = useMemo(() => ({ user, login, logout, updateUserAvatar }), [user, login, logout, updateUserAvatar]);

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
                                    <Route path="/register" element={<Navigate to="/login" replace />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                                    
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