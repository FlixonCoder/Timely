// controllers/taskController.js
import Task from "../models/taskModel.js";
import userDataModel from "../models/userDataModel.js";

/* --------------------------------------------------
   Helper: userId (EXPECTED from auth middleware)
-------------------------------------------------- */
const getUserIdFromReq = (req) => req.userId;

/* --------------------------------------------------
   ADD TASK
-------------------------------------------------- */
const addTask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      title,
      description = "",
      priority = "medium",
      status = "pending",
      deadline = null,
      category = "",
      subtasks = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const normalizedSubtasks = Array.isArray(subtasks)
      ? subtasks.map((st) => ({
        name: st.name,
        status: st.status || "todo",
      }))
      : [];

    const task = await Task.create({
      userId,
      title,
      description,
      priority,
      status,
      deadline: deadline ? new Date(deadline) : null,
      category,
      subtasks: normalizedSubtasks,
    });

    // Update user metrics
    await userDataModel.findOneAndUpdate(
      { userId },
      {
        $inc: { totalTasks: 1 },
        $set: { lastActive: new Date() },
      },
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("addTask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   GET TASKS
-------------------------------------------------- */
const getTasks = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status, priority, category } = req.query;

    const query = { userId };

    // Exclude deleted by default
    if (status) query.status = status;
    else query.status = { $ne: "deleted" };

    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("getTasks:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   UPDATE TASK
-------------------------------------------------- */
const updateTask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;

    if (!userId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    await userDataModel.findOneAndUpdate(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    const allowedFields = [
      "title",
      "description",
      "priority",
      "status",
      "deadline",
      "category",
      "subtasks",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] =
          field === "deadline" && req.body[field]
            ? new Date(req.body[field])
            : req.body[field];
      }
    });

    // Handle completedAt
    if (updateData.status) {
      if (updateData.status === "completed") {
        updateData.completedAt = new Date();
      } else if (updateData.status !== "deleted") {
        updateData.completedAt = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided",
      });
    }

    const existingTask = await Task.findOne({ _id: taskId, userId });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /* ---------- Metrics (Completion Timing) ---------- */
    if (
      updateData.status === "completed" &&
      existingTask.status !== "completed"
    ) {
      const now = new Date();
      const deadline = existingTask.deadline;

      let metricKey = "ontime";

      if (deadline) {
        const diffHours = (deadline - now) / (1000 * 60 * 60);
        if (diffHours >= 24) metricKey = "veryEarly";
        else if (diffHours > 0) metricKey = "early";
        else if (diffHours >= -1) metricKey = "ontime";
        else metricKey = "late";
      }

      await userDataModel.findOneAndUpdate(
        { userId },
        { $inc: { [`taskCompletionStatus.${metricKey}`]: 1 } }
      );
    }

    /* ---------- Auto-update subtasks ---------- */
    if (
      updateData.status &&
      !updateData.subtasks &&
      updateData.status !== "deleted"
    ) {
      const subtaskStatus =
        updateData.status === "completed"
          ? "done"
          : updateData.status === "pending" ||
            updateData.status === "on-going"
            ? "todo"
            : null;

      if (subtaskStatus) {
        await Task.updateOne(
          { _id: taskId, userId },
          { $set: { "subtasks.$[].status": subtaskStatus } }
        );
      }
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error("updateTask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   DELETE TASK (SOFT DELETE)
-------------------------------------------------- */
const deleteTask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;

    if (!userId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    await userDataModel.findOneAndUpdate(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { $set: { status: "deleted" } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    console.error("deleteTask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   SUBTASKS
-------------------------------------------------- */
const addSubtask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    const { name, status = "todo" } = req.body;

    if (!userId || !taskId || !name) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    await userDataModel.findOneAndUpdate(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { $push: { subtasks: { name, status } } },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(201).json({
      success: true,
      subtask: updatedTask.subtasks.at(-1),
      task: updatedTask,
    });
  } catch (error) {
    console.error("addSubtask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSubtask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    const subtaskId = req.params.subtaskId;
    const { name, status } = req.body;

    if (!userId || !taskId || !subtaskId) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    await userDataModel.findOneAndUpdate(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    const setQuery = {};
    if (name !== undefined) setQuery["subtasks.$.name"] = name;
    if (status !== undefined) setQuery["subtasks.$.status"] = status;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId, "subtasks._id": subtaskId },
      { $set: setQuery },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task or subtask not found",
      });
    }

    // Auto-complete task if all subtasks done
    if (
      updatedTask.subtasks.length > 0 &&
      updatedTask.subtasks.every((s) => s.status === "done")
    ) {
      if (updatedTask.status !== "completed") {
        updatedTask.status = "completed";
        updatedTask.completedAt = new Date();
        await updatedTask.save();
      }
    }

    return res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error("updateSubtask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSubtask = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const taskId = req.params.id;
    const subtaskId = req.params.subtaskId;

    if (!userId || !taskId || !subtaskId) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    await userDataModel.findOneAndUpdate(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { $pull: { subtasks: { _id: subtaskId } } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error("deleteSubtask:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
};
