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

        // Populate with UserData
        const usersWithData = await Promise.all(users.map(async (user) => {
            const data = await userDataModel.findOne({ userId: user._id });
            return {
                ...user.toObject(),
                userData: data || { totalTasks: 0, lastActive: null, taskCompletionStatus: {} }
            };
        }));

        res.json({ success: true, users: usersWithData });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

export { adminLogin, getDashboardStats, getAllUsers };
