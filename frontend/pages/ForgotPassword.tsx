import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.submitDataChangeRequest(email); // Using a generic endpoint for simulation
            addToast('Jika email Anda terdaftar, Anda akan menerima tautan reset.', 'success');
            navigate('/login');
        } catch (error) {
             addToast(error instanceof Error ? error.message : 'Gagal mengirim permintaan.', 'error');
        } finally {
            setIsLoading(false);
        }
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
                    
                    <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
                        {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
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
