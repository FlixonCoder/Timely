// routes/taskRoutes.js
import express from "express";
import authUser from "../middleware/authMiddleware.js";
import {
    addTask,
    getTasks,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask
} from "../controllers/taskController.js";

const taskRouter = express.Router();

taskRouter.use(authUser);

// Create
taskRouter.post("/add-task", addTask);

// Read
taskRouter.get("/get-tasks", getTasks);

// Update task fields (uses :id for taskId)
taskRouter.put("/update-task/:id", updateTask);

// Delete task
taskRouter.delete("/delete-task/:id", deleteTask);

// Subtasks
taskRouter.post("/:id/subtasks", addSubtask); // add subtask to task :id
taskRouter.put("/:id/subtasks/:subtaskId", updateSubtask); // update subtask
taskRouter.delete("/:id/subtasks/:subtaskId", deleteSubtask); // delete subtask

export default taskRouter;
