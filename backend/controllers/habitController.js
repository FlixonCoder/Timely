import { Habit, HabitEntry } from "../models/habitModel.js";
import User from "../models/userModel.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

/* --------------------------------------------------
   Helper: userId (EXPECTED from auth middleware)
-------------------------------------------------- */
const getUserIdFromReq = (req) => req.userId;

/* --------------------------------------------------
   GET HABITS + ENTRIES
-------------------------------------------------- */
const getHabits = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Fetch active habits
        const habits = await Habit.find({ userId, active: true }).lean();

        if (habits.length === 0) {
            return res.status(200).json({ success: true, habits: [] });
        }

        const habitIds = habits.map(h => h._id);

        // Fetch all entries for user's habits
        const entries = await HabitEntry.find({
            userId,
            habitId: { $in: habitIds }
        }).lean();

        // Group entries by habitId
        const entryMap = new Map();
        for (const entry of entries) {
            const key = String(entry.habitId);
            if (!entryMap.has(key)) entryMap.set(key, {});
            entryMap.get(key)[entry.date] = entry.completed;
        }

        // Attach completed map to habits
        const habitsWithEntries = habits.map(habit => ({
            ...habit,
            completed: entryMap.get(String(habit._id)) || {}
        }));

        return res.status(200).json({
            success: true,
            habits: habitsWithEntries
        });

    } catch (error) {
        console.error("getHabits:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   CREATE HABIT
-------------------------------------------------- */
const createHabit = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const { name } = req.body;

        if (!userId || !name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const habit = await Habit.create({
            userId,
            name
        });

        // Keep reference in user (small, stable list)
        await User.findByIdAndUpdate(userId, {
            $push: { habits: habit._id }
        });

        return res.status(201).json({
            success: true,
            habit: {
                ...habit.toObject(),
                completed: {}
            }
        });

    } catch (error) {
        console.error("createHabit:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   TOGGLE HABIT (STRICT: TODAY ONLY)
-------------------------------------------------- */
const toggleHabitDate = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const habitId = req.params.id;
        const { date } = req.body;

        if (!userId || !habitId) {
            return res.status(400).json({
                success: false,
                message: "Missing parameters"
            });
        }

        const todayKey = dayjs().utc().format("YYYY-MM-DD");
        const targetDate = date || todayKey;

        // STRICT DISCIPLINE: TODAY ONLY
        if (targetDate !== todayKey) {
            return res.status(403).json({
                success: false,
                message: "You can only modify today's habit"
            });
        }

        // Ownership check
        const habit = await Habit.findOne({ _id: habitId, userId });
        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        // Toggle OFF
        const deleted = await HabitEntry.findOneAndDelete({
            habitId,
            userId,
            date: targetDate
        });

        if (deleted) {
            return res.status(200).json({
                success: true,
                active: false,
                date: targetDate
            });
        }

        // Toggle ON
        try {
            await HabitEntry.create({
                habitId,
                userId,
                date: targetDate,
                completed: true
            });

            return res.status(200).json({
                success: true,
                active: true,
                date: targetDate
            });

        } catch (err) {
            // Race condition (unique index)
            if (err.code === 11000) {
                return res.status(200).json({
                    success: true,
                    active: true,
                    date: targetDate
                });
            }
            throw err;
        }

    } catch (error) {
        console.error("toggleHabitDate:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   DELETE HABIT (SOFT DELETE)
-------------------------------------------------- */
const deleteHabit = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const habitId = req.params.id;

        if (!userId || !habitId) {
            return res.status(400).json({
                success: false,
                message: "Missing parameters"
            });
        }

        // Ownership check
        const habit = await Habit.findOne({ _id: habitId, userId });
        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        // Soft delete: Active = false
        habit.active = false;
        await habit.save();

        return res.status(200).json({
            success: true,
            message: "Habit deleted"
        });

    } catch (error) {
        console.error("deleteHabit:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   HABIT ANALYTICS (STATS)
-------------------------------------------------- */
const getHabitStats = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        // 1. Total Active Habits
        const activeHabitsCount = await Habit.countDocuments({ userId, active: true });

        // 2. Entries in the last 30 days
        const limitDate = dayjs().subtract(30, 'day').toDate();
        const entries = await HabitEntry.find({
            userId,
            createdAt: { $gte: limitDate }
        }).lean();

        // 3. Weekly Completion Trend (Last 7 Days)
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = dayjs().subtract(i, 'day');
            const dStr = d.format('YYYY-MM-DD');
            const dayName = d.format('ddd'); // Mon, Tue...

            // Count entries for this specific date string
            // Note: entry.date is stored as string "YYYY-MM-DD"
            const count = entries.filter(e => e.date === dStr && e.completed).length;

            labels.push(dayName);
            data.push({ day: dayName, count });
        }

        return res.status(200).json({
            success: true,
            stats: {
                totalActive: activeHabitsCount,
                weeklyTrend: data
            }
        });

    } catch (error) {
        console.error("getHabitStats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export {
    getHabits,
    createHabit,
    toggleHabitDate,
    deleteHabit,
    getHabitStats
};
