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
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true,
  })
);

// Routes
app.use("/api/user", userRouter);
app.use("/api/tasks", taskRouter);

app.get("/", (req, res) => res.send("API working great"));

app.listen(port, () => console.log("Server Started"));
