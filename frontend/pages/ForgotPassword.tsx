import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Form, Button, Card, Container, Row, Col } from 'react-bootstrap';

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
        <Container fluid className="vh-100 bg-light d-flex flex-column justify-content-center align-items-center">
            <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
                    <div className="text-center mb-4">
                        <Link to="/" className="d-flex align-items-center justify-content-center text-decoration-none h1 text-primary">
                            <i className="bi bi-buildings-fill me-2"></i>
                            <span className="fw-bold">Portal SDM</span>
                        </Link>
                    </div>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h2 className="h4 fw-semibold text-center mb-3">Lupa Kata Sandi</h2>
                            <p className="text-center text-muted mb-4">Masukkan email Anda untuk menerima tautan reset.</p>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="email">
                                    <Form.Label>Alamat Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="anda@perusahaan.com"
                                    />
                                </Form.Group>
                                
                                <Button type="submit" variant="primary" className="w-100" disabled={isLoading}>
                                    {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <div className="text-center mt-3">
                        <Link to="/login" className="text-muted small">
                            &larr; Kembali ke Halaman Login
                        </Link>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};