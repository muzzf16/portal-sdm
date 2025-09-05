
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { ICONS } from '../constants';

// FIX: Changed icon prop type to React.ReactElement to fix cloneElement type error. The original type was too generic for TypeScript to know about the `className` prop.
const FeatureCard: React.FC<{ icon: React.ReactElement; title: string; description: string }> = ({ icon, title, description }) => (
    <Card className="text-center p-8 flex flex-col items-center">
        <div className="bg-primary-100 text-primary-600 p-4 rounded-full mb-4">
            {React.cloneElement(icon, { className: "h-8 w-8" })}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </Card>
);

export const LandingPage: React.FC = () => {
    return (
        <div className="bg-white text-gray-800">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" /></svg>
                        <h1 className="text-2xl font-bold text-gray-800">Portal SDM</h1>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-primary-600">Fitur</a>
                        <a href="#about" className="text-gray-600 hover:text-primary-600">Tentang Kami</a>
                    </nav>
                    <Link to="/login">
                        <Button variant="primary">Masuk</Button>
                    </Link>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="bg-primary-50 pt-32 pb-20">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-6xl font-extrabold text-primary-900 mb-4 leading-tight">
                            Manajemen SDM Modern di Ujung Jari Anda
                        </h2>
                        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                            Sederhanakan proses SDM, tingkatkan keterlibatan karyawan, dan fokus pada hal yang paling penting: mengembangkan tim Anda.
                        </p>
                        <Link to="/login">
                            <Button variant="primary" className="text-lg px-8 py-4">
                                Masuk ke Portal
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Fitur Unggulan Kami</h2>
                            <p className="text-gray-600 mt-2">Semua yang Anda butuhkan dalam satu platform terintegrasi.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={ICONS.employees} 
                                title="Manajemen Karyawan" 
                                description="Kelola data karyawan secara terpusat, mulai dari informasi pribadi hingga riwayat pekerjaan."
                            />
                            <FeatureCard 
                                icon={ICONS.leave} 
                                title="Pengajuan Cuti Online" 
                                description="Proses pengajuan dan persetujuan cuti yang mudah dan transparan, langsung dari aplikasi."
                            />
                            <FeatureCard 
                                icon={ICONS.payroll} 
                                title="Penggajian Otomatis" 
                                description="Hitung gaji, tunjangan, dan potongan secara akurat dan efisien setiap periode."
                            />
                            <FeatureCard 
                                icon={ICONS.performance} 
                                title="Penilaian Kinerja" 
                                description="Lacak KPI dan berikan umpan balik yang konstruktif untuk pengembangan karyawan."
                            />
                            <FeatureCard 
                                icon={ICONS.attendance} 
                                title="Absensi Digital" 
                                description="Pantau kehadiran karyawan dengan sistem clock-in/clock-out yang mudah digunakan."
                            />
                             <FeatureCard 
                                icon={ICONS.reports} 
                                title="Laporan Komprehensif" 
                                description="Hasilkan laporan SDM yang informatif untuk mendukung pengambilan keputusan strategis."
                            />
                        </div>
                    </div>
                </section>
                
                {/* About Section */}
                <section id="about" className="py-20 bg-gray-50">
                     <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Dibangun untuk Efisiensi</h2>
                         <p className="text-gray-600 mt-4 max-w-3xl mx-auto">
                            Portal SDM kami dirancang untuk menghilangkan tugas administratif yang berulang, memungkinkan tim SDM Anda untuk menjadi mitra strategis bagi pertumbuhan bisnis. Dengan antarmuka yang intuitif dan alur kerja yang cerdas, kami memberdayakan baik admin maupun karyawan.
                         </p>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-primary-900 text-white py-6">
                <div className="container mx-auto px-6 text-center">
                    <p>&copy; {new Date().getFullYear()} Portal SDM. Seluruh hak cipta.</p>
                </div>
            </footer>
        </div>
    );
};