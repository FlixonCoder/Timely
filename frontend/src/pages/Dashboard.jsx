import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Menu, ArrowRight, CheckCircle2, Circle, Clock, Calendar, Sparkles } from 'lucide-react';
import quotes from '../assets/quotes';
import HabitTracker from '../components/HabitTracker';

const Dashboard = ({ onMenuClick }) => {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState("Hello");
    const [quote, setQuote] = useState("");
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set Greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

        // Set Random Quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote?.text || "Stay focused!");

        // Fetch Tasks
        const fetchTasks = async () => {
            try {
                const { data } = await api.get("/api/tasks/get-tasks");
                const list = Array.isArray(data) ? data : data?.tasks || [];

                // Filter pending/on-going tasks (exclude completed and cancelled)
                const pending = list.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

                // Simple sort: High priority first, then by deadline
                pending.sort((a, b) => {
                    const priorityMap = { high: 3, medium: 2, low: 1 };
                    const diff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
                    if (diff !== 0) return diff;
                    return new Date(a.deadline) - new Date(b.deadline);
                });

                setTasks(pending.slice(0, 5)); // Top 5
            } catch (e) {
                console.error("Failed to fetch tasks", e);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const formatDate = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 font-sans transition-colors duration-300">

            {/* Top Bar */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-lg font-bold">Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-500">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-8">

                {/* Welcome Section */}
                <section>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                        {greeting}, {user?.username || "User"}!
                    </h2>
                    <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
                        <p className="text-lg md:text-xl font-medium italic opacity-90">
                            "{quote}"
                        </p>
                    </div>
                </section>

                {/* Stats & Tasks Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Top Pending Tasks</h3>
                        <Link to="/task-manager" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 hover:underline">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading tasks...</div>
                        ) : tasks.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {tasks.map(task => (
                                    <div key={task._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${task.priority === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                            task.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {task.priority === 'high' ? <Clock size={18} /> :
                                                task.priority === 'medium' ? <Circle size={18} /> :
                                                    <CheckCircle2 size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{task.title}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.description || "No description"}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                                            {task.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{formatDate(task.deadline)}</span>
                                                </div>
                                            )}
                                            <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                {task.category || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <span className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-500 dark:text-indigo-400 mb-3">
                                    <Sparkles size={24} />
                                </span>
                                <p className="text-lg font-medium text-gray-800 dark:text-white">You're all caught up!</p>
                                <p className="text-sm mt-1">No pending tasks for now.</p>
                                <Link to="/task-manager" className="text-indigo-600 hover:underline text-sm mt-3 inline-block font-medium">
                                    Create a new task
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Habit Tracker Section */}
                <section>
                    <HabitTracker />
                </section>

            </main>
        </div>
    );
};

export default Dashboard;
