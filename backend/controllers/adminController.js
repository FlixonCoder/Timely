import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';
import userDataModel from '../models/userDataModel.js';

dotenv.config();

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

            const token = jwt.sign(
                { email: email, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(200).json({ success: true, token, message: "Welcome back, Admin" });

        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }

    } catch (error) {
        console.error("adminLogin error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments({});

        // Active users (active in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsers = await userDataModel.countDocuments({ lastActive: { $gte: sevenDaysAgo } });

        // Total Tasks (sum of all totalTasks in userData)
        const taskData = await userDataModel.aggregate([
            { $group: { _id: null, total: { $sum: "$totalTasks" } } }
        ]);
        const totalTasks = taskData.length > 0 ? taskData[0].total : 0;

        // Latest 5 users
        const latestUsers = await userModel.find({}).sort({ createdAt: -1 }).limit(5).select('-password');

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                totalTasks
            },
            latestUsers
        });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select('-password').sort({ createdAt: -1 });

        // Populate with UserData and calculate task stats
        const usersWithData = await Promise.all(users.map(async (user) => {
            const data = await userDataModel.findOne({ userId: user._id });

            // Calculate task stats
            const taskStats = {
                completed: user.tasks.filter(t => t.status === 'completed').length,
                pending: user.tasks.filter(t => t.status === 'pending').length,
                cancelled: user.tasks.filter(t => t.status === 'cancelled').length,
                deleted: user.tasks.filter(t => t.status === 'deleted').length
            };

            const userObj = user.toObject();
            delete userObj.tasks; // Remove raw tasks array

            return {
                ...userObj,
                userData: data || { totalTasks: 0, lastActive: null, taskCompletionStatus: {} },
                taskStats
            };
        }));

        res.json({ success: true, users: usersWithData });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

export { adminLogin, getDashboardStats, getAllUsers, getAnalyticsData };

const getAnalyticsData = async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // 1. New Users (Last 30 Days)
        const newUsers = await userModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Tasks Created (Last 30 Days) - Using _id timestamp
        const tasksCreated = await userModel.aggregate([
            { $unwind: "$tasks" },
            {
                $addFields: {
                    taskCreatedAt: { $convert: { input: "$tasks._id", to: "date" } }
                }
            },
            {
                $match: {
                    taskCreatedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$taskCreatedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Tasks Completed (Last 30 Days) - Using completedAt
        const tasksCompleted = await userModel.aggregate([
            { $unwind: "$tasks" },
            {
                $match: {
                    "tasks.status": "completed",
                    "tasks.completedAt": { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$tasks.completedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format data for frontend (merge dates)
        const dateMap = new Map();

        // Helper to fill map
        const fillMap = (data, key) => {
            data.forEach(item => {
                const date = item._id;
                if (!dateMap.has(date)) {
                    dateMap.set(date, { date, users: 0, tasksCreated: 0, tasksCompleted: 0 });
                }
                dateMap.get(date)[key] = item.count;
            });
        };

        fillMap(newUsers, 'users');
        fillMap(tasksCreated, 'tasksCreated');
        fillMap(tasksCompleted, 'tasksCompleted');

        // Convert map to sorted array and fill missing days
        const analyticsData = [];
        let currentDate = new Date(thirtyDaysAgo);

        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (dateMap.has(dateStr)) {
                analyticsData.push(dateMap.get(dateStr));
            } else {
                analyticsData.push({ date: dateStr, users: 0, tasksCreated: 0, tasksCompleted: 0 });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json({ success: true, analytics: analyticsData });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
