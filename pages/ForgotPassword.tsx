
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import { DataContext } from '../context/DataContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const { db } = useContext(DataContext);
    const { simulateApiCall } = useApi();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailExists = db.users.some(user => user.email.toLowerCase() === email.toLowerCase());
        
        if (!emailExists) {
            // To prevent user enumeration, we show the same message regardless of whether the email exists.
            // But for this mock app, we can show an error for clarity.
            setError('Email tidak ditemukan di sistem kami.');
            return;
        }

        await simulateApiCall(async () => {
            // In a real app, this would trigger a backend service to send an email.
            console.log(`Password reset link sent to: ${email}`);
        }, `Mengirim tautan reset ke ${email}...`, 'Tautan reset kata sandi telah dikirim.');
        
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-8">
                <Link to="/" className="flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" /></svg>
                    <h1 className="text-4xl font-bold">Portal SDM</h1>
                </Link>
            </div>
            <Card className="w-full max-w-sm">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Lupa Kata Sandi</h2>
                <p className="text-center text-gray-500 mb-6">Masukkan email Anda untuk menerima tautan reset.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Alamat Email" 
                        name="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        placeholder="anda@perusahaan.com"
                    />
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <Button type="submit" className="w-full text-lg py-3">
                        Kirim Tautan Reset
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm text-primary-600 hover:underline">
                        &larr; Kembali ke Halaman Login
                    </Link>
                </div>
            </Card>
        </div>
    );
};
