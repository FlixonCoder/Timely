import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ShieldCheck,
    Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        toast.info("Logged out successfully");
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Users, label: "Users", path: "/users" },
        { icon: Activity, label: "Analytics", path: "/analytics" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    return (
        <div className="h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">

            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
                <ShieldCheck className="text-indigo-600 mr-3" size={28} />
                <span className="text-xl font-bold text-gray-800 dark:text-white">
                    Timely Admin
                </span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center px-4 py-3 rounded-lg transition-colors font-medium
                            ${isActive
                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                            }
                        `}
                    >
                        <item.icon size={20} className="mr-3" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-medium"
                >
                    <LogOut size={20} className="mr-3" />
                    Logout
                </button>
            </div>

        </div>
    );
};

export default Sidebar;
