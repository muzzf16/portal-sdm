import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Layout } from '../components/Layout';
import { EMPLOYEE_NAV_LINKS, ICONS, COMPANY_WORK_START_TIME } from '../constants';
import { Card, StatCard, PageTitle, Button, Modal, Select, Input, Textarea } from '../components/ui';
import { AuthContext } from '../App';
import { LeaveRequest, LeaveStatus, LeaveType, Payroll, PerformanceReview, AttendanceRecord, AttendanceStatus } from '../types';
import { useData } from '../context/DataContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';

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


interface LeaveSummary {
    initialAllotment: number;
    nationalHolidays: number;
    approvedLeaveTaken: number;
    currentBalance: number;
    calculatedRemaining: number;
}

const EmployeeDashboard: React.FC<{ latestNewPayslip: Payroll | null, setActiveView: (view: string) => void }> = ({ latestNewPayslip, setActiveView }) => {
    const { user } = useContext(AuthContext);
    const { db } = useData();
    const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);

    useEffect(() => {
        const fetchLeaveSummary = async () => {
            if (user?.employeeDetails?.id) {
                try {
                    const summary = await api.getLeaveSummary(user.employeeDetails.id);
                    console.log("Leave Summary from API:", summary); // Tambahkan log ini
                    setLeaveSummary(summary);
                } catch (error) {
                    console.error("Failed to fetch leave summary:", error);
                }
            }
        };
        fetchLeaveSummary();
    }, [user?.employeeDetails?.id]);
    
    if (!db || !user) return null;

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
                <StatCard title="Sisa Cuti" value={leaveSummary ? `${leaveSummary.calculatedRemaining} hari` : 'Menghitung...'} icon={ICONS.leave} color="bg-blue-100 text-blue-600" />
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
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');

    if (!user || !user.employeeDetails) return <p>Memuat profil...</p>;
    
    const employee = user.employeeDetails;
    
    const handleRequestSubmit = async () => {
        try {
            await api.submitDataChangeRequest(requestMessage, employee.id, user.name);
            addToast("Permintaan berhasil dikirim ke HR.", 'success');
            setIsModalOpen(false);
            setRequestMessage('');
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal mengirim permintaan.", 'error');
        }
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
                        <p className="text-sm text-gray-500">{employee.department} - {employee.pangkat} ({employee.golongan})</p>
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
    const { db, refreshData } = useData();
    const { addToast } = useToast();
    const today = new Date().toISOString().split('T')[0];
    const [currentTime, setCurrentTime] = useState(new Date());

    const myAttendanceHistory = db!.attendance.filter(a => a.employeeId === user?.employeeDetails?.id);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const todaysRecord = myAttendanceHistory.find(a => a.date === today);
    
    const handleClockIn = async () => {
        if (!user || !user.employeeDetails || todaysRecord) return;
        
        try {
            await api.clockIn(user.employeeDetails.id, user.name);
            addToast(`Clock In berhasil pada ${new Date().toLocaleTimeString('en-GB')}`, 'success');
            await refreshData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal melakukan Clock In", 'error');
        }
    };

    const handleClockOut = async () => {
        if (!todaysRecord || !user.employeeDetails) return;

        try {
            await api.clockOut(user.employeeDetails.id);
            addToast(`Clock Out berhasil pada ${new Date().toLocaleTimeString('en-GB')}`, 'success');
            await refreshData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal melakukan Clock Out", 'error');
        }
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
    const { db, refreshData } = useData();
    const { addToast } = useToast();
    const myRequests = db!.leaveRequests.filter(r => r.employeeId === user?.employeeDetails?.id);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleApplyLeave = async (newRequestData: any) => {
        if(!user || !user.employeeDetails) return;
        
        try {
            const { supportingDocument, ...requestData } = newRequestData;
            
            const request = {
                employeeId: user.employeeDetails.id,
                employeeName: user.name,
                ...requestData
            };
            
            // If there's a supporting document, pass it to the API call
            await api.submitLeaveRequest(request, supportingDocument);
            addToast("Pengajuan cuti berhasil dikirim.", 'success');
            await refreshData();
            setIsModalOpen(false);
        } catch(error) {
            addToast(error instanceof Error ? error.message : "Gagal mengirim pengajuan.", 'error');
        }
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
    const [supportingDocument, setSupportingDocument] = useState<File | null>(null);
    const [documentPreview, setDocumentPreview] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSupportingDocument(file);
            
            // Generate preview for image files
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setDocumentPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setDocumentPreview(null);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            supportingDocument: supportingDocument
        });
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
                
                {/* Document upload field - only show for sick leave */}
                {formData.leaveType === LeaveType.SICK && (
                    <div className="border p-4 rounded-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unggah Surat Keterangan Dokter
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary-600 file:text-white
                                hover:file:bg-primary-700"
                        />
                        {documentPreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Pratinjau dokumen:</p>
                                <img src={documentPreview} alt="Document preview" className="max-h-40 rounded" />
                            </div>
                        )}
                        {supportingDocument && (
                            <p className="mt-2 text-sm text-gray-500">
                                File terpilih: {supportingDocument.name}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Format yang diterima: PDF, JPG, JPEG, PNG. Maksimal 5MB.
                        </p>
                    </div>
                )}
                
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
    const { db, refreshData } = useData();
    const { addToast } = useToast();
    const myReviews = db!.performanceReviews.filter(r => r.employeeId === user?.employeeDetails?.id);

    const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

    const handleSaveFeedback = async (reviewId: string, feedback: string) => {
        try {
            await api.submitPerformanceFeedback(reviewId, feedback);
            addToast("Tanggapan Anda berhasil dikirim.", 'success');
            await refreshData();
            setSelectedReview(null); // Close modal on save
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal mengirim tanggapan.", 'error');
        }
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
        // Create a new jsPDF instance
        const doc = new jsPDF();
        
        // Set document properties
        doc.setProperties({
            title: `Slip Gaji - ${payslip.period}`
        });
        
        // Add company header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("PT. MAJU BERSAMA", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("SLIP GAJI KARYAWAN", 105, 30, { align: "center" });
        
        doc.setFontSize(12);
        doc.text(`Periode: ${payslip.period}`, 105, 40, { align: "center" });
        
        // Add employee information
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Informasi Karyawan:", 20, 55);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Nama: ${payslip.employeeName}`, 20, 65);
        doc.text(`NIP: ${employee?.nip || '-'}`, 20, 72);
        doc.text(`Jabatan: ${employee?.position || '-'}`, 20, 79);
        doc.text(`Departemen: ${employee?.department || '-'}`, 20, 86);
        
        // Add earnings section
        let yPos = 100;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 100, 0); // Green color
        doc.text("PENDAPATAN", 20, yPos);
        doc.setTextColor(0, 0, 0); // Reset to black
        
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("Gaji Pokok", 25, yPos);
        doc.text(formatCurrency(payslip.baseSalary), 180, yPos, { align: "right" });
        
        yPos += 7;
        payslip.incomes.forEach(income => {
            doc.text(income.name, 25, yPos);
            doc.text(formatCurrency(income.amount), 180, yPos, { align: "right" });
            yPos += 7;
        });
        
        // Add total earnings
        yPos += 5;
        doc.line(20, yPos, 190, yPos); // Horizontal line
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL PENDAPATAN", 20, yPos);
        doc.text(formatCurrency(payslip.totalIncome), 180, yPos, { align: "right" });
        
        // Add deductions section
        yPos += 15;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 0, 0); // Red color
        doc.text("POTONGAN", 20, yPos);
        doc.setTextColor(0, 0, 0); // Reset to black
        
        yPos += 10;
        doc.setFont("helvetica", "normal");
        payslip.deductions.forEach(deduction => {
            doc.text(deduction.name, 25, yPos);
            doc.text(formatCurrency(deduction.amount), 180, yPos, { align: "right" });
            yPos += 7;
        });
        
        // Add total deductions
        yPos += 5;
        doc.line(20, yPos, 190, yPos); // Horizontal line
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL POTONGAN", 20, yPos);
        doc.text(formatCurrency(payslip.totalDeductions), 180, yPos, { align: "right" });
        
        // Add net salary
        yPos += 15;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPos - 8, 170, 15, 'F'); // Background rectangle
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("GAJI BERSIH (Take Home Pay)", 25, yPos);
        doc.text(formatCurrency(payslip.netSalary), 180, yPos, { align: "right" });
        
        // Save the PDF
        doc.save(`slip_gaji_${payslip.period.replace(/\s+/g, '_')}.pdf`);
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
    const { db } = useData();
    const myPayslips = db!.payrolls.filter(p => p.employeeId === user?.employeeDetails?.id);
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
    const { db } = useData();
    const [newPayslips, setNewPayslips] = useState<Payroll[]>([]);

    const VIEWED_PAYSLIPS_KEY = useMemo(() => `hrms_viewed_payslips_${user?.id}`, [user?.id]);

    useEffect(() => {
        if (!user?.employeeDetails || !VIEWED_PAYSLIPS_KEY || !db) return;
        
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
    }, [db, user?.employeeDetails, VIEWED_PAYSLIPS_KEY]);

    const markPayslipsAsViewed = useCallback(() => {
        if (!user?.employeeDetails || newPayslips.length === 0 || !db) return;

        const myCurrentPayslipIds = db.payrolls
            .filter(p => p.employeeId === user.employeeDetails.id)
            .map(p => p.id);
        
        localStorage.setItem(VIEWED_PAYSLIPS_KEY, JSON.stringify(myCurrentPayslipIds));
        setNewPayslips([]);
    }, [db, user?.employeeDetails, VIEWED_PAYSLIPS_KEY, newPayslips.length]);

    const navLinksWithBadge = useMemo(() => {
        return EMPLOYEE_NAV_LINKS.map(link => {
            if (link.view === 'my-payslips' && newPayslips.length > 0) {
                return { ...link, badge: newPayslips.length };
            }
            return link;
        });
    }, [newPayslips.length]);
    
    if (!db) return null; // or a loading spinner

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
