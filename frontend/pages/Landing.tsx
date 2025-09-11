import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Navbar, Nav, Row, Col } from 'react-bootstrap';
import { ICONS } from '../constants';

const FeatureCard: React.FC<{ icon: React.ReactElement; title: string; description: string }> = ({ icon, title, description }) => (
    <Card className="text-center p-4 h-100 shadow-sm">
        <div className="feature-icon bg-primary-subtle text-primary p-3 rounded-circle mb-3 d-inline-block">
            {icon}
        </div>
        <Card.Body>
            <Card.Title as="h3" className="h5 fw-semibold mb-2">{title}</Card.Title>
            <Card.Text className="text-muted">{description}</Card.Text>
        </Card.Body>
    </Card>
);

export const LandingPage: React.FC = () => {
    return (
        <div className="bg-white text-dark">
            <Navbar bg="white" expand="lg" className="shadow-sm fixed-top">
                <Container>
                    <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                        <i className="bi bi-buildings-fill text-primary fs-4 me-2"></i>
                        <span className="h4 fw-bold text-dark mb-0">Portal SDM</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link href="#features" className="me-3">Fitur</Nav.Link>
                            <Nav.Link href="#about" className="me-3">Tentang Kami</Nav.Link>
                            <Button as={Link as any} to="/login" variant="primary">Masuk</Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <main style={{ paddingTop: '70px' }}>
                <section className="py-5" style={{ backgroundColor: 'var(--bs-primary-bg-subtle)' }}>
                    <Container className="text-center py-5">
                        <h1 className="display-4 fw-bold text-primary mb-3">
                            Manajemen SDM Modern di Ujung Jari Anda
                        </h1>
                        <p className="lead text-muted mb-4">
                            Sederhanakan proses SDM, tingkatkan keterlibatan karyawan, dan fokus pada hal yang paling penting: mengembangkan tim Anda.
                        </p>
                        <Button as={Link as any} to="/login" variant="primary" size="lg">
                            Masuk ke Portal
                        </Button>
                    </Container>
                </section>

                <section id="features" className="py-5">
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="display-5 fw-bold">Fitur Unggulan Kami</h2>
                            <p className="text-muted">Semua yang Anda butuhkan dalam satu platform terintegrasi.</p>
                        </div>
                        <Row xs={1} md={2} lg={3} className="g-4">
                            <Col>
                                <FeatureCard 
                                    icon={ICONS.employees} 
                                    title="Manajemen Karyawan" 
                                    description="Kelola data karyawan secara terpusat, mulai dari informasi pribadi hingga riwayat pekerjaan."
                                />
                            </Col>
                            <Col>
                                <FeatureCard 
                                    icon={ICONS.leave} 
                                    title="Pengajuan Cuti Online" 
                                    description="Proses pengajuan dan persetujuan cuti yang mudah dan transparan, langsung dari aplikasi."
                                />
                            </Col>
                            <Col>
                                <FeatureCard 
                                    icon={ICONS.payroll} 
                                    title="Penggajian Otomatis" 
                                    description="Hitung gaji, tunjangan, dan potongan secara akurat dan efisien setiap periode."
                                />
                            </Col>
                            <Col>
                                <FeatureCard 
                                    icon={ICONS.performance} 
                                    title="Penilaian Kinerja" 
                                    description="Lacak KPI dan berikan umpan balik yang konstruktif untuk pengembangan karyawan."
                                />
                            </Col>
                            <Col>
                                <FeatureCard 
                                    icon={ICONS.attendance} 
                                    title="Absensi Digital" 
                                    description="Pantau kehadiran karyawan dengan sistem clock-in/clock-out yang mudah digunakan."
                                />
                            </Col>
                            <Col>
                                <FeatureCard 
                                    icon={ICONS.reports} 
                                    title="Laporan Komprehensif" 
                                    description="Hasilkan laporan SDM yang informatif untuk mendukung pengambilan keputusan strategis."
                                />
                            </Col>
                        </Row>
                    </Container>
                </section>
                
                <section id="about" className="py-5 bg-light">
                     <Container className="text-center">
                        <h2 className="display-5 fw-bold">Dibangun untuk Efisiensi</h2>
                         <p className="text-muted mt-3 lead">
                            Portal SDM kami dirancang untuk menghilangkan tugas administratif yang berulang, memungkinkan tim SDM Anda untuk menjadi mitra strategis bagi pertumbuhan bisnis. Dengan antarmuka yang intuitif dan alur kerja yang cerdas, kami memberdayakan baik admin maupun karyawan.
                         </p>
                    </Container>
                </section>
            </main>

            <footer className="bg-dark text-white py-4">
                <Container className="text-center">
                    <p className="mb-0">&copy; {new Date().getFullYear()} Portal SDM. Seluruh hak cipta.</p>
                </Container>
            </footer>
        </div>
    );
};