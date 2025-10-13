import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Form, Button, Card, Container, Row, Col } from 'react-bootstrap';

export const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast('Passwords do not match', 'error');
            return;
        }
        setIsLoading(true);

        try {
            if (token) {
                await api.resetPassword(password, token);
                addToast('Password has been reset successfully.', 'success');
                navigate('/login');
            }
        } catch (error) {
             addToast(error instanceof Error ? error.message : 'Failed to reset password.', 'error');
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
                            <h2 className="h4 fw-semibold text-center mb-3">Reset Password</h2>
                            <p className="text-center text-muted mb-4">Enter your new password.</p>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="password">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter new password"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="confirmPassword">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Confirm new password"
                                    />
                                </Form.Group>
                                
                                <Button type="submit" variant="primary" className="w-100" disabled={isLoading}>
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <div className="text-center mt-3">
                        <Link to="/login" className="text-muted small">
                            &larr; Back to Login
                        </Link>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};
