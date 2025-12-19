// controllers/userController.js
import userModel from "../models/userModel.js";
import userDataModel from "../models/userDataModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* REGISTER */
const registerUser = async (req, res) => {
    try {
        const { name, username, email, password, dob } = req.body;
        if (!name || !username || !email || !password)
            return res.status(400).json({ success: false, message: "Name, username, email and password are required." });

        const emailExists = await userModel.findOne({ email });
        if (emailExists) return res.status(409).json({ success: false, message: "User with this email already exists" });

        const usernameExists = await userModel.findOne({ username });
        if (usernameExists) return res.status(409).json({ success: false, message: "Username is already taken" });

        if (password.length < 8)
            return res.status(400).json({ success: false, message: "Please enter a strong password (min 8 chars)." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            username,
            email,
            password: hashedPassword,
            dob: dob ? new Date(dob) : null
        });

        const user = await newUser.save();

        // [NEW] Initialize User Data
        await userDataModel.create({ userId: user._id });

        const token = createToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                dob: user.dob,
                tasks: user.tasks || []
            }
        });
    } catch (error) {
        console.error("registerUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* LOGIN */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required." });

        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User does not exist" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

        // [NEW] Update Last Active
        await userDataModel.findOneAndUpdate({ userId: user._id }, { lastActive: new Date() });

        const token = createToken(user._id);
        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                dob: user.dob,
                tasks: user.tasks || []
            }
        });
    } catch (error) {
        console.error("loginUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* GET USER PROFILE (prefers req.body.userId from auth middleware) */
const getUser = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId || req.params.userId;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ success: false, message: "Invalid userId" });

        const user = await userModel.findById(userId).select("-password -__v");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("getUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* UPDATE PROFILE (name, username, dob, email, image) */
const updateUser = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId || req.params.userId;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });

        const allowed = ["name", "username", "dob", "email"];
        const payload = {};

        allowed.forEach(k => {
            if (req.body[k] !== undefined) payload[k] = k === "dob" && req.body[k] ? new Date(req.body[k]) : req.body[k];
        });

        // Handle Image Upload
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            payload.image = result.secure_url;
        }

        if (payload.username) {
            const already = await userModel.findOne({ username: payload.username, _id: { $ne: userId } });
            if (already) return res.status(409).json({ success: false, message: "Username already taken" });
        }

        if (payload.email) {
            const already = await userModel.findOne({ email: payload.email, _id: { $ne: userId } });
            if (already) return res.status(409).json({ success: false, message: "Email already in use" });
        }

        const updated = await userModel.findByIdAndUpdate(userId, payload, { new: true }).select("-password -__v");
        if (!updated) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "Profile updated", user: updated });
    } catch (error) {
        console.error("updateUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* CHANGE PASSWORD */
const changePassword = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { oldPassword, newPassword } = req.body;
        if (!userId || !oldPassword || !newPassword)
            return res.status(400).json({ success: false, message: "userId, oldPassword and newPassword required" });

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Old password incorrect" });

        if (newPassword.length < 8)
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("changePassword:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* DELETE USER */
const deleteUser = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId || req.params.userId;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });

        // [NEW] Cleanup User Data
        await userDataModel.findOneAndDelete({ userId });

        const deleted = await userModel.findByIdAndDelete(userId);
        if (!deleted) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error("deleteUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    changePassword,
    deleteUser
};
