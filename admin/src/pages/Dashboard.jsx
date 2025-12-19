import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Users, CheckSquare, Activity, UserPlus } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import UserTable from '../components/UserTable';
import axios from 'axios';
import { backendUrl } from '../config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {

    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalTasks: 0
    });
    const [latestUsers, setLatestUsers] = useState([]); // Or all users if we use getAllUsers
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                toast.error("Session expired. Please login.");
                navigate('/');
                return;
            }

            const config = { headers: { token } };

            // Fetch Stats
            const statsRes = await axios.get(`${backendUrl}/api/admin/stats`, config);
            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
            } else {
                toast.error(statsRes.data.message);
            }

            // Fetch Users
            const usersRes = await axios.get(`${backendUrl}/api/admin/users`, config);
            if (usersRes.data.success) {
                setAllUsers(usersRes.data.users);
            }

        } catch (error) {
            console.error(error);
            if (error.response?.status === 401 || error.response?.data?.message === "Not Authorized Login Again") {
                localStorage.removeItem('adminToken');
                navigate('/');
            }
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            {/* Sidebar */}
            <aside className="hidden md:block flex-none z-20">
                <Sidebar />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{currentDate}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {/* Actions or filters could go here */}
                            <button onClick={fetchDashboardData} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                                Refresh Data
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatsCard
                            title="Total Users"
                            value={stats.totalUsers}
                            icon={Users}
                            color="blue"
                        />
                        <StatsCard
                            title="Active Users (7d)"
                            value={stats.activeUsers}
                            icon={Activity}
                            color="green"
                        />
                        <StatsCard
                            title="Total System Tasks"
                            value={stats.totalTasks}
                            icon={CheckSquare}
                            color="purple"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="space-y-6">
                        <UserTable users={allUsers} />
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;