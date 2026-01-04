import React, { useState, useEffect } from "react";
import { Plus, Check, Trash2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { calculateStreak } from "../utils/calculateStreak";

const HabitTracker = () => {
    /* -------------------- Helpers -------------------- */

    const getWeekDates = () => {
        const dates = [];
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sun
        const diff = currentDay === 0 ? -6 : 1 - currentDay;

        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const formatDateKey = (date) => date.toISOString().split("T")[0];

    const formatHeaderDate = (date) => ({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        dateNum: date.getDate(),
    });

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    /* -------------------- State -------------------- */

    const [weekDates, setWeekDates] = useState(getWeekDates());
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState("");
    const [loading, setLoading] = useState(true);

    /* -------------------- Effects -------------------- */

    useEffect(() => {
        setWeekDates(getWeekDates());
    }, []);

    useEffect(() => {
        fetchHabits();
    }, []);

    /* -------------------- API -------------------- */

    const fetchHabits = async () => {
        try {
            const res = await api.get("/api/habits");
            if (res.data.success) setHabits(res.data.habits);
        } catch (err) {
            console.error("Failed to fetch habits", err);
        } finally {
            setLoading(false);
        }
    };

    const addHabit = async (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;

        try {
            const res = await api.post("/api/habits/create", { name: newHabit });
            if (res.data.success) {
                setHabits((prev) => [...prev, res.data.habit]);
                setNewHabit("");
            }
        } catch (err) {
            console.error("Failed to add habit", err);
        }
    };

    const toggleDay = async (habitId, date) => {
        const dateKey = formatDateKey(date);
        const prevHabits = [...habits];

        setHabits((prev) =>
            prev.map((h) => {
                if (h._id !== habitId) return h;
                const completed = { ...h.completed };
                completed[dateKey]
                    ? delete completed[dateKey]
                    : (completed[dateKey] = true);
                return { ...h, completed };
            })
        );

        try {
            await api.post(`/api/habits/${habitId}/toggle`, { date: dateKey });
        } catch (err) {
            console.error("Toggle failed", err);
            setHabits(prevHabits);
        }
    };

    const deleteHabit = async (habitId) => {
        // if (!confirm("Delete this habit permanently?")) return; // Removed confirmation
        try {
            const res = await api.delete(`/api/habits/${habitId}`);
            if (res.data.success) {
                setHabits((prev) => prev.filter((h) => h._id !== habitId));
            }
        } catch (err) {
            console.error("Failed to delete habit", err);
        }
    };

    /* -------------------- Render -------------------- */

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading habits…</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                <h3 className="text-xl font-bold">Habit Tracker</h3>
            </div>

            {/* Table */}
            <div className="p-6 overflow-x-auto">
                <table className="w-full border-collapse table-fixed min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="pb-4 text-left text-sm text-gray-500 w-1/3 min-w-[150px] pl-4">Habit</th>
                            {weekDates.map((date) => {
                                const { day, dateNum } = formatHeaderDate(date);
                                const today = isToday(date);
                                return (
                                    <th key={date.toISOString()} className="pb-4 text-center w-14">
                                        <div
                                            className={`mx-auto rounded-lg py-1 w-12 flex flex-col items-center justify-center transition-colors ${today
                                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            <div className="text-[10px] font-bold uppercase tracking-wider">
                                                {today ? "Today" : day}
                                            </div>
                                            <div className="text-sm font-bold">{dateNum}</div>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="pb-4 text-center text-sm text-gray-500 w-20">Streak</th>
                            <th className="w-10" />
                        </tr>
                    </thead>

                    <tbody>
                        {habits.length === 0 && (
                            <tr>
                                <td colSpan={10} className="py-8 text-center text-gray-400 italic">
                                    No habits yet. Add one below.
                                </td>
                            </tr>
                        )}

                        {habits.map((habit) => (
                            <tr
                                key={habit._id}
                                className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-none"
                            >
                                <td className="py-3 pl-4 font-medium text-gray-800 dark:text-white truncate">
                                    {habit.name}
                                </td>

                                {weekDates.map((date) => {
                                    const key = formatDateKey(date);
                                    const completed = habit.completed?.[key];
                                    const today = isToday(date);

                                    return (
                                        <td key={key} className="py-3 text-center vertical-align-middle">
                                            <div className={`relative flex items-center justify-center h-full w-full ${today ? "bg-blue-50/30 dark:bg-blue-900/5 -my-3 py-3" : ""}`}>
                                                <button
                                                    disabled={!today}
                                                    onClick={() => today && toggleDay(habit._id, date)}
                                                    className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center
                                                        transition-all duration-200 relative z-10
                                                        ${completed
                                                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/20"
                                                            : "bg-gray-100 dark:bg-gray-700/50 text-transparent"
                                                        }
                                                        ${today
                                                            ? "hover:ring-2 hover:ring-blue-400 hover:scale-105"
                                                            : "opacity-40 cursor-not-allowed grayscale"
                                                        }
                                                    `}
                                                >
                                                    <Check size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </td>
                                    );
                                })}

                                <td className="py-3 text-center">
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            key={calculateStreak(habit.completed)}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="inline-flex"
                                        >
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50">
                                                {calculateStreak(habit.completed)}
                                            </span>
                                        </motion.div>
                                    </AnimatePresence>
                                </td>

                                <td className="py-3 text-center">
                                    <button
                                        onClick={() => deleteHabit(habit._id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Habit */}
            <form onSubmit={addHabit} className="p-6 pt-0 flex gap-2">
                <input
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                    placeholder="Add a new habit..."
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                />
                <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2">
                    <Plus size={18} /> <span className="hidden sm:inline">Add Habit</span>
                </button>
            </form>
        </div>
    );
};
export default HabitTracker;
