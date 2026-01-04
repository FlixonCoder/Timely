// controllers/userController.js
import User from "../models/userModel.js";
import userDataModel from "../models/userDataModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/* --------------------------------------------------
   JWT Helper
-------------------------------------------------- */
const createToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* --------------------------------------------------
   Helper: userId (EXPECTED from auth middleware)
-------------------------------------------------- */
const getUserIdFromReq = (req) => req.userId;

/* --------------------------------------------------
   REGISTER
-------------------------------------------------- */
const registerUser = async (req, res) => {
    try {
        const { name, username, email, password, dob } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, username, email and password are required",
            });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(409).json({
                success: false,
                message: "Username already taken",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            dob: dob ? new Date(dob) : null,
        });

        // Initialize user metrics
        await userDataModel.create({ userId: user._id });

        const token = createToken(user._id);

        return res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                dob: user.dob,
            },
        });
    } catch (error) {
        console.error("registerUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   LOGIN
-------------------------------------------------- */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        await userDataModel.findOneAndUpdate(
            { userId: user._id },
            { $set: { lastActive: new Date() } }
        );

        const token = createToken(user._id);

        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                dob: user.dob,
            },
        });
    } catch (error) {
        console.error("loginUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   GET USER PROFILE (SELF ONLY)
-------------------------------------------------- */
const getUser = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("getUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   UPDATE PROFILE
-------------------------------------------------- */
const updateUser = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const allowedFields = ["name", "username", "email", "dob"];
        const payload = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                payload[field] =
                    field === "dob" && req.body[field]
                        ? new Date(req.body[field])
                        : req.body[field];
            }
        });

        // Image upload
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            payload.image = result.secure_url;
        }

        // Uniqueness checks
        if (payload.username) {
            const exists = await User.findOne({
                username: payload.username,
                _id: { $ne: userId },
            });
            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: "Username already taken",
                });
            }
        }

        if (payload.email) {
            const exists = await User.findOne({
                email: payload.email,
                _id: { $ne: userId },
            });
            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: "Email already in use",
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, payload, {
            new: true,
        }).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("updateUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   CHANGE PASSWORD
-------------------------------------------------- */
const changePassword = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const { oldPassword, newPassword } = req.body;

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password incorrect",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters",
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("changePassword:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* --------------------------------------------------
   DELETE USER (HARD DELETE)
-------------------------------------------------- */
const deleteUser = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await userDataModel.findOneAndDelete({ userId });
        const deleted = await User.findByIdAndDelete(userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("deleteUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    changePassword,
    deleteUser,
};
