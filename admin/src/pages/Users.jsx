import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { backendUrl } from '../config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { User, CheckCircle, Clock, Trash2, XCircle, AlertCircle } from 'lucide-react';

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                toast.error("Session expired. Please login.");
                navigate('/');
                return;
            }

            const config = { headers: { token } };
            const response = await axios.get(`${backendUrl}/api/admin/users`, config);

            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                localStorage.removeItem('adminToken');
                navigate('/');
            }
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Never";
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            <aside className="hidden md:block flex-none z-20">
                <Sidebar />
            </aside>

            <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-end">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total: {users.length} Users</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-medium tracking-wider">
                                        <th className="px-6 py-4">User Profile</th>
                                        <th className="px-6 py-4 text-center">Completed</th>
                                        <th className="px-6 py-4 text-center">Pending</th>
                                        <th className="px-6 py-4 text-center">Cancelled</th>
                                        <th className="px-6 py-4 text-center">Deleted</th>
                                        <th className="px-6 py-4 text-right">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        {user.image ? (
                                                            <img className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" src={user.image} alt="" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                                <User size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle size={12} className="mr-1" />
                                                    {user.taskStats?.completed || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    <AlertCircle size={12} className="mr-1" />
                                                    {user.taskStats?.pending || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                                                    <XCircle size={12} className="mr-1" />
                                                    {user.taskStats?.cancelled || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    <Trash2 size={12} className="mr-1" />
                                                    {user.taskStats?.deleted || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center justify-end">
                                                    <Clock size={14} className="mr-1.5" />
                                                    {formatDate(user.userData?.lastActive)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && !loading && (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    No users found in the system.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Users;
