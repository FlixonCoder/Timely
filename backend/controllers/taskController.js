// controllers/taskController.js
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

/* helper: get userId (auth middleware sets req.body.userId) */
const getUserIdFromReq = (req) => req.userId || req.body.userId || req.params.userId || req.query.userId;

/* ADD TASK -> appends into user.tasks */
const addTask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });

    const { title, description = "", priority = "medium", status = "pending", deadline = null, category = "", subtasks = [] } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Task title is required" });

    const normalizedSubtasks = (Array.isArray(subtasks) ? subtasks : []).map(st => ({
      name: st.name || "",
      status: st.status || "todo"
    }));

    const taskObj = {
      title,
      description,
      priority,
      status,
      deadline: deadline ? new Date(deadline) : null,
      category,
      subtasks: normalizedSubtasks
    };

    const updated = await userModel.findByIdAndUpdate(
      userId,
      { $push: { tasks: taskObj } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    const addedTask = updated.tasks[updated.tasks.length - 1];
    res.status(201).json({ success: true, message: "Task added", task: addedTask, user: updated });
  } catch (error) {
    console.error("addTask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* GET TASKS for user (supports optional query filters) */
const getTasks = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });

    const user = await userModel.findById(userId).select("tasks -_id");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let tasks = user.tasks || [];
    /* Filter out deleted tasks by default */
    tasks = tasks.filter(t => t.status !== "deleted");

    const { status, priority, category } = req.query;
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    if (category) tasks = tasks.filter(t => t.category === category);

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("getTasks:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* UPDATE TASK fields
   Route uses :id (taskId) to match your routes.
*/
const updateTask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    if (!userId || !taskId) return res.status(400).json({ success: false, message: "userId and taskId required" });

    const allowed = ["title", "description", "priority", "status", "deadline", "category", "subtasks"];
    const setObj = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) {
        setObj[`tasks.$.${k}`] = k === "deadline" && req.body[k] ? new Date(req.body[k]) : req.body[k];
      }
    });

    if (Object.keys(setObj).length === 0) return res.status(400).json({ success: false, message: "No valid fields provided to update" });

    const updated = await userModel.findOneAndUpdate(
      { _id: userId, "tasks._id": taskId },
      { $set: setObj },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User or Task not found" });

    // --- AUTO-COMPLETION LOGIC (Top-Down) ---
    // If task status is updated, sync subtasks
    if (setObj["tasks.$.status"]) {
      const newStatus = setObj["tasks.$.status"];
      const subtaskStatus = newStatus === "completed" ? "done" : "todo";

      await userModel.updateMany(
        { _id: userId, "tasks._id": taskId },
        { $set: { "tasks.$[t].subtasks.$[].status": subtaskStatus } },
        { arrayFilters: [{ "t._id": new mongoose.Types.ObjectId(taskId) }] }
      );
    }

    // Fetch fresh to get the subtask updates
    const finalUser = await userModel.findById(userId).select("-password");
    if (!finalUser) return res.status(404).json({ success: false, message: "User not found" });

    const task = finalUser.tasks.find(t => String(t._id) === String(taskId));
    res.status(200).json({ success: true, message: "Task updated", task, user: finalUser });
  } catch (error) {
    console.error("updateTask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* DELETE TASK (uses :id) */
const deleteTask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    if (!userId || !taskId) return res.status(400).json({ success: false, message: "userId and taskId required" });

    const updated = await userModel.findOneAndUpdate(
      { _id: userId, "tasks._id": taskId },
      { $set: { "tasks.$.status": "deleted" } },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User not found or task not present" });

    res.status(200).json({ success: true, message: "Task deleted", user: updated });
  } catch (error) {
    console.error("deleteTask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* SUBTASKS: add, update, delete */

/* ADD SUBTASK -> POST /api/tasks/:id/subtasks */
const addSubtask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    const { name, status = "todo" } = req.body;

    if (!userId || !taskId || !name) return res.status(400).json({ success: false, message: "userId, taskId and subtask name required" });

    const subtaskObj = { _id: new mongoose.Types.ObjectId(), name, status };

    const updated = await userModel.findOneAndUpdate(
      { _id: userId, "tasks._id": taskId },
      { $push: { "tasks.$.subtasks": subtaskObj } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User or Task not found" });

    const task = updated.tasks.find(t => String(t._id) === String(taskId));
    const added = task.subtasks.find(s => String(s._id) === String(subtaskObj._id));

    res.status(201).json({ success: true, message: "Subtask added", subtask: added, task, user: updated });
  } catch (error) {
    console.error("addSubtask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* UPDATE SUBTASK -> PUT /api/tasks/:id/subtasks/:subtaskId */
const updateSubtask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    const subtaskId = req.params.subtaskId;
    const { name, status } = req.body;

    if (!userId || !taskId || !subtaskId) return res.status(400).json({ success: false, message: "userId, taskId and subtaskId required" });

    const setObj = {};
    if (name !== undefined) setObj["tasks.$[t].subtasks.$[s].name"] = name;
    if (status !== undefined) setObj["tasks.$[t].subtasks.$[s].status"] = status;

    if (Object.keys(setObj).length === 0) return res.status(400).json({ success: false, message: "No update fields provided" });

    const updated = await userModel.findOneAndUpdate(
      { _id: userId, "tasks._id": taskId },
      { $set: setObj },
      {
        arrayFilters: [{ "t._id": new mongoose.Types.ObjectId(taskId) }, { "s._id": new mongoose.Types.ObjectId(subtaskId) }],
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User/Task/Subtask not found" });

    // --- AUTO-COMPLETION LOGIC (Bottom-Up) ---
    // Check if ALL subtasks are now done.
    const currentTask = updated.tasks.find(t => String(t._id) === String(taskId));
    if (currentTask && currentTask.subtasks && currentTask.subtasks.length > 0) {
      const allDone = currentTask.subtasks.every(s => s.status === 'done' || s.status === 'completed');
      const parentStatus = allDone ? 'completed' : 'pending';

      // Only update if different to avoid redundancy (though redundant update is harmless)
      if (currentTask.status !== parentStatus) {
        const finalUpdate = await userModel.findOneAndUpdate(
          { _id: userId, "tasks._id": taskId },
          { $set: { "tasks.$.status": parentStatus } },
          { new: true }
        );
        // Use the fully updated document
        const finalTask = finalUpdate.tasks.find(t => String(t._id) === String(taskId));
        const finalSubtask = finalTask.subtasks.find(s => String(s._id) === String(subtaskId));
        return res.status(200).json({ success: true, message: "Subtask updated (Parent synced)", subtask: finalSubtask, task: finalTask, user: finalUpdate });
      }
    }

    const task = updated.tasks.find(t => String(t._id) === String(taskId));
    const subtask = task.subtasks.find(s => String(s._id) === String(subtaskId));

    res.status(200).json({ success: true, message: "Subtask updated", subtask, task, user: updated });
  } catch (error) {
    console.error("updateSubtask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* DELETE SUBTASK -> DELETE /api/tasks/:id/subtasks/:subtaskId */
const deleteSubtask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    const subtaskId = req.params.subtaskId;

    if (!userId || !taskId || !subtaskId) return res.status(400).json({ success: false, message: "userId, taskId and subtaskId required" });

    const updated = await userModel.findOneAndUpdate(
      { _id: userId, "tasks._id": taskId },
      { $pull: { "tasks.$.subtasks": { _id: subtaskId } } },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User/Task/Subtask not found" });

    res.status(200).json({ success: true, message: "Subtask deleted", user: updated });
  } catch (error) {
    console.error("deleteSubtask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask
};
