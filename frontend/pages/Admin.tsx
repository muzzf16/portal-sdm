import React, { useState, useMemo, Fragment, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layout } from '../components/Layout';
import { ADMIN_NAV_LINKS, ICONS, attendanceData, GOLONGAN_OPTIONS } from '../constants';
import { Card, StatCard, Modal, Button, Input, Select, PageTitle, Textarea } from '../components/ui';
import { Employee, LeaveRequest, LeaveStatus, MaritalStatus, Education, WorkExperience, Certificate, User, Role, PayrollInfo, PayComponent, PerformanceReview, KPI, AttendanceRecord, AttendanceStatus, DataChangeRequest } from '../types';
import { useData } from '../context/DataContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../App';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const NewLeaveRequestAlert: React.FC<{ count: number; onViewClick: () => void }> = ({ count, onViewClick }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || count === 0) {
        return null;
    }

    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-md shadow-sm flex justify-between items-center" role="alert">
            <div>
                <p className="font-bold">Notifikasi Pengajuan Baru</p>
                <p>Anda memiliki {count} pengajuan cuti yang menunggu persetujuan.</p>
            </div>
            <div className="flex items-center">
                 <Button onClick={onViewClick} className="mr-4 bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-white text-sm">
                    Lihat Pengajuan
                </Button>
                <button onClick={() => setIsVisible(false)} className="text-yellow-800 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const NewDataChangeRequestAlert: React.FC<{ count: number; onViewClick: () => void }> = ({ count, onViewClick }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || count === 0) {
        return null;
    }

    return (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-md shadow-sm flex justify-between items-center" role="alert">
            <div>
                <p className="font-bold">Notifikasi Perubahan Data</p>
                <p>Anda memiliki {count} permintaan perubahan data yang menunggu persetujuan.</p>
            </div>
            <div className="flex items-center">
                 <Button onClick={onViewClick} className="mr-4 bg-blue-500 hover:bg-blue-600 focus:ring-blue-400 text-white text-sm">
                    Lihat Permintaan
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


const AdminDashboard: React.FC<{ pendingRequestsCount: number; pendingDataChangeRequestsCount: number; setActiveView: (view: string) => void }> = ({ pendingRequestsCount, pendingDataChangeRequestsCount, setActiveView }) => {
    const { db } = useData();
    if (!db) return null;
    return (
    <div>
        <NewLeaveRequestAlert count={pendingRequestsCount} onViewClick={() => setActiveView('leaves')} />
        <NewDataChangeRequestAlert count={pendingDataChangeRequestsCount} onViewClick={() => setActiveView('data-requests')} />
        <PageTitle title="Dasbor Admin" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Karyawan" value={db.employees.length} icon={ICONS.employees} color="bg-blue-100 text-blue-600" />
            <StatCard title="Cuti Hari Ini" value="3" icon={ICONS.leave} color="bg-yellow-100 text-yellow-600" />
            <StatCard title="Pengajuan Tertunda" value={pendingRequestsCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} color="bg-orange-100 text-orange-600" />
            <StatCard title="Karyawan Baru (Bulan)" value="2" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>} color="bg-green-100 text-green-600" />
        </div>
        <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Kehadiran Mingguan</h2>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Hadir" fill="#3b82f6" />
                    <Bar dataKey="Absen" fill="#ef4444" />
                    <Bar dataKey="Cuti" fill="#f59e0b" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    </div>
)};

const allPositions = [
    'Direktur Utama', 'Direktur umum/operasional', 'Komisaris Utama', 'Komisaris', 
    'PE Pelayanan/Kabid Pelayanan', 'PE Manrisk/Kabid Manrisk', 'SPI', 'PE Umum/Kabid Umum', 
    'Kasubid Kredit', 'Kasubid Pemasaran', 'Kasubid Dana', 'Kasubid Pelayanan', 
    'Kasubid Pembinaan Nasabah', 'Kasubid Pelaporan', 'Kepala Kantor Kas', 'Staf Kredit', 
    'Staf Dana', 'Staf IT/Pelaporan', 'Satpam', 'OB', 'Magang', 'Kontrak', 'Teller', 'Customer Service'
];

const EmployeeManagement: React.FC = () => {
    const { db, refreshData } = useData();
    const { addToast } = useToast();
    const { employees, users } = db!;
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const [selectedEmployeeForForm, setSelectedEmployeeForForm] = useState<(Partial<Employee> & { name?: string; email?: string }) | null>(null);
    const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<{ employee: Employee; user?: User } | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [positionFilter, setPositionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

    const openFormModal = (employee: Employee | null = null) => {
        if (employee) {
            const user = users.find(u => u.employeeDetails?.id === employee.id);
            setSelectedEmployeeForForm({ ...employee, name: user?.name, email: user?.email });
        } else {
            setSelectedEmployeeForForm(null);
        }
        setIsFormModalOpen(true);
    };
    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedEmployeeForForm(null);
    };

    const openDetailsModal = (employee: Employee) => {
        const user = users.find(u => u.employeeDetails?.id === employee.id);
        setSelectedEmployeeForDetails({ employee, user });
        setIsDetailsModalOpen(true);
    };
    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedEmployeeForDetails(null);
    }
    
    const handleSave = async (data: Partial<Employee> & { name: string; email: string }) => {
        setIsLoading(true);
        try {
            if (data.id) { // Edit
                await api.updateEmployee(data.id, data);
                addToast('Data karyawan berhasil diperbarui', 'success');
            } else { // Add
                await api.addEmployee(data);
                addToast('Karyawan baru berhasil ditambahkan', 'success');
            }
            await refreshData();
            closeFormModal();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal menyimpan data', 'error');
        } finally {
            setIsLoading(false);
        }
    };


    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const user = users.find(u => u.employeeDetails?.id === emp.id);
            const name = user?.name || '';
            const searchMatch = searchTerm === '' || name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.nip.toLowerCase().includes(searchTerm.toLowerCase());
            const positionMatch = positionFilter === 'all' || emp.position === positionFilter;
            const statusMatch = statusFilter === 'all' || (statusFilter === 'active' && emp.isActive) || (statusFilter === 'inactive' && !emp.isActive);
            return searchMatch && positionMatch && statusMatch;
        });
    }, [employees, users, searchTerm, positionFilter, statusFilter]);
    
    return (
        <div>
            <PageTitle title="Manajemen Karyawan">
                <Button onClick={() => openFormModal()}>Tambah Karyawan Baru</Button>
            </PageTitle>
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Cari Nama / NIP" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Select label="Filter Jabatan" value={positionFilter} onChange={e => setPositionFilter(e.target.value)}>
                        <option value="all">Semua Jabatan</option>
                        {allPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </Select>
                    <Select label="Filter Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </Select>
                </div>
            </Card>
            <Card>
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3">Karyawan</th>
                            <th className="p-3">NIP</th>
                            <th className="p-3">Jabatan</th>
                            <th className="p-3">Departemen</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => (
                            <tr key={emp.id} className="border-b">
                                <td className="p-3 flex items-center">
                                    <img src={emp.avatarUrl} className="w-10 h-10 rounded-full object-cover mr-3" alt={emp.id}/>
                                    {users.find(u => u.employeeDetails?.id === emp.id)?.name || 'Tidak Dikenal'}
                                </td>
                                <td className="p-3">{emp.nip}</td>
                                <td className="p-3">{emp.position}</td>
                                <td className="p-3">{emp.department}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {emp.isActive ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                    <Button onClick={() => openDetailsModal(emp)} className="mr-2 text-xs py-1">Lihat Detail</Button>
                                    <Button variant="secondary" onClick={() => openFormModal(emp)} className="mr-2 text-xs py-1">Ubah</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>
            {isFormModalOpen && <EmployeeFormModal employee={selectedEmployeeForForm} onSave={handleSave} onClose={closeFormModal} isLoading={isLoading} />}
            {isDetailsModalOpen && <EmployeeDetailsModal employee={selectedEmployeeForDetails?.employee} user={selectedEmployeeForDetails?.user} onClose={closeDetailsModal} />}
        </div>
    );
};

const EmployeeFormModal: React.FC<{ employee: (Partial<Employee> & { name?: string, email?: string }) | null, onSave: (data: Partial<Employee> & { name: string; email: string }) => void, onClose: () => void, isLoading: boolean }> = ({ employee, onSave, onClose, isLoading }) => {
    const [formData, setFormData] = useState({
        id: employee?.id || undefined,
        name: employee?.name || '',
        email: employee?.email || '',
        nip: employee?.nip || '',
        position: employee?.position || '',
        department: employee?.department || '',
        phone: employee?.phone || '',
        joinDate: employee?.joinDate || '',
        leaveBalance: employee?.leaveBalance ?? 12,
        avatarUrl: employee?.avatarUrl || 'https://picsum.photos/200',
        pangkat: employee?.pangkat || '',
        golongan: employee?.golongan || 'III/a',
        address: employee?.address || '',
        pob: employee?.pob || '',
        dob: employee?.dob || '',
        religion: employee?.religion || 'Islam',
        maritalStatus: employee?.maritalStatus || 'Lajang',
        numberOfChildren: employee?.numberOfChildren ?? 0,
        isActive: employee?.isActive ?? true,
        educationHistory: employee?.educationHistory || [],
        workHistory: employee?.workHistory || [],
        trainingCertificates: employee?.trainingCertificates || [],
        payrollInfo: employee?.payrollInfo || { baseSalary: 0, incomes: [], deductions: [] },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatarUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDynamicChange = (index: number, e: React.ChangeEvent<HTMLInputElement>, field: 'educationHistory' | 'workHistory' | 'trainingCertificates') => {
        const list = [...(formData[field] || [])];
        list[index] = { ...list[index], [e.target.name]: e.target.value };
        setFormData({ ...formData, [field]: list as any });
    }
    
    const handleAddItem = (field: 'educationHistory' | 'workHistory' | 'trainingCertificates') => {
        const list = [...(formData[field] || [])];
        let newItem = {};
        if (field === 'educationHistory') newItem = { level: '', institution: '', major: '', graduationYear: new Date().getFullYear() };
        if (field === 'workHistory') newItem = { company: '', position: '', startDate: '', endDate: '' };
        if (field === 'trainingCertificates') newItem = { name: '', issuer: '', issueDate: '' };
        
        setFormData({ ...formData, [field]: [...list, newItem] as any });
    };

    const handleRemoveItem = (index: number, field: 'educationHistory' | 'workHistory' | 'trainingCertificates') => {
        const list = [...(formData[field] || [])];
        list.splice(index, 1);
        setFormData({ ...formData, [field]: list as any });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={employee ? "Ubah Data Karyawan" : "Tambah Karyawan"}>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Foto Profil</legend>
                    <div className="flex items-center gap-4">
                        <img src={formData.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                        <div>
                            <label htmlFor="avatarUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <span>Ganti Foto</span>
                                <input id="avatarUpload" name="avatar" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hingga 1MB.</p>
                        </div>
                    </div>
                </fieldset>
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Informasi Akun & Pekerjaan</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nama Lengkap" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <Input label="NIP" name="nip" value={formData.nip} onChange={handleChange} required />
                        <Input label="Posisi" name="position" value={formData.position} onChange={handleChange} required />
                        <Input label="Pangkat" name="pangkat" value={formData.pangkat} onChange={handleChange} required />
                        <Select label="Golongan" name="golongan" value={formData.golongan} onChange={handleChange}>
                            {GOLONGAN_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                        <Input label="Departemen" name="department" value={formData.department} onChange={handleChange} required />
                        <Input label="Tanggal Bergabung" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} required />
                        <div className="flex items-center mt-6 md:col-span-2">
                            <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Karyawan Aktif</label>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Informasi Pribadi</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nomor Telepon" name="phone" value={formData.phone} onChange={handleChange} required />
                        <Input label="Tempat Lahir" name="pob" value={formData.pob} onChange={handleChange} />
                        <Input label="Tanggal Lahir" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                        <Select label="Agama" name="religion" value={formData.religion} onChange={handleChange}>
                            <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                        </Select>
                        <Select label="Status Perkawinan" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
                            <option>Lajang</option><option>Menikah</option><option>Bercerai</option><option>Janda/Duda</option>
                        </Select>
                        <Input label="Jumlah Anak" name="numberOfChildren" type="number" min="0" value={formData.numberOfChildren} onChange={handleChange} />
                        <Textarea label="Alamat" name="address" value={formData.address} onChange={handleChange} className="md:col-span-2" />
                    </div>
                </fieldset>

                {/* Dynamic Fields Sections */}
                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Riwayat Pendidikan</legend>
                    {formData.educationHistory?.map((edu, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-2 border rounded relative">
                            <Input label="Jenjang" name="level" value={edu.level} onChange={e => handleDynamicChange(index, e, 'educationHistory')} placeholder="cth: S1" />
                            <Input label="Institusi" name="institution" value={edu.institution} onChange={e => handleDynamicChange(index, e, 'educationHistory')} />
                            <Input label="Jurusan" name="major" value={edu.major} onChange={e => handleDynamicChange(index, e, 'educationHistory')} />
                            <Input label="Tahun Lulus" name="graduationYear" type="number" value={edu.graduationYear} onChange={e => handleDynamicChange(index, e, 'educationHistory')} />
                             <button type="button" onClick={() => handleRemoveItem(index, 'educationHistory')} className="absolute top-1 right-1 text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => handleAddItem('educationHistory')}>+ Tambah Pendidikan</Button>
                </fieldset>
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Riwayat Pekerjaan</legend>
                    {formData.workHistory?.map((work, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-2 border rounded relative">
                            <Input label="Perusahaan" name="company" value={work.company} onChange={e => handleDynamicChange(index, e, 'workHistory')} />
                            <Input label="Posisi" name="position" value={work.position} onChange={e => handleDynamicChange(index, e, 'workHistory')} />
                            <Input label="Tanggal Mulai" name="startDate" type="date" value={work.startDate} onChange={e => handleDynamicChange(index, e, 'workHistory')} />
                            <Input label="Tanggal Selesai" name="endDate" type="date" value={work.endDate} onChange={e => handleDynamicChange(index, e, 'workHistory')} />
                            <button type="button" onClick={() => handleRemoveItem(index, 'workHistory')} className="absolute top-1 right-1 text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => handleAddItem('workHistory')}>+ Tambah Pekerjaan</Button>
                </fieldset>


                <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Batal</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-semibold text-primary-700 border-b-2 border-primary-200 pb-2 mb-3">{title}</h4>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || '-'}</p>
    </div>
);


const EmployeeDetailsModal: React.FC<{ employee?: Employee; user?: User; onClose: () => void }> = ({ employee, user, onClose }) => {
    if (!employee || !user) return null;

    const handlePrint = () => {
        const doc = new jsPDF();

        doc.text(`Detail Karyawan: ${user.name}`, 14, 20);

        const employeeData = [
            ['NIP', employee.nip],
            ['Email', user.email],
            ['Telepon', employee.phone],
            ['Tanggal Bergabung', employee.joinDate],
            ['Sisa Cuti', `${employee.leaveBalance} hari`],
            ['Tempat, Tanggal Lahir', `${employee.pob}, ${employee.dob}`],
            ['Agama', employee.religion],
            ['Status Perkawinan', employee.maritalStatus],
            ['Jumlah Anak', employee.numberOfChildren],
            ['Alamat', employee.address],
        ];

        autoTable(doc, {
            startY: 30,
            head: [['Field', 'Value']],
            body: employeeData,
        });

        doc.save(`employee-details-${employee.id}.pdf`);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Detail Karyawan: ${user.name || ''}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-4 print:max-h-none print:overflow-visible">
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

                <DetailSection title="Informasi Pekerjaan">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="NIP" value={employee.nip} />
                        <DetailItem label="Email" value={user.email} />
                        <DetailItem label="Telepon" value={employee.phone} />
                        <DetailItem label="Tanggal Bergabung" value={employee.joinDate} />
                        <DetailItem label="Sisa Cuti" value={`${employee.leaveBalance} hari`} />
                    </div>
                </DetailSection>

                <DetailSection title="Informasi Pribadi">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label="Tempat, Tanggal Lahir" value={`${employee.pob}, ${employee.dob}`} />
                        <DetailItem label="Agama" value={employee.religion} />
                        <DetailItem label="Status Perkawinan" value={employee.maritalStatus} />
                        <DetailItem label="Jumlah Anak" value={employee.numberOfChildren} />
                        <div className="col-span-2 md:col-span-3">
                            <DetailItem label="Alamat" value={employee.address} />
                        </div>
                    </div>
                </DetailSection>

                <DetailSection title="Riwayat Pendidikan">
                    <ul className="space-y-2 list-disc list-inside">
                        {employee.educationHistory.map((edu, i) => <li key={i}><strong>{edu.level} {edu.major}</strong> di {edu.institution} (Lulus {edu.graduationYear})</li>)}
                        {employee.educationHistory.length === 0 && <p className="text-gray-500">Tidak ada data.</p>}
                    </ul>
                </DetailSection>

                <DetailSection title="Riwayat Pekerjaan">
                    <ul className="space-y-2 list-disc list-inside">
                         {employee.workHistory.map((work, i) => <li key={i}><strong>{work.position}</strong> di {work.company} ({work.startDate} - {work.endDate})</li>)}
                         {employee.workHistory.length === 0 && <p className="text-gray-500">Tidak ada data.</p>}
                    </ul>
                </DetailSection>

                 <DetailSection title="Sertifikat Pelatihan">
                    <ul className="space-y-2 list-disc list-inside">
                         {employee.trainingCertificates.map((cert, i) => <li key={i}><strong>{cert.name}</strong> dari {cert.issuer} (Diperoleh {cert.issueDate})</li>)}
                         {employee.trainingCertificates.length === 0 && <p className="text-gray-500">Tidak ada data.</p>}
                    </ul>
                </DetailSection>
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t print:hidden">
                <Button onClick={onClose} variant="secondary" className="mr-2">Tutup</Button>
                <Button onClick={handlePrint}>Cetak / Unduh</Button>
            </div>
        </Modal>
    );
};


    const LeaveManagement: React.FC = () => {
        const { db, refreshData } = useData();
        const { addToast } = useToast();
        const { leaveRequests } = db!;
    const API_BASE_URL = 'http://localhost:2025';
    
    const [rejectionModalState, setRejectionModalState] = useState<{ isOpen: boolean, requestId: string | null }>({ isOpen: false, requestId: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [documentModalState, setDocumentModalState] = useState<{ isOpen: boolean, documentUrl: string | null, fileName: string | null }>({ isOpen: false, documentUrl: null, fileName: null });

    const updateLeaveStatus = async (id: string, status: LeaveStatus, reason?: string) => {
        try {
            await api.updateLeaveStatus(id, status, reason);
            addToast(`Status cuti berhasil diubah menjadi ${status}`, 'success');
            await refreshData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal memperbarui status cuti', 'error');
        }
    };

    const handleApprove = (id: string) => {
        updateLeaveStatus(id, LeaveStatus.APPROVED);
    };

    const openRejectionModal = (id: string) => {
        setRejectionModalState({ isOpen: true, requestId: id });
    };

    const closeRejectionModal = () => {
        setRejectionModalState({ isOpen: false, requestId: null });
        setRejectionReason('');
    };

    const handleRejectSubmit = () => {
        if (!rejectionModalState.requestId) return;
        updateLeaveStatus(rejectionModalState.requestId, LeaveStatus.REJECTED, rejectionReason);
        closeRejectionModal();
    }
    
    const openDocumentModal = (documentUrl: string, fileName: string) => {
        // Handle different types of URLs
        let fullUrl = documentUrl;
        
        // If it's a relative path starting with /uploads, it should be served by our backend
        if (documentUrl.startsWith('/uploads/')) {
            fullUrl = `${API_BASE_URL}${documentUrl}`;
        } 
        // If it's an absolute URL, use it as is
        else if (documentUrl.startsWith('http://') || documentUrl.startsWith('https://')) {
            fullUrl = documentUrl;
        }
        // If it's a file:// URL (which is incorrect), try to convert it to a proper path
        else if (documentUrl.startsWith('file://')) {
            // Extract filename and construct proper URL
            const filename = documentUrl.split('/').pop();
            if (filename) {
                fullUrl = `${API_BASE_URL}/uploads/${filename}`;
            }
        }
        
        setDocumentModalState({ isOpen: true, documentUrl: fullUrl, fileName });
    };
    
    const closeDocumentModal = () => {
        setDocumentModalState({ isOpen: false, documentUrl: null, fileName: null });
    };
    
    const handleDownloadDocument = () => {
        if (documentModalState.documentUrl && documentModalState.fileName) {
            // Create a temporary link to download the file
            const link = document.createElement('a');
            
            // Handle different types of URLs for download
            let downloadUrl = documentModalState.documentUrl;
            
            link.href = downloadUrl;
            link.download = documentModalState.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
            <PageTitle title="Pengajuan Cuti" />
            <Card>
                 <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3">Karyawan</th>
                            <th className="p-3">Jenis Cuti</th>
                            <th className="p-3">Tanggal Mulai</th>
                            <th className="p-3">Tanggal Selesai</th>
                            <th className="p-3">Alasan</th>
                            <th className="p-3">Dokumen</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.map(req => (
                            <tr key={req.id} className="border-b">
                                <td className="p-3">{req.employeeName}</td>
                                <td className="p-3">{req.leaveType}</td>
                                <td className="p-3">{req.startDate}</td>
                                <td className="p-3">{req.endDate}</td>
                                <td className="p-3 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                <td className="p-3">
                                    {req.supportingDocument ? (
                                        <Button 
                                            variant="secondary" 
                                            className="text-xs"
                                            onClick={() => openDocumentModal(req.supportingDocument!, `document_${req.id}`)}
                                        >
                                            Lihat Dokumen
                                        </Button>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(req.status)}`}>{req.status}</span></td>
                                <td className="p-3">
                                    {req.status === LeaveStatus.PENDING && (
                                        <>
                                            <Button variant="success" onClick={() => handleApprove(req.id)} className="mr-2 text-xs">Setujui</Button>
                                            <Button variant="danger" onClick={() => openRejectionModal(req.id)} className="text-xs">Tolak</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>
            <Modal isOpen={rejectionModalState.isOpen} onClose={closeRejectionModal} title="Alasan Penolakan Cuti">
                <div className="space-y-4">
                    <Textarea
                        label="Mohon berikan alasan penolakan pengajuan cuti ini."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        rows={3}
                    />
                    <div className="flex justify-end pt-2">
                        <Button type="button" variant="secondary" onClick={closeRejectionModal} className="mr-2">Batal</Button>
                        <Button variant="danger" onClick={handleRejectSubmit} disabled={!rejectionReason.trim()}>Kirim Penolakan</Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={documentModalState.isOpen} onClose={closeDocumentModal} title="Dokumen Pendukung">
                <div className="space-y-4">
                    {documentModalState.documentUrl && (
                        <div className="flex flex-col items-center">
                            {documentModalState.documentUrl.toLowerCase().endsWith('.pdf') ? (
                                // For PDF documents, show an iframe preview
                                <iframe 
                                    src={documentModalState.documentUrl}
                                    className="w-full h-96"
                                    title="Document Preview"
                                />
                            ) : (
                                // For image documents or unknown types, show an image preview or generic message
                                <>
                                    {documentModalState.documentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                        <img 
                                            src={documentModalState.documentUrl}
                                            alt="Document Preview" 
                                            className="max-w-full max-h-96 object-contain"
                                        />
                                    ) : (
                                        <div className="text-center p-8">
                                            <p className="mb-4">Pratinjau dokumen tidak tersedia untuk jenis file ini.</p>
                                            <p className="text-sm text-gray-500">Klik "Unduh Dokumen" untuk melihat file.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="mt-4 flex space-x-2">
                                <Button onClick={handleDownloadDocument}>Unduh Dokumen</Button>
                                <Button variant="secondary" onClick={closeDocumentModal}>Tutup</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

    const AttendanceManagement: React.FC = () => {
        const { db, refreshData } = useData();
        const { addToast } = useToast();
        const { attendance: records, users, employees } = db!;
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const attendanceRecords = json.map(row => {
                    if (!row.NIP) {
                        console.warn('Row without NIP found, skipping:', row);
                        return null;
                    }
                    const employee = employees.find(emp => emp.nip === row.NIP);
                    if (!employee) {
                        console.warn(`Employee with NIP ${row.NIP} not found.`);
                        return null;
                    }
                    return {
                        employeeId: employee.id,
                        employeeName: users.find(u => u.employeeDetails?.id === employee.id)?.name || 'N/A',
                        date: row.Tanggal,
                        clockIn: row['Jam Masuk'],
                        clockOut: row['Jam Pulang'],
                        status: 'Tepat Waktu', // Placeholder, can be improved
                    };
                }).filter(Boolean) as AttendanceRecord[];

                if (attendanceRecords.length > 0) {
                    await api.uploadAttendance(attendanceRecords);
                    addToast('Data absensi berhasil diunggah', 'success');
                    refreshData();
                } else {
                    addToast('Tidak ada data absensi yang valid untuk diunggah.', 'warning');
                }
            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Gagal mengunggah file', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };


    const calculateDuration = (start: string | null, end: string | null): string => {
        if (!start || !end) return '-';
        const today = new Date().toISOString().split('T')[0];
        const startTime = new Date(`${today}T${start}`);
        const endTime = new Date(`${today}T${end}`);
        const diffMs = endTime.getTime() - startTime.getTime();
        if (diffMs < 0) return '-';
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHrs}j ${diffMins}m`;
    };

    const filteredRecords = useMemo(() => {
        // To show today's data correctly, we'll use a fixed date for the demo
        const demoToday = '2024-07-30';
        if (selectedDate === new Date().toISOString().split('T')[0]) {
             return records.filter(r => r.date === demoToday);
        }
        return records.filter(r => r.date === selectedDate);
    }, [records, selectedDate]);
    
    const getStatusChip = (status: AttendanceStatus) => {
        let color = '';
        switch(status) {
            case AttendanceStatus.ON_TIME:
                color = 'bg-green-100 text-green-800';
                break;
            case AttendanceStatus.LATE:
                color = 'bg-red-100 text-red-800';
                break;
            default:
                color = 'bg-gray-100 text-gray-800';
        }
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>;
    }

    return (
        <div>
            <PageTitle title="Manajemen Absensi">
                <div className="flex items-center space-x-2">
                    <Input 
                        label=""
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                    <label htmlFor="attendance-upload" className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                        Unggah Excel
                    </label>
                    <input id="attendance-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls"/>
                </div>
            </PageTitle>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3">Karyawan</th>
                                <th className="p-3">Clock In</th>
                                <th className="p-3">Clock Out</th>
                                <th className="p-3">Durasi Kerja</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(rec => (
                                <tr key={rec.id} className="border-b">
                                    <td className="p-3">{rec.employeeName}</td>
                                    <td className="p-3">{rec.clockIn}</td>
                                    <td className="p-3">{rec.clockOut || 'Belum Clock Out'}</td>
                                    <td className="p-3">{calculateDuration(rec.clockIn, rec.clockOut)}</td>
                                    <td className="p-3">{getStatusChip(rec.status)}</td>
                                    <td className="p-3">
                                        <Button variant="secondary" className="text-xs">Ubah</Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-4 text-gray-500">
                                        Tidak ada data absensi untuk tanggal ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};


const PerformanceReviewFormModal: React.FC<{ employee: {id: string, name: string}, onSave: (review: Omit<PerformanceReview, 'id' | 'overallScore'>) => void, onClose: () => void }> = ({ employee, onSave, onClose }) => {
    const defaultKpi: Omit<KPI, 'id'> = { metric: '', target: '', result: '', weight: 0, score: 3, notes: '' };
    const [reviewData, setReviewData] = useState<Omit<PerformanceReview, 'id' | 'employeeId' | 'employeeName' | 'overallScore'>>({
        period: 'Q3 2024',
        reviewerName: 'Admin SDM',
        reviewDate: new Date().toISOString().split('T')[0],
        status: 'Completed',
        strengths: '',
        areasForImprovement: '',
        kpis: [ { ...defaultKpi, id: `kpi-${Date.now()}` } ],
    });

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReviewData({ ...reviewData, [e.target.name]: e.target.value });
    };

    const handleKpiChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const kpis = [...reviewData.kpis];
        kpis[index] = { ...kpis[index], [e.target.name]: e.target.name === 'weight' || e.target.name === 'score' ? Number(e.target.value) : e.target.value };
        setReviewData({ ...reviewData, kpis });
    };

    const addKpi = () => {
        setReviewData({ ...reviewData, kpis: [...reviewData.kpis, { ...defaultKpi, id: `kpi-${Date.now()}` }] });
    };

    const removeKpi = (index: number) => {
        const kpis = [...reviewData.kpis];
        kpis.splice(index, 1);
        setReviewData({ ...reviewData, kpis });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalReview = {
            ...reviewData,
            employeeId: employee.id,
            employeeName: employee.name,
        };
        onSave(finalReview);
    }
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Buat Penilaian Kinerja: ${employee.name}`}>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
                <Input label="Periode Penilaian" name="period" value={reviewData.period} onChange={handleDataChange} placeholder="Contoh: Q3 2024" required />

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Key Performance Indicators (KPI)</legend>
                    {reviewData.kpis.map((kpi, index) => (
                        <div key={kpi.id} className="grid grid-cols-12 gap-2 mb-3 p-2 border rounded relative">
                            <div className="col-span-12"><Input label="Metrik" name="metric" value={kpi.metric} onChange={(e) => handleKpiChange(index, e)} placeholder="Contoh: Penyelesaian Tugas" /></div>
                            <div className="col-span-6"><Input label="Target" name="target" value={kpi.target} onChange={(e) => handleKpiChange(index, e)} /></div>
                            <div className="col-span-6"><Input label="Hasil" name="result" value={kpi.result} onChange={(e) => handleKpiChange(index, e)} /></div>
                            <div className="col-span-6"><Input label="Bobot (0-1)" name="weight" type="number" step="0.1" min="0" max="1" value={kpi.weight} onChange={(e) => handleKpiChange(index, e)} /></div>
                            <div className="col-span-6"><Input label="Skor (1-5)" name="score" type="number" min="1" max="5" value={kpi.score} onChange={(e) => handleKpiChange(index, e)} /></div>
                            <button type="button" onClick={() => removeKpi(index)} className="absolute -top-2 -right-2 text-red-500 bg-white rounded-full p-0.5 hover:text-red-700">&times;</button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addKpi}>+ Tambah KPI</Button>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Umpan Balik Kualitatif</legend>
                    <div className="space-y-4">
                        <Textarea label="Kekuatan" name="strengths" value={reviewData.strengths} onChange={handleDataChange} rows={3} />
                        <Textarea label="Area untuk Peningkatan" name="areasForImprovement" value={reviewData.areasForImprovement} onChange={handleDataChange} rows={3} />
                    </div>
                </fieldset>
                
                <div className="flex justify-end pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Batal</Button>
                    <Button type="submit">Simpan Penilaian</Button>
                </div>
            </form>
        </Modal>
    );
};

    const PerformanceManagement: React.FC = () => {
        const { db, refreshData } = useData();
        const { addToast } = useToast();
        const { performanceReviews, employees, users } = db!;
    
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string} | null>(null);

    const openFormModal = (employee: {id: string, name: string}) => {
        setSelectedEmployee(employee);
        setFormModalOpen(true);
    };

    const handleSaveReview = async (newReview: Omit<PerformanceReview, 'id' | 'overallScore'>) => {
        try {
            // FIX: The api function expects an `overallScore`, which is calculated on the backend.
            // To satisfy the frontend type, we calculate it here. The backend will use its own calculation.
            const totalWeight = newReview.kpis.reduce((sum, kpi) => sum + kpi.weight, 0) || 1;
            const weightedScore = newReview.kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0);
            const overallScore = parseFloat((weightedScore / totalWeight).toFixed(2));

            const reviewToSend = {
                ...newReview,
                overallScore,
            };

            await api.createPerformanceReview(reviewToSend);
            addToast("Penilaian kinerja berhasil disimpan.", 'success');
            await refreshData();
            setFormModalOpen(false);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal menyimpan penilaian.", 'error');
        }
    };

    return (
        <div>
            <PageTitle title="Manajemen Kinerja" />
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3">Karyawan</th>
                                <th className="p-3">Jabatan</th>
                                <th className="p-3">Penilaian Terakhir</th>
                                <th className="p-3">Skor Terakhir</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.filter(e => e.isActive).map(emp => {
                                const user = users.find(u => u.employeeDetails?.id === emp.id);
                                const lastReview = performanceReviews.filter(r => r.employeeId === emp.id).sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0];
                                return (
                                    <tr key={emp.id} className="border-b">
                                        <td className="p-3 flex items-center">
                                            <img src={emp.avatarUrl} className="w-10 h-10 rounded-full object-cover mr-3" alt={user?.name} />
                                            {user?.name}
                                        </td>
                                        <td className="p-3">{emp.position}</td>
                                        <td className="p-3">{lastReview?.period || 'Belum ada'}</td>
                                        <td className="p-3">{lastReview?.overallScore || '-'}</td>
                                        <td className="p-3">
                                            <Button variant="secondary" className="mr-2 text-xs">Lihat Riwayat</Button>
                                            <Button onClick={() => user && openFormModal({id: emp.id, name: user.name})} className="text-xs">Buat Penilaian</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isFormModalOpen && selectedEmployee && (
                <PerformanceReviewFormModal 
                    employee={selectedEmployee} 
                    onSave={handleSaveReview}
                    onClose={() => setFormModalOpen(false)}
                />
            )}
        </div>
    );
};

const PayrollSettingsModal: React.FC<{ employee: Employee; user: User; onSave: (employeeId: string, payrollInfo: PayrollInfo) => void; onClose: () => void; }> = ({ employee, user, onSave, onClose }) => {
    const [payrollInfo, setPayrollInfo] = useState<PayrollInfo>(employee.payrollInfo);

    const handleBaseSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPayrollInfo({ ...payrollInfo, baseSalary: Number(e.target.value) });
    };

    const handleComponentChange = (index: number, type: 'incomes' | 'deductions', e: React.ChangeEvent<HTMLInputElement>) => {
        const components = [...payrollInfo[type]];
        const component = { ...components[index], [e.target.name]: e.target.name === 'amount' ? Number(e.target.value) : e.target.value };
        components[index] = component;
        setPayrollInfo({ ...payrollInfo, [type]: components });
    };

    const addComponent = (type: 'incomes' | 'deductions') => {
        const newComponent: PayComponent = { id: `comp-${Date.now()}`, name: '', amount: 0 };
        setPayrollInfo({ ...payrollInfo, [type]: [...payrollInfo[type], newComponent] });
    }
    
    const removeComponent = (index: number, type: 'incomes' | 'deductions') => {
        const components = [...payrollInfo[type]];
        components.splice(index, 1);
        setPayrollInfo({ ...payrollInfo, [type]: components });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(employee.id, payrollInfo);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Kelola Gaji: ${user.name}`}>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <Input label="Gaji Pokok" type="number" value={payrollInfo.baseSalary} onChange={handleBaseSalaryChange} />

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Komponen Pendapatan</legend>
                    {payrollInfo.incomes.map((income, index) => (
                        <div key={income.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                            <div className="col-span-6"><Input label="" name="name" value={income.name} onChange={e => handleComponentChange(index, 'incomes', e)} placeholder="Nama Tunjangan" /></div>
                            <div className="col-span-5"><Input label="" name="amount" type="number" value={income.amount} onChange={e => handleComponentChange(index, 'incomes', e)} placeholder="Jumlah" /></div>
                            <button type="button" onClick={() => removeComponent(index, 'incomes')} className="col-span-1 text-red-500 hover:text-red-700 mt-5">&times;</button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => addComponent('incomes')}>+ Tambah Pendapatan</Button>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold">Komponen Potongan</legend>
                    {payrollInfo.deductions.map((deduction, index) => (
                        <div key={deduction.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                            <div className="col-span-6"><Input label="" name="name" value={deduction.name} onChange={e => handleComponentChange(index, 'deductions', e)} placeholder="Nama Potongan" /></div>
                            <div className="col-span-5"><Input label="" name="amount" type="number" value={deduction.amount} onChange={e => handleComponentChange(index, 'deductions', e)} placeholder="Jumlah" /></div>
                            <button type="button" onClick={() => removeComponent(index, 'deductions')} className="col-span-1 text-red-500 hover:text-red-700 mt-5">&times;</button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => addComponent('deductions')}>+ Tambah Potongan</Button>
                </fieldset>
                
                <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Batal</Button>
                    <Button type="submit">Simpan Pengaturan</Button>
                </div>
            </form>
        </Modal>
    );
};

    const PayrollManagement: React.FC = () => {
        const { db, refreshData } = useData();
        const { addToast } = useToast();
        const { employees, users } = db!;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{employee: Employee, user: User} | null>(null);

    const openModal = (employee: Employee) => {
        const user = users.find(u => u.employeeDetails?.id === employee.id);
        if (user) {
            setSelectedEmployee({ employee, user });
            setIsModalOpen(true);
        }
    }
    
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleSavePayroll = async (employeeId: string, payrollInfo: PayrollInfo) => {
        try {
            await api.updatePayrollInfo(employeeId, payrollInfo);
            addToast("Pengaturan gaji berhasil disimpan.", 'success');
            await refreshData();
            closeModal();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal menyimpan pengaturan gaji.", 'error');
        }
    };

    return (
        <div>
            <PageTitle title="Manajemen Penggajian" />
             <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3">Karyawan</th>
                                <th className="p-3">Jabatan</th>
                                <th className="p-3">Gaji Pokok</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const user = users.find(u => u.employeeDetails?.id === emp.id);
                                return (
                                <tr key={emp.id} className="border-b">
                                    <td className="p-3 flex items-center">
                                        <img src={emp.avatarUrl} className="w-10 h-10 rounded-full object-cover mr-3" alt={user?.name}/>
                                        {user?.name || 'Tidak Dikenal'}
                                    </td>
                                    <td className="p-3">{emp.position}</td>
                                    <td className="p-3">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(emp.payrollInfo.baseSalary)}</td>
                                    <td className="p-3">
                                        <Button onClick={() => openModal(emp)}>Kelola Gaji</Button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && selectedEmployee && (
                <PayrollSettingsModal 
                    employee={selectedEmployee.employee}
                    user={selectedEmployee.user}
                    onClose={closeModal}
                    onSave={handleSavePayroll}
                />
            )}
        </div>
    );
}
const EmailReportModal: React.FC<{ reportName: string; onClose: () => void; }> = ({ reportName, onClose }) => {
    const [email, setEmail] = useState('');
    const { addToast } = useToast();
    const { user } = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            // Using a generic endpoint for simulation purposes
            await api.submitDataChangeRequest(`Sending ${reportName} to ${email}`, user?.employeeDetails?.id, user?.name);
            addToast(`${reportName} berhasil dikirim ke ${email}`, 'success');
            onClose();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal mengirim laporan", 'error');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Kirim ${reportName} via Email`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Alamat Email Penerima"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@perusahaan.com"
                    required
                />
                <div className="flex justify-end pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Batal</Button>
                    <Button type="submit" disabled={!email}>Kirim</Button>
                </div>
            </form>
        </Modal>
    );
};

    const Reports: React.FC = () => {
        const { db } = useData();
        const { addToast } = useToast();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState('');

    const openEmailModal = (reportName: string) => {
        setSelectedReport(reportName);
        setIsEmailModalOpen(true);
    }

    const handleDownloadRekap = (type: 'employee' | 'attendance' | 'leave' | 'data-change' | 'payroll') => {
        if (!db) {
            addToast('Data tidak tersedia untuk membuat laporan.', 'error');
            return;
        }

        let data: any[] = [];
        let filename = 'laporan_rekap.xlsx';

        switch (type) {
            case 'employee':
                data = db.employees.map(e => {
                    const user = db.users.find(u => u.employeeDetails?.id === e.id);
                    return {
                        'Nama': user?.name || 'N/A',
                        'Posisi': e.position,
                        'Departemen': e.department,
                        'Status': e.isActive ? 'Aktif' : 'Nonaktif'
                    };
                });
                filename = 'laporan_rekap_karyawan.xlsx';
                break;
            case 'attendance':
                data = db.attendance.map(a => ({
                    'Nama': a.employeeName,
                    'Tanggal': a.date,
                    'Clock In': a.clockIn,
                    'Clock Out': a.clockOut,
                    'Status': a.status
                }));
                filename = 'laporan_rekap_absensi.xlsx';
                break;
            case 'leave':
                data = db.leaveRequests.map(lr => ({
                    'Nama': lr.employeeName,
                    'Jenis Cuti': lr.leaveType,
                    'Tanggal Mulai': lr.startDate,
                    'Tanggal Selesai': lr.endDate,
                    'Status': lr.status
                }));
                filename = 'laporan_rekap_cuti.xlsx';
                break;
            case 'data-change':
                data = db.dataChangeRequests.map(dcr => ({
                    'Nama': dcr.employeeName,
                    'Tanggal Permintaan': dcr.requestDate,
                    'Status': dcr.status
                }));
                filename = 'laporan_rekap_permintaan_data.xlsx';
                break;
            case 'payroll':
                data = db.employees.map(e => {
                    const user = db.users.find(u => u.employeeDetails?.id === e.id);
                    return {
                        'Nama': user?.name || 'N/A',
                        'Gaji Pokok': new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(e.payrollInfo.baseSalary)
                    };
                });
                filename = 'laporan_rekap_penggajian.xlsx';
                break;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Rekap");
        XLSX.writeFile(wb, filename);
        addToast(`${filename} berhasil diunduh.`, 'success');
    };

    return (
        <div>
            <PageTitle title="Laporan" />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-lg">Laporan Rekap Karyawan</h3>
                        <p className="text-gray-600">Unduh rekap laporan data karyawan.</p>
                        <div className="space-x-2">
                            <Button onClick={() => handleDownloadRekap('employee')}>Unduh Excel</Button>
                        </div>
                    </div>
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-lg">Laporan Rekap Absensi</h3>
                        <p className="text-gray-600">Unduh rekap laporan absensi.</p>
                        <div className="space-x-2">
                            <Button onClick={() => handleDownloadRekap('attendance')}>Unduh Excel</Button>
                        </div>
                    </div>
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-lg">Laporan Rekap Pengajuan Cuti</h3>
                        <p className="text-gray-600">Unduh rekap laporan pengajuan cuti.</p>
                        <div className="space-x-2">
                            <Button onClick={() => handleDownloadRekap('leave')}>Unduh Excel</Button>
                        </div>
                    </div>
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-lg">Laporan Rekap Permintaan Data</h3>
                        <p className="text-gray-600">Unduh rekap laporan permintaan data.</p>
                        <div className="space-x-2">
                            <Button onClick={() => handleDownloadRekap('data-change')}>Unduh Excel</Button>
                        </div>
                    </div>
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-lg">Laporan Rekap Penggajian</h3>
                        <p className="text-gray-600">Unduh rekap laporan penggajian.</p>
                        <div className="space-x-2">
                            <Button onClick={() => handleDownloadRekap('payroll')}>Unduh Excel</Button>
                        </div>
                    </div>
                </div>
            </Card>
            {isEmailModalOpen && (
                <EmailReportModal 
                    reportName={selectedReport}
                    onClose={() => setIsEmailModalOpen(false)}
                />
            )}
        </div>
    );
}

    const DataChangeRequests: React.FC = () => {
        const { db, refreshData } = useData();
        const { addToast } = useToast();
    const [selectedRequest, setSelectedRequest] = useState<DataChangeRequest | null>(null);
    const [actionModalState, setActionModalState] = useState<{ isOpen: boolean, requestId: string | null, action: 'approve' | 'reject' | null }>({ isOpen: false, requestId: null, action: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = (id: string) => {
        setActionModalState({ isOpen: true, requestId: id, action: 'approve' });
    };

    const handleReject = (id: string) => {
        setActionModalState({ isOpen: true, requestId: id, action: 'reject' });
    };

    const closeActionModal = () => {
        setActionModalState({ isOpen: false, requestId: null, action: null });
        setRejectionReason('');
    };

    const handleActionSubmit = async () => {
        if (!actionModalState.requestId) return;
        
        try {
            const status = actionModalState.action === 'approve' ? 'approved' : 'rejected';
            await api.updateDataChangeRequestStatus(actionModalState.requestId, status);
            addToast(`Permintaan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`, 'success');
            await refreshData();
            closeActionModal();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal memperbarui status permintaan', 'error');
        }
    };

    const statusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <PageTitle title="Permintaan Perubahan Data" />
            <Card>
                 <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3">Karyawan</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Pesan</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {db?.dataChangeRequests.map(req => (
                            <tr key={req.id} className="border-b">
                                <td className="p-3">{req.employeeName}</td>
                                <td className="p-3">{req.requestDate}</td>
                                <td className="p-3 max-w-xs truncate" title={req.message}>{req.message}</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(req.status)}`}>{req.status}</span></td>
                                <td className="p-3">
                                    {req.status === 'pending' && (
                                        <>
                                            <Button variant="success" onClick={() => handleApprove(req.id)} className="mr-2 text-xs">Setujui</Button>
                                            <Button variant="danger" onClick={() => handleReject(req.id)} className="text-xs">Tolak</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>
            <Modal isOpen={actionModalState.isOpen} onClose={closeActionModal} title={actionModalState.action === 'approve' ? "Konfirmasi Persetujuan" : "Alasan Penolakan"}>
                <div className="space-y-4">
                    {actionModalState.action === 'reject' ? (
                        <>
                            <Textarea
                                label="Mohon berikan alasan penolakan permintaan ini."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                                rows={3}
                            />
                            <div className="flex justify-end pt-2">
                                <Button type="button" variant="secondary" onClick={closeActionModal} className="mr-2">Batal</Button>
                                <Button variant="danger" onClick={handleActionSubmit} disabled={!rejectionReason.trim()}>Kirim Penolakan</Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Apakah Anda yakin ingin menyetujui permintaan perubahan data ini?</p>
                            <div className="flex justify-end pt-2">
                                <Button type="button" variant="secondary" onClick={closeActionModal} className="mr-2">Batal</Button>
                                <Button variant="success" onClick={handleActionSubmit}>Konfirmasi</Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

const UserManagement: React.FC = () => {
    const { db, refreshData } = useData();
    const { addToast } = useToast();
    const users = db!.users;
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE'
    });
    
    const [isLoading, setIsLoading] = useState(false);

    const openFormModal = (user: User | null = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role
            });
        } else {
            setSelectedUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'EMPLOYEE'
            });
        }
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedUser(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            if (selectedUser) {
                // Update existing user
                await api.updateUser(selectedUser.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                });
                addToast('Pengguna berhasil diperbarui', 'success');
            } else {
                // Create new user
                if (!formData.password) {
                    addToast('Kata sandi harus diisi untuk pengguna baru', 'error');
                    setIsLoading(false);
                    return;
                }
                
                await api.createUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                });
                addToast('Pengguna baru berhasil ditambahkan', 'success');
            }
            
            await refreshData();
            closeFormModal();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data pengguna';
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna ${userName}?`)) {
            return;
        }
        
        try {
            await api.deleteUser(userId);
            addToast('Pengguna berhasil dihapus', 'success');
            await refreshData();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus pengguna';
            addToast(errorMessage, 'error');
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <div>
            <PageTitle title="Manajemen Pengguna">
                <Button onClick={() => openFormModal()}>Tambah Pengguna Baru</Button>
            </PageTitle>
            
            <Card className="mb-6">
                <Input 
                    label="Cari Pengguna" 
                    placeholder="Cari berdasarkan nama atau email..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </Card>
            
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3">Nama</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Peran</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b">
                                    <td className="p-3">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            user.role === 'ADMIN' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => openFormModal(user)} 
                                            className="mr-2 text-xs py-1"
                                        >
                                            Ubah
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            onClick={() => handleDelete(user.id, user.name)} 
                                            className="text-xs py-1"
                                            disabled={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1}
                                        >
                                            Hapus
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-4 text-gray-500">
                                        Tidak ada pengguna yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            {isFormModalOpen && (
                <Modal 
                    isOpen={true} 
                    onClose={closeFormModal} 
                    title={selectedUser ? "Ubah Pengguna" : "Tambah Pengguna Baru"}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nama Lengkap"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                        
                        {!selectedUser && (
                            <Input
                                label="Kata Sandi"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!selectedUser}
                                placeholder="Masukkan kata sandi"
                            />
                        )}
                        
                        <Select
                            label="Peran"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                        >
                            <option value="EMPLOYEE">Karyawan</option>
                            <option value="ADMIN">Administrator</option>
                        </Select>
                        
                        <div className="flex justify-end pt-4">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={closeFormModal} 
                                className="mr-2"
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export const AdminPage: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const { db } = useData();
    
    if (!db) return null; // or a loading spinner

    const pendingRequestsCount = useMemo(() => db.leaveRequests.filter(r => r.status === LeaveStatus.PENDING).length, [db.leaveRequests]);
    const pendingDataChangeRequestsCount = useMemo(() => db.dataChangeRequests.filter(r => r.status === 'pending').length, [db.dataChangeRequests]);

    const navLinksWithBadge = useMemo(() => {
        return ADMIN_NAV_LINKS.map(link => {
            if (link.view === 'leaves') {
                return { ...link, badge: pendingRequestsCount };
            }
            if (link.view === 'data-requests') {
                return { ...link, badge: pendingDataChangeRequestsCount };
            }
            return link;
        });
    }, [pendingRequestsCount, pendingDataChangeRequestsCount]);


    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <AdminDashboard pendingRequestsCount={pendingRequestsCount} pendingDataChangeRequestsCount={pendingDataChangeRequestsCount} setActiveView={setActiveView} />;
            case 'employees': return <EmployeeManagement />;
            case 'attendance': return <AttendanceManagement />;
            case 'leaves': return <LeaveManagement />;
            case 'data-requests': return <DataChangeRequests />;
            case 'performance': return <PerformanceManagement />;
            case 'payroll': return <PayrollManagement />;
            case 'users': return <UserManagement />;
            case 'reports': return <Reports />;
            default: return <AdminDashboard pendingRequestsCount={pendingRequestsCount} pendingDataChangeRequestsCount={pendingDataChangeRequestsCount} setActiveView={setActiveView}/>;
        }
    };

    return (
        <Layout navLinks={navLinksWithBadge} activeView={activeView} setActiveView={setActiveView}>
            {renderContent()}
        </Layout>
    );
};