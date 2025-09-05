
import React, { useState, useMemo, Fragment } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layout } from '../components/Layout';
import { ADMIN_NAV_LINKS, MOCK_DB, ICONS, attendanceData } from '../constants';
import { Card, StatCard, Modal, Button, Input, Select, PageTitle, Textarea } from '../components/ui';
import { Employee, LeaveRequest, LeaveStatus, MaritalStatus, Education, WorkExperience, Certificate, User, Role, PayrollInfo, PayComponent, PerformanceReview, KPI, AttendanceRecord, AttendanceStatus } from '../types';

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


const AdminDashboard: React.FC<{ pendingRequestsCount: number; setActiveView: (view: string) => void }> = ({ pendingRequestsCount, setActiveView }) => (
    <div>
        <NewLeaveRequestAlert count={pendingRequestsCount} onViewClick={() => setActiveView('leaves')} />
        <PageTitle title="Dasbor Admin" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Karyawan" value={MOCK_DB.employees.length} icon={ICONS.employees} color="bg-blue-100 text-blue-600" />
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
);

const EmployeeManagement: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>(MOCK_DB.employees);
    const [users, setUsers] = useState<User[]>(MOCK_DB.users);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const [selectedEmployeeForForm, setSelectedEmployeeForForm] = useState<(Partial<Employee> & { name?: string; email?: string }) | null>(null);
    const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<{ employee: Employee; user?: User } | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [positionFilter, setPositionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

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
    };
    
    const handleSave = (data: Partial<Employee> & { name: string; email: string }) => {
        const { name, email, ...employeeData } = data;

        if (employeeData.id) { // Edit existing employee
            const updatedEmployee = employeeData as Employee;
            setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
            setUsers(users.map(u => u.employeeDetails?.id === updatedEmployee.id ? { ...u, name, email } : u));
        } else { // Add new employee
            const newId = `emp-${Date.now()}`;
            const newEmployee: Employee = {
                ...(employeeData as Omit<Employee, 'id'>),
                id: newId,
                avatarUrl: 'https://picsum.photos/id/1/200', // Default avatar
                payrollInfo: { baseSalary: 0, incomes: [], deductions: [] }, // Default payroll
            };
            const newUser: User = {
                id: `user-${Date.now()}`,
                name,
                email,
                role: Role.EMPLOYEE,
                employeeDetails: newEmployee
            };
            setEmployees([...employees, newEmployee]);
            setUsers([...users, newUser]);
        }
        closeFormModal();
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
    
    const allPositions = useMemo(() => [...new Set(MOCK_DB.employees.map(e => e.position))], []);

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
            {isFormModalOpen && <EmployeeFormModal employee={selectedEmployeeForForm} onSave={handleSave} onClose={closeFormModal} />}
            {isDetailsModalOpen && <EmployeeDetailsModal employee={selectedEmployeeForDetails?.employee} user={selectedEmployeeForDetails?.user} onClose={closeDetailsModal} />}
        </div>
    );
};

const EmployeeFormModal: React.FC<{ employee: (Partial<Employee> & { name?: string, email?: string }) | null, onSave: (data: Partial<Employee> & { name: string; email: string }) => void, onClose: () => void }> = ({ employee, onSave, onClose }) => {
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
        grade: employee?.grade || '',
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

    const handleDynamicChange = (index: number, e: React.ChangeEvent<HTMLInputElement>, field: 'educationHistory' | 'workHistory' | 'trainingCertificates') => {
        const list = [...(formData[field] || [])];
        list[index] = { ...list[index], [e.target.name]: e.target.value };
        setFormData({ ...formData, [field]: list as any });
    };
    
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
                    <legend className="px-2 font-semibold">Informasi Akun & Pekerjaan</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nama Lengkap" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <Input label="NIP" name="nip" value={formData.nip} onChange={handleChange} required />
                        <Input label="Posisi" name="position" value={formData.position} onChange={handleChange} required />
                        <Input label="Golongan" name="grade" value={formData.grade} onChange={handleChange} required />
                        <Input label="Departemen" name="department" value={formData.department} onChange={handleChange} required />
                        <Input label="Tanggal Bergabung" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} required />
                        <div className="flex items-center mt-6">
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
                    <Button type="submit">Simpan</Button>
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

    return (
        <Modal isOpen={true} onClose={onClose} title={`Detail Karyawan: ${user.name || ''}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-4">
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
            <div className="flex justify-end mt-6 pt-4 border-t">
                <Button onClick={onClose} variant="secondary">Tutup</Button>
            </div>
        </Modal>
    );
};


const LeaveManagement: React.FC = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_DB.leaveRequests);
    const [rejectionModalState, setRejectionModalState] = useState<{ isOpen: boolean, requestId: string | null }>({ isOpen: false, requestId: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = (id: string) => {
        setLeaveRequests(leaveRequests.map(req => req.id === id ? { ...req, status: LeaveStatus.APPROVED } : req));
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
        setLeaveRequests(leaveRequests.map(req => 
            req.id === rejectionModalState.requestId 
            ? { ...req, status: LeaveStatus.REJECTED, rejectionReason: rejectionReason } 
            : req
        ));
        closeRejectionModal();
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
                                        <a href="#" onClick={e => e.preventDefault()} className="text-primary-600 hover:underline">Lihat Dokumen</a>
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
        </div>
    );
};

const AttendanceManagement: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_DB.attendance);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
                <Input 
                    label=""
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                />
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


const PerformanceReviewFormModal: React.FC<{ employee: {id: string, name: string}, onSave: (review: PerformanceReview) => void, onClose: () => void }> = ({ employee, onSave, onClose }) => {
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

    const calculateOverallScore = () => {
        const totalWeight = reviewData.kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
        if (totalWeight === 0) return 0;
        const weightedScore = reviewData.kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0);
        return parseFloat((weightedScore / totalWeight).toFixed(2));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalReview: PerformanceReview = {
            ...reviewData,
            id: `pr-${Date.now()}`,
            employeeId: employee.id,
            employeeName: employee.name,
            overallScore: calculateOverallScore(),
        };
        onSave(finalReview);
        onClose();
    };
    
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
    const [reviews, setReviews] = useState<PerformanceReview[]>(MOCK_DB.performanceReviews);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string} | null>(null);

    const openFormModal = (employee: {id: string, name: string}) => {
        setSelectedEmployee(employee);
        setFormModalOpen(true);
    };

    const handleSaveReview = (newReview: PerformanceReview) => {
        setReviews([newReview, ...reviews]);
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
                            {MOCK_DB.employees.filter(e => e.isActive).map(emp => {
                                const user = MOCK_DB.users.find(u => u.employeeDetails?.id === emp.id);
                                const lastReview = reviews.filter(r => r.employeeId === emp.id).sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0];
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
    };
    
    const removeComponent = (index: number, type: 'incomes' | 'deductions') => {
        const components = [...payrollInfo[type]];
        components.splice(index, 1);
        setPayrollInfo({ ...payrollInfo, [type]: components });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(employee.id, payrollInfo);
        onClose();
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
    const [employees, setEmployees] = useState<Employee[]>(MOCK_DB.employees);
    const [users] = useState<User[]>(MOCK_DB.users);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{employee: Employee, user: User} | null>(null);

    const openModal = (employee: Employee) => {
        const user = users.find(u => u.employeeDetails?.id === employee.id);
        if (user) {
            setSelectedEmployee({ employee, user });
            setIsModalOpen(true);
        }
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleSavePayroll = (employeeId: string, payrollInfo: PayrollInfo) => {
        setEmployees(employees.map(emp => emp.id === employeeId ? { ...emp, payrollInfo } : emp));
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

const Reports: React.FC = () => {
    return (
        <div>
            <PageTitle title="Laporan" />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-4 rounded-md">
                        <h3 className="font-semibold text-lg mb-2">Laporan Kehadiran Bulanan</h3>
                        <p className="text-gray-600 mb-4">Unduh laporan kehadiran terperinci untuk semua karyawan pada bulan yang dipilih.</p>
                        <Button>Unduh PDF</Button>
                    </div>
                    <div className="border p-4 rounded-md">
                        <h3 className="font-semibold text-lg mb-2">Laporan Ringkasan Cuti</h3>
                        <p className="text-gray-600 mb-4">Dapatkan ringkasan semua pengajuan cuti yang disetujui, tertunda, dan ditolak.</p>
                        <Button>Unduh Excel</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}


export const AdminPage: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');
    
    const pendingRequestsCount = useMemo(() => MOCK_DB.leaveRequests.filter(r => r.status === LeaveStatus.PENDING).length, []);

    const navLinksWithBadge = useMemo(() => {
        return ADMIN_NAV_LINKS.map(link => {
            if (link.view === 'leaves') {
                return { ...link, badge: pendingRequestsCount };
            }
            return link;
        });
    }, [pendingRequestsCount]);


    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <AdminDashboard pendingRequestsCount={pendingRequestsCount} setActiveView={setActiveView} />;
            case 'employees': return <EmployeeManagement />;
            case 'attendance': return <AttendanceManagement />;
            case 'leaves': return <LeaveManagement />;
            case 'performance': return <PerformanceManagement />;
            case 'payroll': return <PayrollManagement />;
            case 'reports': return <Reports />;
            default: return <AdminDashboard pendingRequestsCount={pendingRequestsCount} setActiveView={setActiveView}/>;
        }
    };

    return (
        <Layout navLinks={navLinksWithBadge} activeView={activeView} setActiveView={setActiveView}>
            {renderContent()}
        </Layout>
    );
};
