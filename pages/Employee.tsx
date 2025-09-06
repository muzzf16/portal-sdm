import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Layout } from '../components/Layout';
import { EMPLOYEE_NAV_LINKS, ICONS, COMPANY_WORK_START_TIME } from '../constants';
import { Card, StatCard, PageTitle, Button, Modal, Select, Input, Textarea } from '../components/ui';
import { AuthContext } from '../App';
import { LeaveRequest, LeaveStatus, LeaveType, Payroll, PerformanceReview, AttendanceRecord, AttendanceStatus } from '../types';
import { DataContext } from '../context/DataContext';
import { useApi } from '../hooks/useApi';

const NewPayslipAlert: React.FC<{ payslipPeriod: string; onViewClick: () => void }> = ({ payslipPeriod, onViewClick }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-md shadow-sm flex justify-between items-center" role="alert">
            <div>
                <p className="font-bold">Notifikasi Slip Gaji Baru</p>
                <p>Slip gaji Anda untuk periode <strong>{payslipPeriod}</strong> telah tersedia.</p>
            </div>
            <div className="flex items-center">
                 <Button onClick={onViewClick} className="mr-4 bg-blue-500 hover:bg-blue-600 focus:ring-blue-400 text-white text-sm">
                    Lihat Slip Gaji
                </Button>
                <button onClick={() => setIsVisible(false)} className="text-blue-800 hover:text-blue-900 p-1 rounded-full hover:bg-blue-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};


const EmployeeDashboard: React.FC<{ latestNewPayslip: Payroll | null, setActiveView: (view: string) => void }> = ({ latestNewPayslip, setActiveView }) => {
    const { user } = useContext(AuthContext);
    const { db } = useContext(DataContext);
    const myRequests = db.leaveRequests.filter(r => r.employeeId === user?.employeeDetails?.id);
    const latestRequest = myRequests.length > 0 ? myRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0] : null;
    
    const statusColor = (status: LeaveStatus | undefined) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        switch(status) {
            case LeaveStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case LeaveStatus.APPROVED: return 'bg-green-100 text-green-800';
            case LeaveStatus.REJECTED: return 'bg-red-100 text-red-800';
        }
    };

    return (
        <div>
            {latestNewPayslip && (
                <NewPayslipAlert 
                    payslipPeriod={latestNewPayslip.period}
                    onViewClick={() => setActiveView('my-payslips')}
                />
            )}
            <PageTitle title="Dasbor Saya" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Sisa Cuti" value={`${user?.employeeDetails?.leaveBalance || 0} Hari`} icon={ICONS.leave} color="bg-blue-100 text-blue-600" />
                 <Card>
                    <h3 className="font-semibold text-gray-700 mb-2">Pengajuan Cuti Terakhir</h3>
                    {latestRequest ? (
                        <div>
                            <p className="text-gray-600">{latestRequest.leaveType}: {latestRequest.startDate} hingga {latestRequest.endDate}</p>
                            <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColor(latestRequest.status)}`}>{latestRequest.status}</span>
                        </div>
                    ) : <p className="text-gray-500">Tidak ada pengajuan ditemukan.</p>}
                </Card>
                <Card>
                    <h3 className="font-semibold text-gray-700 mb-2">Pengumuman Perusahaan</h3>
                    <p className="text-gray-600">Kantor akan libur pada 17 Agustus untuk Hari Kemerdekaan.</p>
                </Card>
            </div>
        </div>
    );
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border rounded-md mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
            >
                <h4 className="text-lg font-semibold text-primary-700">{title}</h4>
                <svg
                    className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t">
                    {children}
                </div>
            )}
        </div>
    );
};


const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || '-'}</p>
    </div>
);


const MyProfile: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { simulateApiCall } = useApi();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);

    if (!user || !user.employeeDetails) return <p>Memuat profil...</p>;
    
    const employee = user.employeeDetails;
    
    const handleRequestSubmit = () => {
        simulateApiCall(async () => {
            console.log("Request for data change:", requestMessage);
            setIsModalOpen(false);
            setRequestMessage('');
        }, "Mengirim permintaan perubahan data...", "Permintaan berhasil dikirim ke HR.");
    };

    return (
        <div>
            <PageTitle title="Profil Saya">
                 <Button onClick={() => setIsModalOpen(true)}>Ajukan Perubahan Data</Button>
            </PageTitle>
            
            <Card>
                <div className="flex flex-col md:flex-row items-start mb-6">
                    <img src={employee.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover mb-4 md:mb-0 md:mr-6 flex-shrink-0 border-4 border-gray-200" />
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
                        <p className="text-md text-gray-600">{employee.position}</p>
                        <p className="text-sm text-gray-500">{employee.department} - {employee.grade}</p>
                        <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {employee.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                </div>

                <CollapsibleSection title="Informasi Pekerjaan" defaultOpen>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="NIP" value={employee.nip} />
                        <DetailItem label="Email" value={user?.email} />
                        <DetailItem label="Telepon" value={employee.phone} />
                        <DetailItem label="Tanggal Bergabung" value={employee.joinDate} />
                        <DetailItem label="Sisa Cuti" value={`${employee.leaveBalance} hari`} />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Informasi Pribadi">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="Tempat, Tanggal Lahir" value={`${employee.pob}, ${employee.dob}`} />
                        <DetailItem label="Agama" value={employee.religion} />
                        <DetailItem label="Status Perkawinan" value={employee.maritalStatus} />
                        <DetailItem label="Jumlah Anak" value={employee.numberOfChildren} />
                        <div className="col-span-2 md:col-span-3">
                            <DetailItem label="Alamat" value={employee.address} />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Riwayat Pendidikan">
                    <ul className="space-y-2 list-disc list-inside">
                        {employee.educationHistory.map((edu, i) => <li key={i}><strong>{edu.level} {edu.major}</strong> di {edu.institution} (Lulus {edu.graduationYear})</li>)}
                        {employee.educationHistory.length === 0 && <p className="text-gray-500">Tidak ada data.</p>}
                    </ul>
                </CollapsibleSection>

                <CollapsibleSection title="Riwayat Pekerjaan">
                    <ul className="space-y-2 list-disc list-inside">
                         {employee.workHistory.map((work, i) => <li key={i}><strong>{work.position}</strong> di {work.company} ({work.startDate} - {work.endDate})</li>)}
                         {employee.workHistory.length === 0 && <p className="text-gray-500">Tidak ada data.</p>}
                    </ul>
                </CollapsibleSection>

                 <CollapsibleSection title="Sertifikat Pelatihan">
                    <ul className="space-y-2 list-disc list-inside">
                         {employee.trainingCertificates.map((cert, i) => <li key={i}><strong>{cert.name}</strong> dari {cert.issuer} (Diperoleh {cert.issueDate})</li>)}
                         {employee.trainingCertificates.length === 0 && <p className="text-gray-500">Tidak ada data.</p>}
                    </ul>
                </CollapsibleSection>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Formulir Permintaan Perubahan Data">
                <div className="space-y-4">
                    <Textarea 
                        label="Pesan untuk HR"
                        placeholder="Contoh: Mohon perbarui alamat saya ke alamat yang baru."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        required
                    />
                    <div className="flex justify-end pt-2">
                         <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="mr-2">Batal</Button>
                         <Button onClick={handleRequestSubmit} disabled={!requestMessage.trim()}>Kirim Permintaan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const MyAttendance: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { db, updateDb } = useContext(DataContext);
    const { simulateApiCall } = useApi();
    const today = new Date().toISOString().split('T')[0];
    const [currentTime, setCurrentTime] = useState(new Date());

    const myAttendanceHistory = db.attendance.filter(a => a.employeeId === user?.employeeDetails?.id);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Simulating today's record for demo purposes
    const demoToday = '2024-07-30';
    const todaysRecord = myAttendanceHistory.find(a => a.date === demoToday);
    
    const handleClockIn = () => {
        if (!user || !user.employeeDetails || todaysRecord) return;
        
        simulateApiCall(async () => {
            const now = new Date();
            const clockInTime = now.toLocaleTimeString('en-GB');
            const isLate = clockInTime > COMPANY_WORK_START_TIME;
            
            const newRecord: AttendanceRecord = {
                id: `att-${Date.now()}`,
                employeeId: user.employeeDetails.id,
                employeeName: user.name,
                date: today,
                clockIn: clockInTime,
                clockOut: null,
                status: isLate ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME
            };
            updateDb({ ...db, attendance: [newRecord, ...db.attendance] });
        }, "Melakukan Clock In...", `Clock In berhasil pada ${new Date().toLocaleTimeString('en-GB')}`);
    };

    const calculateDuration = (start: string, end: string): string => {
        const startTime = new Date(`${today}T${start}`);
        const endTime = new Date(`${today}T${end}`);
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHrs}j ${diffMins}m`;
    };

    const handleClockOut = () => {
        if (!todaysRecord) return;

        simulateApiCall(async () => {
            const clockOutTime = new Date().toLocaleTimeString('en-GB');
            const updatedRecord: AttendanceRecord = {
                ...todaysRecord,
                clockOut: clockOutTime,
                workDuration: todaysRecord.clockIn ? calculateDuration(todaysRecord.clockIn, clockOutTime) : undefined
            };
            const newAttendance = db.attendance.map(a => a.id === todaysRecord.id ? updatedRecord : a);
            updateDb({ ...db, attendance: newAttendance });
        }, "Melakukan Clock Out...", `Clock Out berhasil pada ${new Date().toLocaleTimeString('en-GB')}`);
    };

    const getStatusChip = (record: AttendanceRecord | undefined) => {
        if (!record || !record.clockIn) return <span className="text-gray-500">Belum Hadir</span>;
        
        const color = record.status === AttendanceStatus.LATE ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>{record.status}</span>;
    }

    return (
        <div>
            <PageTitle title="Absensi Saya" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="text-center flex flex-col items-center justify-center">
                    <p className="text-lg text-gray-600">Jam Saat Ini</p>
                    <p className="text-6xl font-bold text-primary-700 tracking-wider my-4">
                        {currentTime.toLocaleTimeString('en-GB')}
                    </p>
                    <div className="flex space-x-4 mt-4">
                        <Button 
                            onClick={handleClockIn}
                            disabled={!!todaysRecord?.clockIn}
                            className="w-32"
                        >
                            Clock In
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={handleClockOut}
                            disabled={!todaysRecord?.clockIn || !!todaysRecord?.clockOut}
                            className="w-32"
                        >
                            Clock Out
                        </Button>
                    </div>
                </Card>
                <Card>
                    <h3 className="font-semibold text-xl mb-4">Status Hari Ini</h3>
                    <div className="space-y-3 text-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Tanggal:</span>
                            <span className="font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Status Kehadiran:</span>
                            {getStatusChip(todaysRecord)}
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500">Waktu Masuk:</span>
                            <span className="font-semibold">{todaysRecord?.clockIn || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Waktu Keluar:</span>
                            <span className="font-semibold">{todaysRecord?.clockOut || '-'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500">Durasi Kerja:</span>
                            <span className="font-semibold">{todaysRecord?.workDuration || '-'}</span>
                        </div>
                    </div>
                </Card>
            </div>
            <Card className="mt-6">
                 <h3 className="font-semibold text-xl mb-4">Riwayat Absensi (7 Hari Terakhir)</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Clock In</th>
                                <th className="p-3">Clock Out</th>
                                <th className="p-3">Durasi</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myAttendanceHistory.slice(0, 7).map(rec => (
                                <tr key={rec.id} className="border-b">
                                    <td className="p-3">{rec.date}</td>
                                    <td className="p-3">{rec.clockIn}</td>
                                    <td className="p-3">{rec.clockOut || '-'}</td>
                                    <td className="p-3">{rec.workDuration || '-'}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.status === AttendanceStatus.LATE ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                             {myAttendanceHistory.length === 0 && (
                                <tr><td colSpan={5} className="text-center p-4 text-gray-500">Tidak ada riwayat absensi.</td></tr>
                             )}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </div>
    );
};


const MyLeave: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { db, updateDb } = useContext(DataContext);
    const { simulateApiCall } = useApi();
    const myRequests = db.leaveRequests.filter(r => r.employeeId === user?.employeeDetails?.id);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleApplyLeave = (newRequest: Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'status'>) => {
        if(!user || !user.employeeDetails) return;
        
        simulateApiCall(async () => {
            const request: LeaveRequest = {
                id: `leave-${Date.now()}`,
                employeeId: user.employeeDetails.id,
                employeeName: user.name,
                status: LeaveStatus.PENDING,
                ...newRequest
            };
            updateDb({ ...db, leaveRequests: [request, ...db.leaveRequests] });
            setIsModalOpen(false);
        }, "Mengirim pengajuan cuti...");
    };
    
    const statusColor = (status: LeaveStatus) => {
        switch(status) {
            case LeaveStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case LeaveStatus.APPROVED: return 'bg-green-100 text-green-800';
            case LeaveStatus.REJECTED: return 'bg-red-100 text-red-800';
        }
    };

    return (
        <div>
            <PageTitle title="Pengajuan Cuti Saya">
                <Button onClick={() => setIsModalOpen(true)}>Ajukan Cuti</Button>
            </PageTitle>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3">Jenis</th>
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Alasan</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.map(req => (
                                <tr key={req.id} className="border-b">
                                    <td className="p-3">{req.leaveType}</td>
                                    <td className="p-3">{req.startDate} hingga {req.endDate}</td>
                                    <td className="p-3 max-w-xs truncate">{req.reason}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(req.status)}`}>{req.status}</span></td>
                                    <td className="p-3 text-sm text-gray-600">
                                        {req.status === LeaveStatus.REJECTED && req.rejectionReason 
                                            ? req.rejectionReason 
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && <LeaveApplicationForm onSubmit={handleApplyLeave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const LeaveApplicationForm: React.FC<{onClose: () => void, onSubmit: (data: any) => void}> = ({onClose, onSubmit}) => {
    const [formData, setFormData] = useState({
        leaveType: LeaveType.ANNUAL,
        startDate: '',
        endDate: '',
        reason: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Ajukan Cuti">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select label="Jenis Cuti" name="leaveType" value={formData.leaveType} onChange={handleChange}>
                    {Object.values(LeaveType).map(type => <option key={type} value={type}>{type}</option>)}
                </Select>
                <Input label="Tanggal Mulai" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required/>
                <Input label="Tanggal Selesai" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required/>
                <Textarea label="Alasan" name="reason" value={formData.reason} onChange={handleChange} required/>
                <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Batal</Button>
                    <Button type="submit">Kirim</Button>
                </div>
            </form>
        </Modal>
    );
};

const PerformanceReviewDetailModal: React.FC<{ review: PerformanceReview; onSaveFeedback: (reviewId: string, feedback: string) => void; onClose: () => void; }> = ({ review, onSaveFeedback, onClose }) => {
    const [employeeFeedback, setEmployeeFeedback] = useState(review.employeeFeedback || '');

    const handleSave = () => {
        onSaveFeedback(review.id, employeeFeedback);
    };

    const scoreColor = (score: number) => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-blue-600';
        if (score >= 2) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getBarFillColor = (score: number) => {
        if (score >= 4) return '#16a34a'; // green-600
        if (score >= 3) return '#2563eb'; // blue-600
        if (score >= 2) return '#ca8a04'; // yellow-600
        return '#dc2626'; // red-600
    };


    return (
        <Modal isOpen={true} onClose={onClose} title={`Detail Kinerja - ${review.period}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-2 space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">SKOR KESELURUHAN</p>
                    <p className={`text-5xl font-bold ${scoreColor(review.overallScore)}`}>{review.overallScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">Dinilai oleh {review.reviewerName} pada {review.reviewDate}</p>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2">Rincian KPI</h4>
                    <div className="space-y-4">
                        {review.kpis.map(kpi => (
                            <div key={kpi.id} className="p-3 border rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold pr-2">{kpi.metric}</p>
                                            <p className={`font-bold text-xl flex-shrink-0 ${scoreColor(kpi.score)}`}>{kpi.score}/5</p>
                                        </div>
                                        <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-4 mt-1">
                                            <p><strong>Target:</strong> {kpi.target}</p>
                                            <p><strong>Hasil:</strong> {kpi.result}</p>
                                        </div>
                                        {kpi.notes && <p className="text-xs text-gray-500 mt-2"><em>Catatan: {kpi.notes}</em></p>}
                                    </div>
                                    <div>
                                        <ResponsiveContainer width="100%" height={40}>
                                            <BarChart
                                                layout="vertical"
                                                data={[{ name: 'Skor', score: kpi.score }]}
                                                margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                                            >
                                                <XAxis type="number" domain={[0, 5]} hide />
                                                <YAxis type="category" dataKey="name" hide />
                                                <Tooltip 
                                                    cursor={{fill: 'transparent'}} 
                                                    formatter={(value: number) => [`${value} / 5`, 'Skor']}
                                                />
                                                <Bar dataKey="score" barSize={15} background={{ fill: '#eee', radius: 4 }} radius={4}>
                                                    <Cell fill={getBarFillColor(kpi.score)} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2">Umpan Balik Penilai</h4>
                    <div className="bg-blue-50 p-3 rounded-md">
                        <p className="font-semibold">Kekuatan:</p>
                        <p className="text-gray-700 text-sm mb-2">{review.strengths}</p>
                        <p className="font-semibold">Area Peningkatan:</p>
                        <p className="text-gray-700 text-sm">{review.areasForImprovement}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2">Tanggapan Anda</h4>
                    <Textarea 
                        label=""
                        value={employeeFeedback}
                        onChange={(e) => setEmployeeFeedback(e.target.value)}
                        placeholder="Berikan tanggapan Anda di sini..."
                        rows={4}
                        disabled={!!review.employeeFeedback}
                    />
                     {review.employeeFeedback && <p className="text-xs text-gray-500 mt-1">Tanggapan sudah dikirim dan tidak bisa diubah.</p>}
                </div>
            </div>
             <div className="flex justify-end pt-6 mt-4 border-t">
                <Button variant="secondary" onClick={onClose} className="mr-2">Tutup</Button>
                {!review.employeeFeedback && <Button onClick={handleSave}>Kirim Tanggapan</Button>}
            </div>
        </Modal>
    );
};

const MyPerformance: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { db, updateDb } = useContext(DataContext);
    const { simulateApiCall } = useApi();
    const myReviews = db.performanceReviews.filter(r => r.employeeId === user?.employeeDetails?.id);

    const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

    const handleSaveFeedback = (reviewId: string, feedback: string) => {
        simulateApiCall(async () => {
            const newReviews = db.performanceReviews.map(r => r.id === reviewId ? { ...r, employeeFeedback: feedback } : r);
            updateDb({ ...db, performanceReviews: newReviews });
            setSelectedReview(null); // Close modal on save
        }, "Mengirim tanggapan Anda...");
    };
    
    return (
        <div>
            <PageTitle title="Riwayat Kinerja Saya" />
            <Card>
                <ul className="space-y-3">
                    {myReviews.sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()).map(review => (
                        <li key={review.id} className="p-4 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-lg">Penilaian Kinerja - {review.period}</p>
                                <p className="text-gray-600">Skor Akhir: <span className="font-bold">{review.overallScore}</span></p>
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedReview(review)}>Lihat Detail</Button>
                        </li>
                    ))}
                    {myReviews.length === 0 && <p className="text-center text-gray-500">Belum ada riwayat penilaian kinerja.</p>}
                </ul>
            </Card>
            {selectedReview && (
                <PerformanceReviewDetailModal 
                    review={selectedReview} 
                    onClose={() => setSelectedReview(null)}
                    onSaveFeedback={handleSaveFeedback}
                />
            )}
        </div>
    );
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const PayslipDetailModal: React.FC<{ payslip: Payroll; onClose: () => void }> = ({ payslip, onClose }) => {
    const { user } = useContext(AuthContext);
    const employee = user?.employeeDetails;

    const handleDownload = () => {
        alert("Simulasi unduh PDF dimulai...");
        console.log("Downloading payslip:", payslip);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Slip Gaji - ${payslip.period}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold">PT. MAJU BERSAMA</h3>
                    <p className="text-md">SLIP GAJI KARYAWAN</p>
                    <p className="text-sm text-gray-500">Periode: {payslip.period}</p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><strong>Nama:</strong> {payslip.employeeName}</p>
                        <p><strong>NIP:</strong> {employee?.nip}</p>
                    </div>
                    <div>
                        <p><strong>Jabatan:</strong> {employee?.position}</p>
                        <p><strong>Departemen:</strong> {employee?.department}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pendapatan */}
                    <div className="border rounded-md p-4">
                        <h4 className="font-bold text-lg mb-3 text-green-700">PENDAPATAN</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Gaji Pokok</span><span className="font-semibold">{formatCurrency(payslip.baseSalary)}</span></div>
                            {payslip.incomes.map(item => (
                                <div key={item.id} className="flex justify-between"><span>{item.name}</span><span className="font-semibold">{formatCurrency(item.amount)}</span></div>
                            ))}
                        </div>
                        <div className="flex justify-between font-bold text-md mt-4 pt-2 border-t">
                            <span>TOTAL PENDAPATAN</span>
                            <span>{formatCurrency(payslip.totalIncome)}</span>
                        </div>
                    </div>
                    {/* Potongan */}
                     <div className="border rounded-md p-4">
                        <h4 className="font-bold text-lg mb-3 text-red-700">POTONGAN</h4>
                        <div className="space-y-2 text-sm">
                            {payslip.deductions.map(item => (
                                <div key={item.id} className="flex justify-between"><span>{item.name}</span><span className="font-semibold">{formatCurrency(item.amount)}</span></div>
                            ))}
                        </div>
                        <div className="flex justify-between font-bold text-md mt-4 pt-2 border-t">
                            <span>TOTAL POTONGAN</span>
                            <span>{formatCurrency(payslip.totalDeductions)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-100 text-primary-900 font-bold text-xl p-4 mt-6 rounded-md flex justify-between items-center">
                    <span>GAJI BERSIH (Take Home Pay)</span>
                    <span>{formatCurrency(payslip.netSalary)}</span>
                </div>
            </div>
            <div className="flex justify-end pt-6 mt-4 border-t">
                <Button variant="secondary" onClick={onClose} className="mr-2">Tutup</Button>
                <Button onClick={handleDownload}>Unduh PDF</Button>
            </div>
        </Modal>
    );
};


const MyPayslips: React.FC<{ onMount: () => void }> = ({ onMount }) => {
    useEffect(() => {
        onMount();
    }, [onMount]);

    const { user } = useContext(AuthContext);
    const { db } = useContext(DataContext);
    const myPayslips = db.payrolls.filter(p => p.employeeId === user?.employeeDetails?.id);
    const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

    return (
        <div>
            <PageTitle title="Slip Gaji Saya" />
            <Card>
                <ul className="space-y-3">
                    {myPayslips.map(p => (
                        <li key={p.id} className="p-4 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-lg">{p.period} Slip Gaji</p>
                                <p className="text-gray-600">Gaji Bersih: {formatCurrency(p.netSalary)}</p>
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedPayslip(p)}>Lihat Rincian</Button>
                        </li>
                    ))}
                     {myPayslips.length === 0 && <p className="text-center text-gray-500">Belum ada data slip gaji.</p>}
                </ul>
            </Card>
            {selectedPayslip && <PayslipDetailModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />}
        </div>
    );
};


export const EmployeePage: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const { user } = useContext(AuthContext);
    const { db } = useContext(DataContext);
    const [newPayslips, setNewPayslips] = useState<Payroll[]>([]);

    const VIEWED_PAYSLIPS_KEY = useMemo(() => `hrms_viewed_payslips_${user?.id}`, [user?.id]);

    useEffect(() => {
        if (!user?.employeeDetails || !VIEWED_PAYSLIPS_KEY) return;
        
        const getFromStorage = <T,>(key: string, defaultValue: T): T => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn(`Error reading from localStorage key “${key}”:`, error);
                return defaultValue;
            }
        };

        const myPayslips = db.payrolls.filter(p => p.employeeId === user.employeeDetails.id);
        const viewedPayslips = getFromStorage<string[]>(VIEWED_PAYSLIPS_KEY, []);
        const unreadPayslips = myPayslips
            .filter(p => !viewedPayslips.includes(p.id))
            .sort((a, b) => b.id.localeCompare(a.id));

        setNewPayslips(unreadPayslips);
    }, [db.payrolls, user?.employeeDetails, VIEWED_PAYSLIPS_KEY]);

    const markPayslipsAsViewed = useCallback(() => {
        if (!user?.employeeDetails || newPayslips.length === 0) return;

        const myCurrentPayslipIds = db.payrolls
            .filter(p => p.employeeId === user.employeeDetails.id)
            .map(p => p.id);
        
        localStorage.setItem(VIEWED_PAYSLIPS_KEY, JSON.stringify(myCurrentPayslipIds));
        setNewPayslips([]);
    }, [db.payrolls, user?.employeeDetails, VIEWED_PAYSLIPS_KEY, newPayslips.length]);

    const navLinksWithBadge = useMemo(() => {
        return EMPLOYEE_NAV_LINKS.map(link => {
            if (link.view === 'my-payslips' && newPayslips.length > 0) {
                return { ...link, badge: newPayslips.length };
            }
            return link;
        });
    }, [newPayslips.length]);

    const latestNewPayslip = newPayslips.length > 0 ? newPayslips[0] : null;

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <EmployeeDashboard latestNewPayslip={latestNewPayslip} setActiveView={setActiveView} />;
            case 'profile': return <MyProfile />;
            case 'my-attendance': return <MyAttendance />;
            case 'my-leave': return <MyLeave />;
            case 'my-performance': return <MyPerformance />;
            case 'my-payslips': return <MyPayslips onMount={markPayslipsAsViewed} />;
            default: return <EmployeeDashboard latestNewPayslip={latestNewPayslip} setActiveView={setActiveView} />;
        }
    };
    
    return (
        <Layout navLinks={navLinksWithBadge} activeView={activeView} setActiveView={setActiveView}>
            {renderContent()}
        </Layout>
    );
};
