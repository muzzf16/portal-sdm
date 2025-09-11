import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';

export const LoginPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const userToLogin = await api.login({ name, password });
            if (userToLogin) {
                login(userToLogin);
                addToast(`Selamat datang, ${userToLogin.name}!`, 'success');
                navigate('/'); // Redirect to dashboard after login
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login gagal. Periksa kembali nama karyawan dan kata sandi Anda.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
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
                        <p className="text-muted">Masuk untuk mengakses dasbor Anda.</p>
                    </div>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h2 className="h4 fw-semibold text-center mb-4">Masuk ke Akun Anda</h2>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="name">
                                    <Form.Label>Nama Karyawan</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="Nama Karyawan"
                                        autoComplete="username"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="password">
                                    <Form.Label>Kata Sandi</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                </Form.Group>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Memproses...' : 'Masuk'}
                                </Button>
                            </Form>
                            <div className="text-center mt-3">
                                <Link to="/forgot-password">Lupa kata sandi?</Link>
                            </div>
                        </Card.Body>
                    </Card>
                    <div className="text-center mt-3">
                        <Link to="/" className="text-muted small">
                            &larr; Kembali ke Halaman Utama
                        </Link>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};