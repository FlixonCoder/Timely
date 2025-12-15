import mongoose from "mongoose";

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

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["pending", "on-going", "completed", "blocked"],
            default: "pending",
        },
        deadline: { type: Date, default: null },
        category: { type: String, default: "" },
        subtasks: { type: [SubtaskSchema], default: [] },
    }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        image: { type: String, default: "" },
        dob: { type: Date, default: null },
        tasks: { type: [TaskSchema], default: [] },
    },
    { timestamps: true, versionKey: false, minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
