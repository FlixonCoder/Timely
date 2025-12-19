import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
        totalTasks: { type: Number, default: 0 },
        lastActive: { type: Date, default: Date.now },
        taskCompletionStatus: {
            veryEarly: { type: Number, default: 0 }, // > 24 hours before deadline
            early: { type: Number, default: 0 },      // < 24 hours before deadline
            ontime: { type: Number, default: 0 },     // Within 1 hour after deadline
            late: { type: Number, default: 0 },       // > 1 hour after deadline
            incomplete: { type: Number, default: 0 }  // Tasks past deadline but not done (calculated or updated)
        }
    },
    { timestamps: true, versionKey: false }
);

const UserData = mongoose.models.UserData || mongoose.model("UserData", userDataSchema, "data");

export default UserData;
