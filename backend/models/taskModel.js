import mongoose from "mongoose";

/* -------------------- Subtask -------------------- */
const SubtaskSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo",
        },
    }
);

/* -------------------- Task -------------------- */
const taskSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: { type: String, required: true },
        description: { type: String, default: "" },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
            index: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "on-going",
                "completed",
                "cancelled",
                "blocked",
                "deleted",
            ],
            default: "pending",
            index: true,
        },

        category: { type: String, default: "", index: true },
        deadline: { type: Date, default: null, index: true },
        completedAt: { type: Date, default: null },

        subtasks: { type: [SubtaskSchema], default: [] },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/* -------------------- Indexes -------------------- */
// Efficient user queries
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, deadline: 1 });

const Task =
    mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
