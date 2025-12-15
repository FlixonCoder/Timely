// routes/userRoutes.js
import express from "express";
import {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    changePassword,
    deleteUser
} from "../controllers/userController.js";
import authUser from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

// Public
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Protected (authUser sets req.body.userId)
userRouter.get("/profile", authUser, getUser);
userRouter.put("/update-profile", authUser, upload.single('image'), updateUser);
userRouter.put("/change-password", authUser, changePassword);
userRouter.delete("/delete", authUser, deleteUser);

export default userRouter;
