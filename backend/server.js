// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import taskRouter from "./routes/taskRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

/* ------------------ DB & Services ------------------ */
connectDB();
connectCloudinary();

/* ------------------ Middleware ------------------ */
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // add your frontend Vercel URL later
    ],
    credentials: true,
  })
);

/* ------------------ Routes ------------------ */
app.use("/api/user", userRouter);
app.use("/api/tasks", taskRouter);

app.get("/", (req, res) => {
  res.status(200).send("API working great");
});

/* ------------------ EXPORT (IMPORTANT) ------------------ */
export default app;
