
import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { ICONS } from '../constants';

interface NavLink {
    name: string;
    icon: React.ReactNode;
    view: string;
    badge?: number;
}

interface LayoutProps {
    navLinks: NavLink[];
    activeView: string;
    setActiveView: (view: string) => void;
    children: React.ReactNode;
}

const Sidebar: React.FC<{ navLinks: NavLink[], activeView: string, setActiveView: (view: string) => void, isSidebarOpen: boolean }> = ({ navLinks, activeView, setActiveView, isSidebarOpen }) => (
    <aside className={`bg-primary-800 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-center h-20 border-b border-primary-700">
            <h1 className={`text-2xl font-bold ${!isSidebarOpen && 'hidden'}`}>HRMS</h1>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isSidebarOpen && 'hidden'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" /></svg>
        </div>
        <nav className="mt-4">
            {navLinks.map((link) => (
                <a
                    key={link.name}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActiveView(link.view); }}
                    className={`flex items-center py-3 transition-colors duration-200 ${isSidebarOpen ? 'px-6' : 'justify-center'} ${activeView === link.view ? 'bg-primary-900 text-white' : 'text-primary-200 hover:bg-primary-700'}`}
                >
                    <div className="relative">
                        {link.icon}
                        {link.badge && link.badge > 0 && !isSidebarOpen && (
                            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3 border-2 border-primary-800 animate-pulse"></span>
                        )}
                    </div>
                    <span className={`ml-4 font-medium flex-1 ${!isSidebarOpen && 'hidden'}`}>{link.name}</span>
                    {link.badge && link.badge > 0 && isSidebarOpen && (
                        <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                            {link.badge}
                        </span>
                    )}
                </a>
            ))}
        </nav>
    </aside>
);

const Header: React.FC<{ toggleSidebar: () => void, isSidebarOpen: boolean }> = ({ toggleSidebar }) => {
    const { user, logout } = useContext(AuthContext);

    return (
        <header className="bg-white shadow-sm flex items-center justify-between p-4">
            <button onClick={toggleSidebar} className="text-gray-600 hover:text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <div className="flex items-center">
                <span className="text-gray-700 mr-4">Selamat datang, {user?.name}</span>
                <img src={user?.employeeDetails?.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover mr-4" />
                <button onClick={logout} className="flex items-center text-gray-600 hover:text-primary-600" title="Keluar">
                    {ICONS.logout}
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<LayoutProps> = ({ navLinks, activeView, setActiveView, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-gray-100 print:hidden">
            <Sidebar navLinks={navLinks} activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};