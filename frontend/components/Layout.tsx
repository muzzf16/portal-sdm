import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Nav, Navbar, Container, Dropdown, Badge } from 'react-bootstrap';

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

const Sidebar: React.FC<{ navLinks: NavLinkData[], activeView: string, setActiveView: (view: string) => void, isSidebarOpen: boolean }> = ({ navLinks, activeView, setActiveView, isSidebarOpen }) => (
    <Nav as="aside" className={`sidebar vh-100 d-flex flex-column bg-dark text-white p-2 ${isSidebarOpen ? '' : 'collapsed'}`}>
        <Navbar.Brand href="#" className="d-flex align-items-center justify-content-center my-3 text-white text-decoration-none">
            <i className="bi bi-buildings-fill fs-4"></i>
            <span className="ms-2 fs-5 fw-bold link-text">HRMS</span>
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

const Header: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
    const { user, logout } = useContext(AuthContext);

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm">
            <Container fluid>
                <Navbar.Brand>
                    <button onClick={toggleSidebar} className="btn btn-outline-secondary">
                        <i className="bi bi-list"></i>
                    </button>
                </Navbar.Brand>
                <Nav className="ms-auto">
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="light" id="dropdown-user">
                            <img src={user?.employeeDetails?.avatarUrl} alt="User Avatar" className="rounded-circle me-2" style={{ width: '32px', height: '32px' }} />
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