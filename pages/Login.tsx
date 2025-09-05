
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { MOCK_DB } from '../constants';
import { Role } from '../types';
import { Button, Card } from '../components/ui';

export const LoginPage: React.FC = () => {
    const { login } = useContext(AuthContext);

    const handleLogin = (role: Role) => {
        const userToLogin = MOCK_DB.users.find(u => u.role === role);
        if (userToLogin) {
            login(userToLogin);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-8">
                 <Link to="/" className="flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" /></svg>
                    <h1 className="text-4xl font-bold">Portal SDM</h1>
                 </Link>
                 <p className="text-gray-500 text-lg mt-2">Masuk untuk mengakses dasbor Anda.</p>
            </div>
            <Card className="w-full max-w-sm">
                 <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Pilih Peran Anda</h2>
                 <div className="space-y-4">
                    <Button
                        onClick={() => handleLogin(Role.ADMIN)}
                        className="w-full text-lg py-3"
                        variant="primary"
                    >
                        Masuk sebagai Admin (SDM)
                    </Button>
                    <Button
                        onClick={() => handleLogin(Role.EMPLOYEE)}
                        className="w-full text-lg py-3"
                        variant="secondary"
                    >
                        Masuk sebagai Karyawan
                    </Button>
                 </div>
                 <div className="text-center mt-6">
                    <Link to="/" className="text-sm text-primary-600 hover:underline">
                        &larr; Kembali ke Halaman Utama
                    </Link>
                 </div>
            </Card>
        </div>
    );
};
