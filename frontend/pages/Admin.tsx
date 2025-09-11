import React, { useState, useMemo, Fragment, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layout } from '../components/Layout';
import { ADMIN_NAV_LINKS, ICONS, attendanceData, GOLONGAN_OPTIONS } from '../constants';
import { Card, StatCard, PageTitle, Textarea, Input, Select } from '../components/ui';
import { Employee, LeaveRequest, LeaveStatus, MaritalStatus, Education, WorkExperience, Certificate, User, Role, PayrollInfo, PayComponent, PerformanceReview, KPI, AttendanceRecord, AttendanceStatus, DataChangeRequest } from '../types';
import { useData } from '../context/DataContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../App';
import { Modal, Button, Alert, Form } from 'react-bootstrap';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const NewLeaveRequestAlert: React.FC<{ count: number; onViewClick: () => void }> = ({ count, onViewClick }) => {
    const [show, setShow] = useState(true);

    if (!show || count === 0) {
        return null;
    }

    return (
        <Alert variant="warning" onClose={() => setShow(false)} dismissible>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <Alert.Heading>Notifikasi Pengajuan Baru</Alert.Heading>
                    <p className="mb-0">Anda memiliki {count} pengajuan cuti yang menunggu persetujuan.</p>
                </div>
                <Button onClick={onViewClick} variant="primary">Lihat Pengajuan</Button>
            </div>
        </Alert>
    );
};

const NewDataChangeRequestAlert: React.FC<{ count: number; onViewClick: () => void }> = ({ count, onViewClick }) => {
    const [show, setShow] = useState(true);

    if (!show || count === 0) {
        return null;
    }

    return (
        <Alert variant="info" onClose={() => setShow(false)} dismissible>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <Alert.Heading>Notifikasi Perubahan Data</Alert.Heading>
                    <p className="mb-0">Anda memiliki {count} permintaan perubahan data yang menunggu persetujuan.</p>
                </div>
                <Button onClick={onViewClick} variant="primary">Lihat Permintaan</Button>
            </div>
        </Alert>
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
        <div className="row g-4 mb-4">
            <div className="col-md-6 col-xl-3">
                <StatCard title="Total Karyawan" value={db.employees.length} icon={ICONS.employees} color="bg-primary bg-opacity-10 text-primary" />
            </div>
            <div className="col-md-6 col-xl-3">
                <StatCard title="Cuti Hari Ini" value="3" icon={ICONS.leave} color="bg-warning bg-opacity-10 text-warning" />
            </div>
            <div className="col-md-6 col-xl-3">
                <StatCard title="Pengajuan Tertunda" value={pendingRequestsCount} icon={<i className="bi bi-hourglass-split fs-4"></i>} color="bg-danger bg-opacity-10 text-danger" />
            </div>
            <div className="col-md-6 col-xl-3">
                <StatCard title="Karyawan Baru (Bulan)" value="2" icon={<i className="bi bi-person-plus-fill fs-4"></i>} color="bg-success bg-opacity-10 text-success" />
            </div>
        </div>
        <Card>
            <h2 className="card-title">Kehadiran Mingguan</h2>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Hadir" fill="#0d6efd" />
                    <Bar dataKey="Absen" fill="#dc3545" />
                    <Bar dataKey="Cuti" fill="#ffc107" />
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
            if (!user) return false;
            
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
            <Card className="mb-4">
                <Form>
                    <div className="row g-3">
                        <div className="col-md-4"><Input label="Cari Nama / NIP" placeholder="Ketik untuk mencari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                        <div className="col-md-4">
                            <Select label="Filter Jabatan" value={positionFilter} onChange={e => setPositionFilter(e.target.value)}>
                                <option value="all">Semua Jabatan</option>
                                {allPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </Select>
                        </div>
                        <div className="col-md-4">
                            <Select label="Filter Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </Select>
                        </div>
                    </div>
                </Form>
            </Card>
            <Card>
                <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="py-3">Karyawan</th>
                            <th scope="col" className="py-3">NIP</th>
                            <th scope="col" className="py-3">Jabatan</th>
                            <th scope="col" className="py-3">Departemen</th>
                            <th scope="col" className="py-3">Status</th>
                            <th scope="col" className="py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const user = users.find(u => u.employeeDetails?.id === emp.id);
                            return (
                                <tr key={emp.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <img src={emp.avatarUrl} className="rounded-circle me-3" width="40" height="40" alt={emp.id}/>
                                            <span>{user?.name || 'Tidak Dikenal'}</span>
                                        </div>
                                    </td>
                                    <td>{emp.nip}</td>
                                    <td>{emp.position}</td>
                                    <td>{emp.department}</td>
                                    <td>
                                        <span className={`badge ${emp.isActive ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                                            {emp.isActive ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="text-nowrap">
                                        <Button size="sm" onClick={() => openDetailsModal(emp)} className="me-2">Lihat Detail</Button>
                                        <Button size="sm" variant="secondary" onClick={() => openFormModal(emp)}>Ubah</Button>
                                    </td>
                                </tr>
                            );
                        })}
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
        gender: employee?.gender || 'Laki-laki',
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
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{employee ? "Ubah Data Karyawan" : "Tambah Karyawan"}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                <Form onSubmit={handleSubmit}>
                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Foto Profil</legend>
                        <div className="d-flex align-items-center gap-3">
                            <img src={formData.avatarUrl} alt="Avatar" className="rounded-circle border border-2" width="96" height="96" />
                            <div>
                                <Form.Label htmlFor="avatarUpload" className="btn btn-sm btn-outline-secondary">
                                    <span>Ganti Foto</span>
                                </Form.Label>
                                <Form.Control id="avatarUpload" name="avatar" type="file" className="d-none" onChange={handleFileChange} accept="image/*" />
                                <Form.Text className="mt-1">PNG, JPG, GIF hingga 1MB.</Form.Text>
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Informasi Akun & Pekerjaan</legend>
                        <div className="row g-3">
                            <div className="col-md-6"><Input label="Nama Karyawan" name="name" value={formData.name} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Input label="NIP" name="nip" value={formData.nip} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Input label="Posisi" name="position" value={formData.position} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Input label="Pangkat" name="pangkat" value={formData.pangkat} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Select label="Golongan" name="golongan" value={formData.golongan} onChange={handleChange}>
                                {GOLONGAN_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </Select></div>
                            <div className="col-md-6"><Input label="Departemen" name="department" value={formData.department} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Input label="Tanggal Bergabung" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} required /></div>
                            <div className="col-12 mt-3">
                                <Form.Check type="checkbox" id="isActive" name="isActive" label="Karyawan Aktif" checked={formData.isActive} onChange={handleChange} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Informasi Pribadi</legend>
                        <div className="row g-3">
                            <div className="col-md-6"><Input label="Nomor Telepon" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                            <div className="col-md-6"><Input label="Tempat Lahir" name="pob" value={formData.pob} onChange={handleChange} /></div>
                            <div className="col-md-6"><Input label="Tanggal Lahir" name="dob" type="date" value={formData.dob} onChange={handleChange} /></div>
                            <div className="col-md-6"><Select label="Jenis Kelamin" name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </Select></div>
                            <div className="col-md-6"><Select label="Agama" name="religion" value={formData.religion} onChange={handleChange}>
                                <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                            </Select></div>
                            <div className="col-md-6"><Select label="Status Perkawinan" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
                                <option>Lajang</option><option>Menikah</option><option>Bercerai</option><option>Janda/Duda</option>
                            </Select></div>
                            <div className="col-md-6"><Input label="Jumlah Anak" name="numberOfChildren" type="number" min="0" value={formData.numberOfChildren} onChange={handleChange} /></div>
                            <div className="col-12"><Textarea label="Alamat" name="address" value={formData.address} onChange={handleChange} /></div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Riwayat Pendidikan</legend>
                        {formData.educationHistory?.map((edu, index) => (
                            <div key={index} className="row g-2 mb-2 p-2 border rounded position-relative">
                                <div className="col-md-3"><Input label="Jenjang" name="level" value={edu.level} onChange={e => handleDynamicChange(index, e, 'educationHistory')} placeholder="cth: S1" /></div>
                                <div className="col-md-3"><Input label="Institusi" name="institution" value={edu.institution} onChange={e => handleDynamicChange(index, e, 'educationHistory')} /></div>
                                <div className="col-md-3"><Input label="Jurusan" name="major" value={edu.major} onChange={e => handleDynamicChange(index, e, 'educationHistory')} /></div>
                                <div className="col-md-3"><Input label="Tahun Lulus" name="graduationYear" type="number" value={edu.graduationYear} onChange={e => handleDynamicChange(index, e, 'educationHistory')} /></div>
                                <button type="button" onClick={() => handleRemoveItem(index, 'educationHistory')} className="btn-close position-absolute top-0 end-0 mt-1 me-1"></button>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={() => handleAddItem('educationHistory')}>+ Tambah Pendidikan</Button>
                    </fieldset>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" form="employee-form" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </Modal.Footer>
        </Modal>
    );
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h4 className="h5 text-primary border-bottom pb-2 mb-3">{title}</h4>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div>
        <p className="text-muted small mb-0">{label}</p>
        <p className="fw-semibold">{value || '-'}</p>
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
            ['Jenis Kelamin', employee.gender],
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
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{`Detail Karyawan: ${user.name || ''}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{maxHeight: '75vh', overflowY: 'auto'}}>
                <div className="d-flex flex-column flex-md-row align-items-start mb-4">
                    <img src={employee.avatarUrl} alt="Avatar" className="rounded-circle border border-2 me-md-4 mb-3 mb-md-0" width="120" height="120" />
                    <div>
                        <h3 className="h4 fw-bold">{user.name}</h3>
                        <p className="text-muted">{employee.position}</p>
                        <p className="small text-muted">{employee.department} - {employee.pangkat} ({employee.golongan})</p>
                        <span className={`badge mt-2 ${employee.isActive ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                            {employee.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                </div>

                <DetailSection title="Informasi Pekerjaan">
                    <div className="row g-3">
                        <div className="col-md-4"><DetailItem label="NIP" value={employee.nip} /></div>
                        <div className="col-md-4"><DetailItem label="Email" value={user.email} /></div>
                        <div className="col-md-4"><DetailItem label="Telepon" value={employee.phone} /></div>
                        <div className="col-md-4"><DetailItem label="Tanggal Bergabung" value={employee.joinDate} /></div>
                        <div className="col-md-4"><DetailItem label="Sisa Cuti" value={`${employee.leaveBalance} hari`} /></div>
                    </div>
                </DetailSection>

                <DetailSection title="Informasi Pribadi">
                     <div className="row g-3">
                        <div className="col-md-4"><DetailItem label="Tempat, Tanggal Lahir" value={`${employee.pob}, ${employee.dob}`} /></div>
                        <div className="col-md-4"><DetailItem label="Jenis Kelamin" value={employee.gender} /></div>
                        <div className="col-md-4"><DetailItem label="Agama" value={employee.religion} /></div>
                        <div className="col-md-4"><DetailItem label="Status Perkawinan" value={employee.maritalStatus} /></div>
                        <div className="col-md-4"><DetailItem label="Jumlah Anak" value={employee.numberOfChildren} /></div>
                        <div className="col-12">
                            <DetailItem label="Alamat" value={employee.address} />
                        </div>
                    </div>
                </DetailSection>

                <DetailSection title="Riwayat Pendidikan">
                    <ul className="list-group list-group-flush">
                        {employee.educationHistory.map((edu, i) => <li key={i} className="list-group-item"><strong>{edu.level} {edu.major}</strong> di {edu.institution} (Lulus {edu.graduationYear})</li>)}
                        {employee.educationHistory.length === 0 && <p className="text-muted">Tidak ada data.</p>}
                    </ul>
                </DetailSection>

                <DetailSection title="Riwayat Pekerjaan">
                    <ul className="list-group list-group-flush">
                         {employee.workHistory.map((work, i) => <li key={i} className="list-group-item"><strong>{work.position}</strong> di {work.company} ({work.startDate} - {work.endDate})</li>)}
                         {employee.workHistory.length === 0 && <p className="text-muted">Tidak ada data.</p>}
                    </ul>
                </DetailSection>

                 <DetailSection title="Sertifikat Pelatihan">
                    <ul className="list-group list-group-flush">
                         {employee.trainingCertificates.map((cert, i) => <li key={i} className="list-group-item"><strong>{cert.name}</strong> dari {cert.issuer} (Diperoleh {cert.issueDate})</li>)}
                         {employee.trainingCertificates.length === 0 && <p className="text-muted">Tidak ada data.</p>}
                    </ul>
                </DetailSection>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Tutup</Button>
                <Button onClick={handlePrint}>Cetak / Unduh</Button>
            </Modal.Footer>
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
        let fullUrl = documentUrl;
        
        if (documentUrl.startsWith('/uploads/')) {
            fullUrl = `${API_BASE_URL}${documentUrl}`;
        } 
        else if (documentUrl.startsWith('http://') || documentUrl.startsWith('https://')) {
            fullUrl = documentUrl;
        }
        else if (documentUrl.startsWith('file://')) {
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
            const link = document.createElement('a');
            
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
            case LeaveStatus.PENDING: return 'bg-warning-subtle text-warning-emphasis';
            case LeaveStatus.APPROVED: return 'bg-success-subtle text-success-emphasis';
            case LeaveStatus.REJECTED: return 'bg-danger-subtle text-danger-emphasis';
        }
    };

    return (
        <div>
            <PageTitle title="Pengajuan Cuti" />
            <Card>
                 <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="py-3">Karyawan</th>
                            <th scope="col" className="py-3">Jenis Cuti</th>
                            <th scope="col" className="py-3">Tanggal Mulai</th>
                            <th scope="col" className="py-3">Tanggal Selesai</th>
                            <th scope="col" className="py-3">Alasan</th>
                            <th scope="col" className="py-3">Dokumen</th>
                            <th scope="col" className="py-3">Status</th>
                            <th scope="col" className="py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.map(req => (
                            <tr key={req.id}>
                                <td>{req.employeeName}</td>
                                <td>{req.leaveType}</td>
                                <td>{req.startDate}</td>
                                <td>{req.endDate}</td>
                                <td style={{maxWidth: '200px'}} className="text-truncate" title={req.reason}>{req.reason}</td>
                                <td>
                                    {req.supportingDocument ? (
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={() => openDocumentModal(req.supportingDocument!, `document_${req.id}`)}
                                        >
                                            Lihat Dokumen
                                        </Button>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td><span className={`badge ${statusColor(req.status)}`}>{req.status}</span></td>
                                <td className="text-nowrap">
                                    {req.status === LeaveStatus.PENDING && (
                                        <>
                                            <Button variant="success" size="sm" onClick={() => handleApprove(req.id)} className="me-2">Setujui</Button>
                                            <Button variant="danger" size="sm" onClick={() => openRejectionModal(req.id)}>Tolak</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>
            <Modal show={rejectionModalState.isOpen} onHide={closeRejectionModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Alasan Penolakan Cuti</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Textarea
                        label="Mohon berikan alasan penolakan pengajuan cuti ini."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        rows={3}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeRejectionModal}>Batal</Button>
                    <Button variant="danger" onClick={handleRejectSubmit} disabled={!rejectionReason.trim()}>Kirim Penolakan</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={documentModalState.isOpen} onHide={closeDocumentModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Dokumen Pendukung</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {documentModalState.documentUrl && (
                        <div className="d-flex flex-column align-items-center">
                            {documentModalState.documentUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={documentModalState.documentUrl}
                                    className="w-100"
                                    style={{height: '70vh'}}
                                    title="Document Preview"
                                />
                            ) : (
                                <>
                                    {documentModalState.documentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                        <img 
                                            src={documentModalState.documentUrl}
                                            alt="Document Preview" 
                                            className="img-fluid" style={{maxHeight: '70vh'}}
                                        />
                                    ) : (
                                        <div className="text-center p-5">
                                            <p className="mb-3">Pratinjau dokumen tidak tersedia untuk jenis file ini.</p>
                                            <p className="small text-muted">Klik "Unduh Dokumen" untuk melihat file.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleDownloadDocument}>Unduh Dokumen</Button>
                    <Button variant="secondary" onClick={closeDocumentModal}>Tutup</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

    const AttendanceManagement: React.FC = () => {
        const { db, refreshData } = useData();
        const { addToast } = useToast();
        const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

        if (!db || !db.attendance) {
            return <p>Memuat data absensi...</p>;
        }

        const { attendance: records, users, employees } = db;

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

                const attendanceRecords = json.map(row => ({
                    employeeName: row.employeeName,
                    date: row.date,
                    clockIn: row.clockIn,
                    clockOut: row.clockOut,
                    status: row.status,
                }));

                if (attendanceRecords.length > 0) {
                    const response = await api.uploadAttendance(attendanceRecords as any);
                    const warnings = response.warnings || [];
                    if (warnings.length > 0) {
                        let toastMessage = `Unggah selesai dengan ${warnings.length} peringatan.`;
                        if (warnings.length <= 3) {
                            const warningDetails = warnings.join('\n');
                            toastMessage = `${toastMessage}:\n${warningDetails}`;
                        } else {
                            toastMessage = `${toastMessage} Periksa konsol untuk detail.`;
                        }
                        addToast(toastMessage, 'warning');
                        console.warn('Peringatan unggah absensi:', warnings);
                    } else {
                        addToast('Data absensi berhasil diunggah', 'success');
                    }
                    refreshData();
                } else {
                    addToast('File tidak berisi data absensi yang valid.', 'info');
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
                color = 'bg-success-subtle text-success-emphasis';
                break;
            case AttendanceStatus.LATE:
                color = 'bg-danger-subtle text-danger-emphasis';
                break;
            default:
                color = 'bg-secondary-subtle text-secondary-emphasis';
        }
        return <span className={`badge ${color}`}>{status}</span>;
    }

    return (
        <div>
            <PageTitle title="Manajemen Absensi">
                <div className="d-flex align-items-center gap-2">
                    <Input 
                        label=""
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                    <Button as="a" href="/template_absensi.csv" download="template_absensi.csv" variant="secondary">
                        Unduh Template
                    </Button>
                    <Button as="label" htmlFor="attendance-upload">
                        Unggah Excel
                    </Button>
                    <input id="attendance-upload" type="file" className="d-none" onChange={handleFileUpload} accept=".xlsx, .xls, .csv"/>
                </div>
            </PageTitle>
            <Card>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="py-3">Karyawan</th>
                                <th scope="col" className="py-3">Clock In</th>
                                <th scope="col" className="py-3">Clock Out</th>
                                <th scope="col" className="py-3">Durasi Kerja</th>
                                <th scope="col" className="py-3">Status</th>
                                <th scope="col" className="py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(rec => (
                                <tr key={rec.id}>
                                    <td>{rec.employeeName}</td>
                                    <td>{rec.clockIn}</td>
                                    <td>{rec.clockOut || 'Belum Clock Out'}</td>
                                    <td>{calculateDuration(rec.clockIn, rec.clockOut)}</td>
                                    <td>{getStatusChip(rec.status)}</td>
                                    <td>
                                        <Button variant="secondary" size="sm">Ubah</Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-4 text-muted">
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
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{`Buat Penilaian Kinerja: ${employee.name}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{maxHeight: '75vh', overflowY: 'auto'}}>
                <Form onSubmit={handleSubmit}>
                    <Input label="Periode Penilaian" name="period" value={reviewData.period} onChange={handleDataChange} placeholder="Contoh: Q3 2024" required />

                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Key Performance Indicators (KPI)</legend>
                        {reviewData.kpis.map((kpi, index) => (
                            <div key={kpi.id} className="row g-2 mb-3 p-2 border rounded position-relative">
                                <div className="col-12"><Input label="Metrik" name="metric" value={kpi.metric} onChange={(e) => handleKpiChange(index, e)} placeholder="Contoh: Penyelesaian Tugas" /></div>
                                <div className="col-md-6"><Input label="Target" name="target" value={kpi.target} onChange={(e) => handleKpiChange(index, e)} /></div>
                                <div className="col-md-6"><Input label="Hasil" name="result" value={kpi.result} onChange={(e) => handleKpiChange(index, e)} /></div>
                                <div className="col-md-6"><Input label="Bobot (0-1)" name="weight" type="number" step="0.1" min="0" max="1" value={kpi.weight} onChange={(e) => handleKpiChange(index, e)} /></div>
                                <div className="col-md-6"><Input label="Skor (1-5)" name="score" type="number" min="1" max="5" value={kpi.score} onChange={(e) => handleKpiChange(index, e)} /></div>
                                <button type="button" onClick={() => removeKpi(index)} className="btn-close position-absolute top-0 end-0 mt-1 me-1"></button>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={addKpi}>+ Tambah KPI</Button>
                    </fieldset>

                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Umpan Balik Kualitatif</legend>
                        <div className="vstack gap-3">
                            <Textarea label="Kekuatan" name="strengths" value={reviewData.strengths} onChange={handleDataChange} rows={3} />
                            <Textarea label="Area untuk Peningkatan" name="areasForImprovement" value={reviewData.areasForImprovement} onChange={handleDataChange} rows={3} />
                        </div>
                    </fieldset>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit">Simpan Penilaian</Button>
            </Modal.Footer>
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
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="py-3">Karyawan</th>
                                <th scope="col" className="py-3">Jabatan</th>
                                <th scope="col" className="py-3">Penilaian Terakhir</th>
                                <th scope="col" className="py-3">Skor Terakhir</th>
                                <th scope="col" className="py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.filter(e => e.isActive).map(emp => {
                                const user = users.find(u => u.employeeDetails?.id === emp.id);
                                if (!user) return null;
                                
                                const lastReview = performanceReviews.filter(r => r.employeeId === emp.id).sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0];
                                return (
                                    <tr key={emp.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <img src={emp.avatarUrl} className="rounded-circle me-3" width="40" height="40" alt={user?.name} />
                                                <span>{user?.name}</span>
                                            </div>
                                        </td>
                                        <td>{emp.position}</td>
                                        <td>{lastReview?.period || 'Belum ada'}</td>
                                        <td>{lastReview?.overallScore || '-'}</td>
                                        <td className="text-nowrap">
                                            <Button variant="secondary" size="sm" className="me-2">Lihat Riwayat</Button>
                                            <Button onClick={() => user && openFormModal({id: emp.id, name: user.name})} size="sm">Buat Penilaian</Button>
                                        </td>
                                    </tr>
                                );
                            }).filter(Boolean)}
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
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{`Kelola Gaji: ${user.name}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                <Form onSubmit={handleSubmit}>
                    <Input label="Gaji Pokok" type="number" value={payrollInfo.baseSalary} onChange={handleBaseSalaryChange} />

                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Komponen Pendapatan</legend>
                        {payrollInfo.incomes.map((income, index) => (
                            <div key={income.id} className="row g-2 mb-2 align-items-center">
                                <div className="col-6"><Input label="" name="name" value={income.name} onChange={e => handleComponentChange(index, 'incomes', e)} placeholder="Nama Tunjangan" /></div>
                                <div className="col-5"><Input label="" name="amount" type="number" value={income.amount} onChange={e => handleComponentChange(index, 'incomes', e)} placeholder="Jumlah" /></div>
                                <div className="col-1"><button type="button" onClick={() => removeComponent(index, 'incomes')} className="btn-close"></button></div>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={() => addComponent('incomes')}>+ Tambah Pendapatan</Button>
                    </fieldset>

                    <fieldset className="border p-3 rounded mb-4">
                        <legend className="px-2 h6">Komponen Potongan</legend>
                        {payrollInfo.deductions.map((deduction, index) => (
                            <div key={deduction.id} className="row g-2 mb-2 align-items-center">
                                <div className="col-6"><Input label="" name="name" value={deduction.name} onChange={e => handleComponentChange(index, 'deductions', e)} placeholder="Nama Potongan" /></div>
                                <div className="col-5"><Input label="" name="amount" type="number" value={deduction.amount} onChange={e => handleComponentChange(index, 'deductions', e)} placeholder="Jumlah" /></div>
                                <div className="col-1"><button type="button" onClick={() => removeComponent(index, 'deductions')} className="btn-close"></button></div>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={() => addComponent('deductions')}>+ Tambah Potongan</Button>
                    </fieldset>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit">Simpan Pengaturan</Button>
            </Modal.Footer>
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
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="py-3">Karyawan</th>
                                <th scope="col" className="py-3">Jabatan</th>
                                <th scope="col" className="py-3">Gaji Pokok</th>
                                <th scope="col" className="py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const user = users.find(u => u.employeeDetails?.id === emp.id);
                                if (!user) return null;
                                
                                return (
                                <tr key={emp.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <img src={emp.avatarUrl} className="rounded-circle me-3" width="40" height="40" alt={user?.name}/>
                                            <span>{user?.name || 'Tidak Dikenal'}</span>
                                        </div>
                                    </td>
                                    <td>{emp.position}</td>
                                    <td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(emp.payrollInfo.baseSalary)}</td>
                                    <td>
                                        <Button onClick={() => openModal(emp)}>Kelola Gaji</Button>
                                    </td>
                                </tr>
                            )}).filter(Boolean)}
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
            await api.submitDataChangeRequest(`Sending ${reportName} to ${email}`, user?.employeeDetails?.id, user?.name);
            addToast(`${reportName} berhasil dikirim ke ${email}`, 'success');
            onClose();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal mengirim laporan", 'error');
        }
    };

    return (
        <Modal show={true} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{`Kirim ${reportName} via Email`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Input
                        label="Alamat Email Penerima"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@perusahaan.com"
                        required
                    />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" disabled={!email}>Kirim</Button>
            </Modal.Footer>
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
                    if (!user) return null;
                    
                    return {
                        'Nama': user?.name || 'N/A',
                        'Posisi': e.position,
                        'Departemen': e.department,
                        'Status': e.isActive ? 'Aktif' : 'Nonaktif'
                    };
                }).filter(Boolean);
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
                    if (!user) return null;
                    
                    return {
                        'Nama': user?.name || 'N/A',
                        'Gaji Pokok': new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(e.payrollInfo.baseSalary)
                    };
                }).filter(Boolean);
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
            <div className="row g-4">
                <div className="col-md-6">
                    <Card>
                        <h3 className="card-title h5">Laporan Rekap Karyawan</h3>
                        <p className="card-text text-muted">Unduh rekap laporan data karyawan.</p>
                        <Button onClick={() => handleDownloadRekap('employee')}>Unduh Excel</Button>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card>
                        <h3 className="card-title h5">Laporan Rekap Absensi</h3>
                        <p className="card-text text-muted">Unduh rekap laporan absensi.</p>
                        <Button onClick={() => handleDownloadRekap('attendance')}>Unduh Excel</Button>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card>
                        <h3 className="card-title h5">Laporan Rekap Pengajuan Cuti</h3>
                        <p className="card-text text-muted">Unduh rekap laporan pengajuan cuti.</p>
                        <Button onClick={() => handleDownloadRekap('leave')}>Unduh Excel</Button>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card>
                        <h3 className="card-title h5">Laporan Rekap Permintaan Data</h3>
                        <p className="card-text text-muted">Unduh rekap laporan permintaan data.</p>
                        <Button onClick={() => handleDownloadRekap('data-change')}>Unduh Excel</Button>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card>
                        <h3 className="card-title h5">Laporan Rekap Penggajian</h3>
                        <p className="card-text text-muted">Unduh rekap laporan penggajian.</p>
                        <Button onClick={() => handleDownloadRekap('payroll')}>Unduh Excel</Button>
                    </Card>
                </div>
            </div>
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
            const status = actionModalState.action === 'approve' ? 'Approved' : 'Rejected';
            await api.updateDataChangeRequestStatus(actionModalState.requestId, status);
            addToast(`Permintaan berhasil ${status === 'Approved' ? 'disetujui' : 'ditolak'}`, 'success');
            await refreshData();
            closeActionModal();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Gagal memperbarui status permintaan', 'error');
        }
    };

    const statusColor = (status: string) => {
        switch(status) {
            case 'Pending': return 'bg-warning-subtle text-warning-emphasis';
            case 'Approved': return 'bg-success-subtle text-success-emphasis';
            case 'Rejected': return 'bg-danger-subtle text-danger-emphasis';
            default: return 'bg-secondary-subtle text-secondary-emphasis';
        }
    };

    return (
        <div>
            <PageTitle title="Permintaan Perubahan Data" />
            <Card>
                 <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="py-3">Karyawan</th>
                            <th scope="col" className="py-3">Tanggal</th>
                            <th scope="col" className="py-3">Pesan</th>
                            <th scope="col" className="py-3">Status</th>
                            <th scope="col" className="py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {db?.dataChangeRequests.map(req => (
                            <tr key={req.id}>
                                <td>{req.employeeName}</td>
                                <td>{req.requestDate}</td>
                                <td style={{maxWidth: '200px'}} className="text-truncate" title={req.message}>{req.message}</td>
                                <td><span className={`badge ${statusColor(req.status)}`}>{req.status}</span></td>
                                <td className="text-nowrap">
                                    {req.status === 'Pending' && (
                                        <>
                                            <Button variant="success" size="sm" onClick={() => handleApprove(req.id)} className="me-2">Setujui</Button>
                                            <Button variant="danger" size="sm" onClick={() => handleReject(req.id)}>Tolak</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Card>
            <Modal show={actionModalState.isOpen} onHide={closeActionModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{actionModalState.action === 'approve' ? "Konfirmasi Persetujuan" : "Alasan Penolakan"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {actionModalState.action === 'reject' ? (
                        <React.Fragment>
                            <Textarea
                                label="Mohon berikan alasan penolakan permintaan ini."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                                rows={3}
                            />
                        </React.Fragment>
                    ) : (
                        <p>Apakah Anda yakin ingin menyetujui permintaan perubahan data ini?</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {actionModalState.action === 'reject' ? (
                        <React.Fragment>
                            <Button variant="secondary" onClick={closeActionModal}>Batal</Button>
                            <Button variant="danger" onClick={handleActionSubmit} disabled={!rejectionReason.trim()}>Kirim Penolakan</Button>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <Button variant="secondary" onClick={closeActionModal}>Batal</Button>
                            <Button variant="success" onClick={handleActionSubmit}>Konfirmasi</Button>
                        </React.Fragment>
                    )}
                </Modal.Footer>
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
                await api.updateUser(selectedUser.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                });
                addToast('Pengguna berhasil diperbarui', 'success');
            } else {
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
            
            <Card className="mb-4">
                <Input 
                    label="Cari Pengguna" 
                    placeholder="Cari berdasarkan nama atau email..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </Card>
            
            <Card>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="py-3">Nama</th>
                                <th scope="col" className="py-3">Email</th>
                                <th scope="col" className="py-3">Peran</th>
                                <th scope="col" className="py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${ 
                                            user.role === 'ADMIN' 
                                                ? 'bg-primary-subtle text-primary-emphasis' 
                                                : 'bg-secondary-subtle text-secondary-emphasis'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="text-nowrap">
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={() => openFormModal(user)} 
                                            className="me-2"
                                        >
                                            Ubah
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => handleDelete(user.id, user.name)}
                                            disabled={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1}
                                        >
                                            Hapus
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-4 text-muted">
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
                    show={isFormModalOpen} 
                    onHide={closeFormModal} 
                > 
                    <Modal.Header closeButton>
                        <Modal.Title>{selectedUser ? "Ubah Pengguna" : "Tambah Pengguna Baru"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit}>
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
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button 
                            variant="secondary" 
                            onClick={closeFormModal}
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </Modal.Footer>
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
            const pendingDataChangeRequestsCount = useMemo(() => db.dataChangeRequests.filter(r => r.status === 'Pending').length, [db.dataChangeRequests]);

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
