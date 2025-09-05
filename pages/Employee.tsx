import React, { useState, useContext } from 'react';
import { Layout } from '../components/Layout';
import { EMPLOYEE_NAV_LINKS, ICONS, MOCK_DB } from '../constants';
import { Card, StatCard, PageTitle, Button, Modal, Select, Input, Textarea } from '../components/ui';
import { AuthContext } from '../App';
import { LeaveRequest, LeaveStatus, LeaveType, Payroll } from '../types';

const EmployeeDashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const myRequests = MOCK_DB.leaveRequests.filter(r => r.employeeId === user?.employeeDetails?.id);
    const latestRequest = myRequests.length > 0 ? myRequests[0] : null;
    
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);

    if (!user || !user.employeeDetails) return <p>Memuat profil...</p>;
    
    const employee = user.employeeDetails;
    
    const handleRequestSubmit = () => {
        console.log("Request for data change:", requestMessage);
        setIsModalOpen(false);
        setRequestMessage('');
        setIsNotificationVisible(true);
        setTimeout(() => setIsNotificationVisible(false), 3000);
    };

    return (
        <div>
            <PageTitle title="Profil Saya">
                 <Button onClick={() => setIsModalOpen(true)}>Ajukan Perubahan Data</Button>
            </PageTitle>

             {isNotificationVisible && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Berhasil</p>
                    <p>Permintaan perubahan data Anda telah dikirim ke HR.</p>
                </div>
            )}
            
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

const MyLeave: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>(MOCK_DB.leaveRequests.filter(r => r.employeeId === user?.employeeDetails?.id));
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleApplyLeave = (newRequest: Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'status'>) => {
        if(!user || !user.employeeDetails) return;
        const request: LeaveRequest = {
            id: `leave-${Date.now()}`,
            employeeId: user.employeeDetails.id,
            employeeName: user.name,
            status: LeaveStatus.PENDING,
            ...newRequest
        };
        setMyRequests([request, ...myRequests]);
        setIsModalOpen(false);
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


const MyPayslips: React.FC = () => {
    const { user } = useContext(AuthContext);
    const myPayslips = MOCK_DB.payrolls.filter(p => p.employeeId === user?.employeeDetails?.id);
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

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <EmployeeDashboard />;
            case 'profile': return <MyProfile />;
            case 'my-leave': return <MyLeave />;
            case 'my-payslips': return <MyPayslips />;
            default: return <EmployeeDashboard />;
        }
    };
    
    return (
        <Layout navLinks={EMPLOYEE_NAV_LINKS} activeView={activeView} setActiveView={setActiveView}>
            {renderContent()}
        </Layout>
    );
};