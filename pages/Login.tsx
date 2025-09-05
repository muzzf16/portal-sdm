
import React, { useContext } from 'react';
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
        <div className="min-h-screen bg-primary-900 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-8">
                 <h1 className="text-5xl font-bold text-white mb-2">Portal SDM</h1>
                 <p className="text-primary-200 text-lg">Solusi Manajemen Sumber Daya Manusia lengkap Anda.</p>
            </div>
            <Card className="w-full max-w-sm">
                 <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Pilih Peran Anda untuk Masuk</h2>
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
            </Card>
        </div>
    );
};
