import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, LayoutDashboard, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const [darkMode, setDarkMode] = useState(() => {
        return (
            localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
        )
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => setDarkMode(!darkMode);

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to home/login after logout
    };

    const { pathname } = useLocation();

    const baseStyle = "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95";
    const activeStyle = `${baseStyle} bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`;
    const inactiveStyle = `${baseStyle} bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:pl-5`;

    return (
        <aside
            className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 z-50
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
        >
            {/* Logo */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <Link to="/dashboard" className="flex flex-col gap-1 group">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 group-hover:scale-105 transition-transform duration-200">
                        Timily
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium group-hover:text-blue-500 transition-colors">
                        @{user?.username || "guest"}
                    </span>
                </Link>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4 space-y-2">
                <Link
                    to="/dashboard"
                    className={pathname === '/dashboard' ? activeStyle : inactiveStyle}
                    onClick={() => window.innerWidth < 768 && onClose()}
                >
                    <LayoutDashboard size={20} className={pathname === '/dashboard' ? 'animate-pulse' : ''} />
                    <span>Dashboard</span>
                </Link>
                <Link
                    to="/task-manager"
                    className={pathname === '/task-manager' ? activeStyle : inactiveStyle}
                    onClick={() => window.innerWidth < 768 && onClose()}
                >
                    <LayoutDashboard size={20} className={pathname === '/task-manager' ? 'animate-pulse' : ''} />
                    <span>Task Manager</span>
                </Link>
                <Link
                    to="/my-profile"
                    className={pathname === '/my-profile' ? activeStyle : inactiveStyle}
                    onClick={() => window.innerWidth < 768 && onClose()}
                >
                    <User size={20} className={pathname === '/my-profile' ? 'animate-pulse' : ''} />
                    <span>Profile</span>
                </Link>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
                <button
                    onClick={toggleTheme}
                    className={`w-full ${inactiveStyle}`}
                >
                    {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-500" />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-all duration-200 active:scale-95 font-medium hover:pl-5"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
