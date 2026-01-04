// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import taskRouter from "./routes/taskRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

connectDB();
connectCloudinary();

app.use(express.json());
app.use(
  cors({
    origin: [
      `${process.env.CLIENT_URL}`,
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true,
  })
);

// Routes
import adminRouter from "./routes/adminRoute.js";
import habitRouter from "./routes/habitRoutes.js";

app.use("/api/user", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/admin", adminRouter);
app.use("/api/habits", habitRouter);

app.get("/", (req, res) => res.send("API working great"));

app.listen(port, () => console.log("Server Started"));
