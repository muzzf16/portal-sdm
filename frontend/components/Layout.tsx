import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AuthContext } from '../App';
import { useData } from '../context/DataContext';
import { Nav, Navbar, Container, Dropdown, Badge } from 'react-bootstrap';
import api from '../services/api';

interface Notification {
    id: string;
    message: string;
    type: string;
    createdAt: string;
    isRead: number;
}

interface NavLinkData {
    name: string;
    icon: React.ReactNode;
    view: string;
    badge?: number;
}

interface LayoutProps {
    navLinks: NavLinkData[];
    activeView: string;
    setActiveView: (view: string) => void;
    children: React.ReactNode;
}

const Sidebar: React.FC<{ navLinks: NavLinkData[], activeView: string, setActiveView: (view: string) => void, isSidebarOpen: boolean }> = ({ navLinks, activeView, setActiveView, isSidebarOpen }) => {
    const [logoExists, setLogoExists] = useState(true);

    const handleLogoError = () => {
        setLogoExists(false);
    };

    return (
        <Nav as="aside" className={`sidebar vh-100 d-flex flex-column bg-primary text-white p-2 ${isSidebarOpen ? '' : 'collapsed'}`}>
            <Navbar.Brand href="#" className="d-flex align-items-center justify-content-center my-3 text-white text-decoration-none" style={{ height: '50px' }}>
                {logoExists ? (
                    <img 
                        src={`/uploads/company-logo.png?t=${new Date().getTime()}`}
                        alt="Company Logo" 
                        style={{ height: '40px', maxHeight: '40px', width: 'auto' }} 
                        onError={handleLogoError}
                    />
                ) : (
                    <>
                        <i className="bi bi-buildings-fill fs-4"></i>
                        {isSidebarOpen && <span className="ms-2 fs-5 fw-bold link-text">HRMS</span>}
                    </>
                )}
            </Navbar.Brand>
            <hr className="text-secondary"/>
            <Nav variant="pills" className="flex-column" as="nav">
                {navLinks.map((link) => (
                    <Nav.Item key={link.name}>
                        <Nav.Link
                            href="#"
                            active={activeView === link.view}
                            onClick={(e) => { e.preventDefault(); setActiveView(link.view); }}
                            className="d-flex align-items-center text-white"
                        >
                            <span className="position-relative">
                                {link.icon}
                                {link.badge && link.badge > 0 && !isSidebarOpen && (
                                    <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle p-1 border border-light rounded-circle icon-badge"></Badge>
                                )}
                            </span>
                            <span className="ms-3 link-text">{link.name}</span>
                            {link.badge && link.badge > 0 && isSidebarOpen && (
                                <Badge pill bg="danger" className="badge">
                                    {link.badge}
                                </Badge>
                            )}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>
        </Nav>
    );
};

const Header: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
    const { user, logout } = useContext(AuthContext);
    const { db } = useData();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const fetchNotifications = async () => {
        try {
            const notifs = await api.getNotifications();
            setNotifications(notifs || []);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (user?.role === 'EMPLOYEE') {
            fetchNotifications();
            // Optional: Poll for new notifications periodically
            const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // every 5 minutes
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const employee = useMemo(() => {
        if (!user || !user.employeeId || !db || !db.employees) return null;
        return db.employees.find(e => e.id === user.employeeId) || null;
    }, [user, db]);

    const avatarUrl = employee?.avatarUrl || 'https://picsum.photos/200';

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm">
            <Container fluid>
                <Navbar.Brand>
                    <button onClick={toggleSidebar} className="btn btn-outline-secondary">
                        <i className="bi bi-list"></i>
                    </button>
                </Navbar.Brand>
                <Nav className="ms-auto d-flex flex-row align-items-center">
                    {user?.role === 'EMPLOYEE' && (
                        <Dropdown as="div" show={showNotifications} onToggle={() => setShowNotifications(!showNotifications)} autoClose="outside">
                            <Dropdown.Toggle as="a" href="#" className="nav-link me-3 position-relative">
                                <i className="bi bi-bell-fill fs-5"></i>
                                {unreadCount > 0 && (
                                    <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle p-1 border border-light rounded-circle"></Badge>
                                )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" style={{ width: '350px' }}>
                                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                                    <h6 className="mb-0">Notifikasi</h6>
                                    {unreadCount > 0 && <Badge pill bg="primary">{unreadCount} Baru</Badge>}
                                </div>
                                <Dropdown.Divider />
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? notifications.map(notif => (
                                        <Dropdown.Item 
                                            key={notif.id} 
                                            className={`p-3 ${!notif.isRead ? 'bg-light' : ''}`}
                                            onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                        >
                                            <p className="mb-1 small">{notif.message}</p>
                                            <small className="text-muted">{new Date(notif.createdAt).toLocaleString()}</small>
                                        </Dropdown.Item>
                                    )) : (
                                        <div className="text-center p-3 text-muted">
                                            Tidak ada notifikasi.
                                        </div>
                                    )}
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>
                    )}

                    <Dropdown align="end">
                        <Dropdown.Toggle variant="light" id="dropdown-user">
                            <img src={avatarUrl} alt="User Avatar" className="rounded-circle me-2" style={{ width: '32px', height: '32px' }} />
                            {user?.name}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item disabled>Role: {user?.role}</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={logout}>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Keluar
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Nav>
            </Container>
        </Navbar>
    );
};

export const Layout: React.FC<LayoutProps> = ({ navLinks, activeView, setActiveView, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="d-flex vh-100 bg-light">
            <Sidebar navLinks={navLinks} activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} />
            <div className="flex-fill d-flex flex-column overflow-auto">
                <Header toggleSidebar={toggleSidebar} />
                <main className="flex-fill p-4">
                    <Container fluid>
                        {children}
                    </Container>
                </main>
            </div>
        </div>
    );
};