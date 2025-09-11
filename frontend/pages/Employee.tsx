import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Layout } from '../components/Layout';
import { EMPLOYEE_NAV_LINKS, ICONS } from '../constants';
import { Card, StatCard, PageTitle, Textarea, Input, Select } from '../components/ui';
import { AuthContext } from '../App';
import { LeaveRequest, LeaveStatus, LeaveType, Payroll, PerformanceReview, AttendanceRecord, AttendanceStatus } from '../types';
import { useData } from '../context/DataContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal, Button, Alert, Accordion, Form, Row, Col, ListGroup } from 'react-bootstrap';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';

const NewPayslipAlert: React.FC<{ payslipPeriod: string; onViewClick: () => void }> = ({ payslipPeriod, onViewClick }) => {
    const [show, setShow] = useState(true);

    if (!show) {
        return null;
    }

    return (
        <Alert variant="info" onClose={() => setShow(false)} dismissible>
            <Alert.Heading>Notifikasi Slip Gaji Baru</Alert.Heading>
            <p className="mb-0">Slip gaji Anda untuk periode <strong>{payslipPeriod}</strong> telah tersedia.</p>
            <Button onClick={onViewClick} variant="primary">Lihat Slip Gaji</Button>
        </Alert>
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

    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    useEffect(() => {
        const fetchLeaveSummary = async () => {
            const employeeId = user?.employeeDetails?.id || user?.employeeId;
            if (employeeId) {
                try {
                    const summary = await api.getLeaveSummary(employeeId);
                    setLeaveSummary(summary);
                } catch (error) {
                    console.error("Failed to fetch leave summary:", error);
                    setLeaveSummary({
                        initialAllotment: 18,
                        nationalHolidays: 0,
                        approvedLeaveTaken: 0,
                        currentBalance: employee?.leaveBalance || 0,
                        calculatedRemaining: employee?.leaveBalance || 0
                    });
                }
            }
        };
        fetchLeaveSummary();
    }, [user?.employeeDetails?.id, user?.employeeId, employee?.leaveBalance]);
    
    if (!db || !user) return null;

    const myRequests = db.leaveRequests.filter(r => r.employeeId === (user?.employeeDetails?.id || user?.employeeId));
    const latestRequest = myRequests.length > 0 ? myRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0] : null;
    
    const statusColor = (status: LeaveStatus | undefined) => {
        if (!status) return 'bg-secondary-subtle text-secondary-emphasis';
        switch(status) {
            case LeaveStatus.PENDING: return 'bg-warning-subtle text-warning-emphasis';
            case LeaveStatus.APPROVED: return 'bg-success-subtle text-success-emphasis';
            case LeaveStatus.REJECTED: return 'bg-danger-subtle text-danger-emphasis';
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
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <StatCard title="Sisa Cuti" value={leaveSummary ? `${leaveSummary.calculatedRemaining} hari` : 'Menghitung...'} icon={ICONS.leave} color="bg-primary-subtle text-primary" />
                </Col>
                <Col md={4}>
                    <Card>
                        <h3 className="h5">Pengajuan Cuti Terakhir</h3>
                        {latestRequest ? (
                            <div>
                                <p className="text-muted">{latestRequest.leaveType}: {latestRequest.startDate} hingga {latestRequest.endDate}</p>
                                <span className={`badge ${statusColor(latestRequest.status)}`}>{latestRequest.status}</span>
                            </div>
                        ) : <p className="text-muted">Tidak ada pengajuan ditemukan.</p>}
                    </Card>
                </Col>
                <Col md={4}>
                    <Card>
                        <h3 className="h5">Pengumuman</h3>
                        <p className="text-muted">Kantor akan libur pada 17 Agustus untuk Hari Kemerdekaan.</p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div>
        <p className="small text-muted mb-0">{label}</p>
        <p className="fw-semibold">{value || '-'}</p>
    </div>
);


const MyProfile: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { db } = useData();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');

    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    if (!user || !employee) return <p>Memuat profil...</p>;
    
    const handleRequestSubmit = async () => {
        if (!employee) return;
        
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
                <div className="d-flex flex-column flex-md-row align-items-start mb-4">
                    <img src={employee.avatarUrl} alt="Avatar" className="rounded-circle border border-2 me-md-4 mb-3 mb-md-0" width="120" height="120" />
                    <div>
                        <h3 className="h4 fw-bold">{user?.name || 'Karyawan'}</h3>
                        <p className="text-muted">{employee.position}</p>
                        <p className="small text-muted">{employee.department} - {employee.pangkat} ({employee.golongan})</p>
                        <span className={`badge mt-2 ${employee.isActive ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                            {employee.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                </div>

                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Informasi Pekerjaan</Accordion.Header>
                        <Accordion.Body>
                            <Row className="g-3">
                                <Col md={4}><DetailItem label="NIP" value={employee.nip} /></Col>
                                <Col md={4}><DetailItem label="Email" value={user?.email} /></Col>
                                <Col md={4}><DetailItem label="Telepon" value={employee.phone} /></Col>
                                <Col md={4}><DetailItem label="Tanggal Bergabung" value={employee.joinDate} /></Col>
                                <Col md={4}><DetailItem label="Sisa Cuti" value={`${employee?.leaveBalance || 'N/A'} hari`} /></Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header>Informasi Pribadi</Accordion.Header>
                        <Accordion.Body>
                            <Row className="g-3">
                                <Col md={4}><DetailItem label="Tempat, Tanggal Lahir" value={`${employee.pob}, ${employee.dob}`} /></Col>
                                <Col md={4}><DetailItem label="Agama" value={employee.religion} /></Col>
                                <Col md={4}><DetailItem label="Status Perkawinan" value={employee.maritalStatus} /></Col>
                                <Col md={4}><DetailItem label="Jumlah Anak" value={employee.numberOfChildren} /></Col>
                                <Col md={8}><DetailItem label="Alamat" value={employee.address} /></Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>Riwayat Pendidikan</Accordion.Header>
                        <Accordion.Body>
                            <ListGroup variant="flush">
                                {employee.educationHistory.map((edu, i) => <ListGroup.Item key={i}><strong>{edu.level} {edu.major}</strong> di {edu.institution} (Lulus {edu.graduationYear})</ListGroup.Item>)}
                                {employee.educationHistory.length === 0 && <p className="text-muted">Tidak ada data.</p>}
                            </ListGroup>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="3">
                        <Accordion.Header>Riwayat Pekerjaan</Accordion.Header>
                        <Accordion.Body>
                            <ListGroup variant="flush">
                                {employee.workHistory.map((work, i) => <ListGroup.Item key={i}><strong>{work.position}</strong> di {work.company} ({work.startDate} - {work.endDate})</ListGroup.Item>)}
                                {employee.workHistory.length === 0 && <p className="text-muted">Tidak ada data.</p>}
                            </ListGroup>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="4">
                        <Accordion.Header>Sertifikat Pelatihan</Accordion.Header>
                        <Accordion.Body>
                            <ListGroup variant="flush">
                                {employee.trainingCertificates.map((cert, i) => <ListGroup.Item key={i}><strong>{cert.name}</strong> dari {cert.issuer} (Diperoleh {cert.issueDate})</ListGroup.Item>)}
                                {employee.trainingCertificates.length === 0 && <p className="text-muted">Tidak ada data.</p>}
                            </ListGroup>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Card>

            <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Formulir Permintaan Perubahan Data</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Textarea 
                        label="Pesan untuk HR"
                        placeholder="Contoh: Mohon perbarui alamat saya ke alamat yang baru."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        required
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                    <Button variant="primary" onClick={handleRequestSubmit} disabled={!requestMessage.trim()}>Kirim Permintaan</Button>
                </Modal.Footer>
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

    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db || !db.employees) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const myAttendanceHistory = useMemo(() => {
        const employeeId = user?.employeeDetails?.id || user?.employeeId;
        if (!db || !db.attendance || !user || !employeeId) return [];
        return db.attendance.filter(a => a.employeeId === employeeId);
    }, [db, user]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!employee) {
        return <p>Memuat data absensi...</p>;
    }

    const todaysRecord = myAttendanceHistory.find(a => a.date === today);
    
    const handleClockIn = async () => {
        if (!employee || todaysRecord) return;
        
        try {
            await api.clockIn(employee.id, user.name);
            addToast(`Clock In berhasil pada ${new Date().toLocaleTimeString('en-GB')}`, 'success');
            await refreshData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal melakukan Clock In", 'error');
        }
    };

    const handleClockOut = async () => {
        if (!todaysRecord || !employee) return;

        try {
            await api.clockOut(employee.id);
            addToast(`Clock Out berhasil pada ${new Date().toLocaleTimeString('en-GB')}`, 'success');
            await refreshData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Gagal melakukan Clock Out", 'error');
        }
    };

    const getStatusChip = (record: AttendanceRecord | undefined) => {
        if (!record || !record.clockIn) return <span className="text-muted">Belum Hadir</span>;
        
        const variant = record.status === AttendanceStatus.LATE ? 'danger' : 'success';
        return <span className={`badge bg-${variant}-subtle text-${variant}-emphasis`}>{record.status}</span>;
    }

    return (
        <div>
            <PageTitle title="Absensi Saya" />
            <Row className="g-4">
                <Col md={6}>
                    <Card className="text-center h-100 d-flex flex-column justify-content-center">
                        <Card.Text className="text-muted">Jam Saat Ini</Card.Text>
                        <Card.Title className="display-4 fw-bold text-primary my-3">
                            {currentTime.toLocaleTimeString('en-GB')}
                        </Card.Title>
                        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                            <Button 
                                onClick={handleClockIn}
                                disabled={!!todaysRecord?.clockIn}
                                size="lg"
                            >
                                Clock In
                            </Button>
                            <Button 
                                variant="outline-primary"
                                onClick={handleClockOut}
                                disabled={!todaysRecord?.clockIn || !!todaysRecord?.clockOut}
                                size="lg"
                            >
                                Clock Out
                            </Button>
                        </div>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Title as="h3" className="h5">Status Hari Ini</Card.Title>
                        <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Tanggal:</span>
                                <span className="fw-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Status Kehadiran:</span>
                                {getStatusChip(todaysRecord)}
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Waktu Masuk:</span>
                                <span className="fw-semibold">{todaysRecord?.clockIn || '-'}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Waktu Keluar:</span>
                                <span className="fw-semibold">{todaysRecord?.clockOut || '-'}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Durasi Kerja:</span>
                                <span className="fw-semibold">{todaysRecord?.workDuration || '-'}</span>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
            <Card className="mt-4">
                 <Card.Title as="h3" className="h5">Riwayat Absensi (7 Hari Terakhir)</Card.Title>
                 <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th className="py-3">Tanggal</th>
                                <th className="py-3">Clock In</th>
                                <th className="py-3">Clock Out</th>
                                <th className="py-3">Durasi</th>
                                <th className="py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myAttendanceHistory.slice(0, 7).map(rec => (
                                <tr key={rec.id}>
                                    <td>{rec.date}</td>
                                    <td>{rec.clockIn}</td>
                                    <td>{rec.clockOut || '-'}</td>
                                    <td>{rec.workDuration || '-'}</td>
                                    <td>
                                        <span className={`badge ${rec.status === AttendanceStatus.LATE ? 'bg-danger-subtle text-danger-emphasis' : 'bg-success-subtle text-success-emphasis'}`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                             {myAttendanceHistory.length === 0 && (
                                <tr><td colSpan={5} className="text-center p-4 text-muted">Tidak ada riwayat absensi.</td></tr>
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
    
    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const myRequests = useMemo(() => {
        const employeeId = user?.employeeDetails?.id || user?.employeeId;
        if (!db || !user || !employeeId) return [];
        return db.leaveRequests.filter(r => r.employeeId === employeeId);
    }, [db, user]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleApplyLeave = async (newRequestData: any) => {
        if(!employee || !user) return;
        
        try {
            const { supportingDocument, ...requestData } = newRequestData;
            
            const request = {
                employeeId: employee.id,
                employeeName: user.name,
                ...requestData
            };
            
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
            case LeaveStatus.PENDING: return 'bg-warning-subtle text-warning-emphasis';
            case LeaveStatus.APPROVED: return 'bg-success-subtle text-success-emphasis';
            case LeaveStatus.REJECTED: return 'bg-danger-subtle text-danger-emphasis';
        }
    };

    return (
        <div>
            <PageTitle title="Pengajuan Cuti Saya">
                <Button onClick={() => setIsModalOpen(true)}>Ajukan Cuti</Button>
            </PageTitle>
            <Card>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th className="py-3">Jenis</th>
                                <th className="py-3">Tanggal</th>
                                <th className="py-3">Alasan</th>
                                <th className="py-3">Status</th>
                                <th className="py-3">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.leaveType}</td>
                                    <td>{req.startDate} hingga {req.endDate}</td>
                                    <td className="text-truncate" style={{maxWidth: '200px'}}>{req.reason}</td>
                                    <td><span className={`badge ${statusColor(req.status)}`}>{req.status}</span></td>
                                    <td className="text-muted">
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
        <Modal show={true} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Ajukan Cuti</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Select label="Jenis Cuti" name="leaveType" value={formData.leaveType} onChange={handleChange}>
                        {Object.values(LeaveType).map(type => <option key={type} value={type}>{type}</option>)}
                    </Select>
                    <Input label="Tanggal Mulai" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required/>
                    <Input label="Tanggal Selesai" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required/>
                    <Textarea label="Alasan" name="reason" value={formData.reason} onChange={handleChange} required/>
                    
                    {formData.leaveType === LeaveType.SICK && (
                        <Form.Group className="mb-3">
                            <Form.Label>Unggah Surat Keterangan Dokter</Form.Label>
                            <Form.Control type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                            {documentPreview && <img src={documentPreview} alt="Document preview" className="img-thumbnail mt-2" style={{maxHeight: '150px'}} />}
                            {supportingDocument && <Form.Text>{supportingDocument.name}</Form.Text>}
                            <Form.Text>Format yang diterima: PDF, JPG, JPEG, PNG. Maksimal 5MB.</Form.Text>
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button variant="primary" type="submit">Kirim</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

const PerformanceReviewDetailModal: React.FC<{ review: PerformanceReview; onSaveFeedback: (reviewId: string, feedback: string) => void; onClose: () => void; }> = ({ review, onSaveFeedback, onClose }) => {
    const [employeeFeedback, setEmployeeFeedback] = useState(review.employeeFeedback || '');

    const handleSave = () => {
        onSaveFeedback(review.id, employeeFeedback);
    };

    const scoreColor = (score: number) => {
        if (score >= 4) return 'text-success';
        if (score >= 3) return 'text-primary';
        if (score >= 2) return 'text-warning';
        return 'text-danger';
    };

    const getBarFillColor = (score: number) => {
        if (score >= 4) return 'var(--bs-success)';
        if (score >= 3) return 'var(--bs-primary)';
        if (score >= 2) return 'var(--bs-warning)';
        return 'var(--bs-danger)';
    };


    return (
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{`Detail Kinerja - ${review.period}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{maxHeight: '75vh', overflowY: 'auto'}}>
                <div className="text-center bg-light rounded p-4 mb-4">
                    <p className="small text-muted mb-1">SKOR KESELURUHAN</p>
                    <p className={`display-4 fw-bold ${scoreColor(review.overallScore)}`}>{review.overallScore.toFixed(1)}</p>
                    <p className="small text-muted mt-1">Dinilai oleh {review.reviewerName} pada {review.reviewDate}</p>
                </div>

                <div className="mb-4">
                    <h4 className="h5 mb-3">Rincian KPI</h4>
                    <div className="vstack gap-3">
                        {review.kpis.map(kpi => (
                            <Card key={kpi.id}>
                                <Row className="align-items-center">
                                    <Col md={8}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <p className="fw-semibold pe-2">{kpi.metric}</p>
                                            <p className={`fw-bold fs-5 flex-shrink-0 ${scoreColor(kpi.score)}`}>{kpi.score}/5</p>
                                        </div>
                                        <div className="small text-muted row mt-1">
                                            <p className="col-6"><strong>Target:</strong> {kpi.target}</p>
                                            <p className="col-6"><strong>Hasil:</strong> {kpi.result}</p>
                                        </div>
                                        {kpi.notes && <p className="small text-muted mt-2"><em>Catatan: {kpi.notes}</em></p>}
                                    </Col>
                                    <Col md={4}>
                                        <ResponsiveContainer width="100%" height={40}>
                                            <BarChart layout="vertical" data={[{ name: 'Skor', score: kpi.score }]} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                                <XAxis type="number" domain={[0, 5]} hide />
                                                <YAxis type="category" dataKey="name" hide />
                                                <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`${value} / 5`, 'Skor']}/>
                                                <Bar dataKey="score" barSize={15} background={{ fill: '#eee', radius: 4 }} radius={4}>
                                                    <Cell fill={getBarFillColor(kpi.score)} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="h5 mb-3">Umpan Balik Penilai</h4>
                    <Alert variant="primary">
                        <p className="fw-semibold">Kekuatan:</p>
                        <p className="text-muted mb-2">{review.strengths}</p>
                        <p className="fw-semibold">Area Peningkatan:</p>
                        <p className="text-muted">{review.areasForImprovement}</p>
                    </Alert>
                </div>

                <div>
                    <h4 className="h5 mb-3">Tanggapan Anda</h4>
                    <Textarea 
                        label=""
                        value={employeeFeedback}
                        onChange={(e) => setEmployeeFeedback(e.target.value)}
                        placeholder="Berikan tanggapan Anda di sini..."
                        rows={4}
                        disabled={!!review.employeeFeedback}
                    />
                     {review.employeeFeedback && <Form.Text>Tanggapan sudah dikirim dan tidak bisa diubah.</Form.Text>}
                </div>
            </Modal.Body>
             <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Tutup</Button>
                {!review.employeeFeedback && <Button onClick={handleSave}>Kirim Tanggapan</Button>}
            </Modal.Footer>
        </Modal>
    );
};

const MyPerformance: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { db, refreshData } = useData();
    const { addToast } = useToast();
    
    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const myReviews = useMemo(() => {
        const employeeId = user?.employeeDetails?.id || user?.employeeId;
        if (!db || !user || !employeeId) return [];
        return db.performanceReviews.filter(r => r.employeeId === employeeId);
    }, [db, user]);

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
                <ListGroup variant="flush">
                    {myReviews.sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()).map(review => (
                        <ListGroup.Item key={review.id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <p className="fw-semibold mb-1">Penilaian Kinerja - {review.period}</p>
                                <p className="text-muted mb-0">Skor Akhir: <span className="fw-bold">{review.overallScore}</span></p>
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedReview(review)}>Lihat Detail</Button>
                        </ListGroup.Item>
                    ))}
                    {myReviews.length === 0 && <p className="text-center text-muted p-3">Belum ada riwayat penilaian kinerja.</p>}
                </ListGroup>
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
    const { db } = useData();
    
    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const handleDownload = () => {
        const doc = new jsPDF();
        doc.setProperties({ title: `Slip Gaji - ${payslip.period}` });
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("PT. MAJU BERSAMA", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("SLIP GAJI KARYAWAN", 105, 30, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Periode: ${payslip.period}`, 105, 40, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Informasi Karyawan:", 20, 55);
        doc.setFont("helvetica", "normal");
        doc.text(`Nama: ${payslip.employeeName}`, 20, 65);
        doc.text(`NIP: ${employee?.nip || '-'}`, 20, 72);
        doc.text(`Jabatan: ${employee?.position || '-'}`, 20, 79);
        doc.text(`Departemen: ${employee?.department || '-'}`, 20, 86);
        let yPos = 100;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 100, 0);
        doc.text("PENDAPATAN", 20, yPos);
        doc.setTextColor(0, 0, 0);
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
        yPos += 5;
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL PENDAPATAN", 20, yPos);
        doc.text(formatCurrency(payslip.totalIncome), 180, yPos, { align: "right" });
        yPos += 15;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 0, 0);
        doc.text("POTONGAN", 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        payslip.deductions.forEach(deduction => {
            doc.text(deduction.name, 25, yPos);
            doc.text(formatCurrency(deduction.amount), 180, yPos, { align: "right" });
            yPos += 7;
        });
        yPos += 5;
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL POTONGAN", 20, yPos);
        doc.text(formatCurrency(payslip.totalDeductions), 180, yPos, { align: "right" });
        yPos += 15;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPos - 8, 170, 15, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("GAJI BERSIH (Take Home Pay)", 25, yPos);
        doc.text(formatCurrency(payslip.netSalary), 180, yPos, { align: "right" });
        doc.save(`slip_gaji_${payslip.period.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <Modal show={true} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{`Slip Gaji - ${payslip.period}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-4">
                    <h3 className="h5 fw-bold">PT. MAJU BERSAMA</h3>
                    <p>SLIP GAJI KARYAWAN</p>
                    <p className="small text-muted">Periode: {payslip.period}</p>
                </div>

                <Row className="mb-4 small">
                    <Col>
                        <p><strong>Nama:</strong> {payslip.employeeName}</p>
                        <p><strong>NIP:</strong> {employee?.nip}</p>
                    </Col>
                    <Col>
                        <p><strong>Jabatan:</strong> {employee?.position}</p>
                        <p><strong>Departemen:</strong> {employee?.department}</p>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header as="h4" className="h6 text-success">PENDAPATAN</Card.Header>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between"><span>Gaji Pokok</span><span className="fw-semibold">{formatCurrency(payslip.baseSalary)}</span></ListGroup.Item>
                                {payslip.incomes.map(item => (
                                    <ListGroup.Item key={item.id} className="d-flex justify-content-between"><span>{item.name}</span><span className="fw-semibold">{formatCurrency(item.amount)}</span></ListGroup.Item>
                                ))}
                            </ListGroup>
                            <Card.Footer className="d-flex justify-content-between fw-bold">
                                <span>TOTAL PENDAPATAN</span>
                                <span>{formatCurrency(payslip.totalIncome)}</span>
                            </Card.Footer>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header as="h4" className="h6 text-danger">POTONGAN</Card.Header>
                            <ListGroup variant="flush">
                                {payslip.deductions.map(item => (
                                    <ListGroup.Item key={item.id} className="d-flex justify-content-between"><span>{item.name}</span><span className="fw-semibold">{formatCurrency(item.amount)}</span></ListGroup.Item>
                                ))}
                            </ListGroup>
                            <Card.Footer className="d-flex justify-content-between fw-bold">
                                <span>TOTAL POTONGAN</span>
                                <span>{formatCurrency(payslip.totalDeductions)}</span>
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>

                <Alert variant="primary" className="text-center fw-bold h5 p-3 mt-4">
                    <div className="d-flex justify-content-between">
                        <span>GAJI BERSIH (Take Home Pay)</span>
                        <span>{formatCurrency(payslip.netSalary)}</span>
                    </div>
                </Alert>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Tutup</Button>
                <Button variant="primary" onClick={handleDownload}>Unduh PDF</Button>
            </Modal.Footer>
        </Modal>
    );
};


const MyPayslips: React.FC<{ onMount: () => void }> = ({ onMount }) => {
    useEffect(() => {
        onMount();
    }, [onMount]);

    const { user } = useContext(AuthContext);
    const { db } = useData();
    
    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const myPayslips = useMemo(() => {
        const employeeId = user?.employeeDetails?.id || user?.employeeId;
        if (!db || !user || !employeeId) return [];
        return db.payrolls.filter(p => p.employeeId === employeeId);
    }, [db, user]);

    const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

    return (
        <div>
            <PageTitle title="Slip Gaji Saya" />
            <Card>
                <ListGroup variant="flush">
                    {myPayslips.map(p => (
                        <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                            <div>
                                <p className="fw-semibold mb-1">{p.period} Slip Gaji</p>
                                <p className="text-muted mb-0">Gaji Bersih: {formatCurrency(p.netSalary)}</p>
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedPayslip(p)}>Lihat Rincian</Button>
                        </ListGroup.Item>
                    ))}
                     {myPayslips.length === 0 && <p className="text-center text-muted p-3">Belum ada data slip gaji.</p>}
                </ListGroup>
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

    const employee = useMemo(() => {
        if (user?.employeeDetails) return user.employeeDetails;
        if (!user || !user.employeeId || !db) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const VIEWED_PAYSLIPS_KEY = useMemo(() => `hrms_viewed_payslips_${user?.id}`, [user?.id]);

    useEffect(() => {
        const employeeId = user?.employeeDetails?.id || user?.employeeId;
        if (!employeeId || !VIEWED_PAYSLIPS_KEY || !db) return;
        
        const getFromStorage = <T,>(key: string, defaultValue: T): T => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn(`Error reading from localStorage key “${key}”:`, error);
                return defaultValue;
            }
        };

        const myPayslips = db.payrolls.filter(p => p.employeeId === employeeId);
        const viewedPayslips = getFromStorage<string[]>(VIEWED_PAYSLIPS_KEY, []);
        const unreadPayslips = myPayslips
            .filter(p => !viewedPayslips.includes(p.id))
            .sort((a, b) => b.id.localeCompare(a.id));

        setNewPayslips(unreadPayslips);
    }, [db, user, VIEWED_PAYSLIPS_KEY]);

    const markPayslipsAsViewed = useCallback(() => {
        const employeeId = user?.employeeDetails?.id || user?.employeeId;
        if (!employeeId || newPayslips.length === 0 || !db) return;

        const myCurrentPayslipIds = db.payrolls
            .filter(p => p.employeeId === employeeId)
            .map(p => p.id);
        
        localStorage.setItem(VIEWED_PAYSLIPS_KEY, JSON.stringify(myCurrentPayslipIds));
        setNewPayslips([]);
    }, [db, user, VIEWED_PAYSLIPS_KEY, newPayslips.length]);

    const navLinksWithBadge = useMemo(() => {
        return EMPLOYEE_NAV_LINKS.map(link => {
            if (link.view === 'my-payslips' && newPayslips.length > 0) {
                return { ...link, badge: newPayslips.length };
            }
            return link;
        });
    }, [newPayslips.length]);
    
    if (!db) return null;

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