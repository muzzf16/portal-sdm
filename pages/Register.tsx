
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import { DataContext } from '../context/DataContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { Employee, User, Role } from '../types';

export const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { db, updateDb } = useContext(DataContext);
    const { simulateApiCall } = useApi();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
            return;
        }

        const emailExists = db.users.some(user => user.email.toLowerCase() === formData.email.toLowerCase());
        if (emailExists) {
            setError('Email ini sudah terdaftar. Silakan gunakan email lain.');
            return;
        }

        await simulateApiCall(async () => {
            const newEmployeeId = `emp-${Date.now()}`;
            const newUserId = `user-${Date.now()}`;
            const joinDate = new Date().toISOString().split('T')[0];

            const newEmployee: Employee = {
                id: newEmployeeId,
                nip: `NIP${Date.now().toString().slice(-4)}`,
                position: 'Staf Junior',
                grade: '1A',
                department: 'Belum Ditentukan',
                joinDate,
                avatarUrl: `https://picsum.photos/seed/${newEmployeeId}/200`,
                leaveBalance: 12,
                isActive: true,
                address: '',
                phone: '',
                pob: '',
                dob: '',
                religion: 'Lainnya',
                maritalStatus: 'Lajang',
                numberOfChildren: 0,
                educationHistory: [],
                workHistory: [],
                trainingCertificates: [],
                payrollInfo: { baseSalary: 5000000, incomes: [], deductions: [] }
            };

            const newUser: User = {
                id: newUserId,
                name: formData.name,
                email: formData.email,
                role: Role.EMPLOYEE,
                employeeDetails: newEmployee,
            };

            updateDb({
                ...db,
                employees: [...db.employees, newEmployee],
                users: [...db.users, newUser]
            });

        }, 'Mendaftarkan akun baru...', 'Registrasi berhasil! Silakan masuk.');
        
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-8">
                <Link to="/" className="flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" /></svg>
                    <h1 className="text-4xl font-bold">Portal SDM</h1>
                </Link>
                <p className="text-gray-500 text-lg mt-2">Buat akun untuk memulai.</p>
            </div>
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Buat Akun Baru</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nama Lengkap" name="name" type="text" value={formData.name} onChange={handleChange} required />
                    <Input label="Alamat Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    <Input label="Kata Sandi" name="password" type="password" value={formData.password} onChange={handleChange} required />
                    <Input label="Konfirmasi Kata Sandi" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <Button type="submit" className="w-full text-lg py-3">
                        Daftar
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm text-primary-600 hover:underline">
                        Sudah punya akun? Masuk di sini
                    </Link>
                </div>
            </Card>
        </div>
    );
};
