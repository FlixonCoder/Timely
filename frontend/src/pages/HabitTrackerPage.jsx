import React, { useEffect, useState } from 'react';
import HabitTracker from '../components/HabitTracker';
import { Menu, Flame, CalendarCheck, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const todayKey = new Date().toISOString().slice(0, 10);

const HabitTrackerPage = ({ onMenuClick }) => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/api/habits/stats');
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch habit stats", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 transition-colors duration-300">
            {/* Top Bar */}
            <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onMenuClick}
                            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold leading-tight">
                                Habit Tracker
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Track daily consistency, build discipline
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
                {/* Intro */}
                <section className="space-y-2">
                    <h2 className="text-xl font-semibold">
                        Your habits, one day at a time
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                        Mark habits as completed each day and visualize your
                        consistency over time. Small wins compound into long-term discipline.
                    </p>
                </section>

                {/* Quick Stats */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Current streak
                            </p>
                            <p className="text-lg font-semibold">
                                — days
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                            <CalendarCheck size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Active Habits
                            </p>
                            <p className="text-lg font-semibold">
                                {loadingStats ? "..." : (stats?.totalActive || 0)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Habit Tracker */}
                <section className="space-y-4">
                    <HabitTracker />
                </section>

                {/* Analytics Charts */}
                {stats && stats.weeklyTrend && (
                    <section className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-indigo-600" size={24} />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                Weekly Performance
                            </h2>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">
                                Habits Completed (Last 7 Days)
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                            {stats.weeklyTrend.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#4f46e5" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default HabitTrackerPage;
