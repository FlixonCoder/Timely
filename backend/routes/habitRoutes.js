import express from "express";
import { createHabit, deleteHabit, getHabits, toggleHabitDate, getHabitStats } from "../controllers/habitController.js";
import authUser from "../middleware/authMiddleware.js";

const habitRouter = express.Router();

// All routes protected by authUser
habitRouter.use(authUser);

habitRouter.get("/", getHabits);
habitRouter.get("/stats", getHabitStats); // Place before :id to prevent issues if we add GET /:id later
habitRouter.post("/create", createHabit);
habitRouter.post("/:id/toggle", toggleHabitDate);
habitRouter.delete("/:id", deleteHabit);

export default habitRouter;
