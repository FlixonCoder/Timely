import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        image: { type: String, default: "" },
        dob: { type: Date, default: null },

        // References only (no embedded heavy data)
        habits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Habit" }],
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    }
);

const User =
    mongoose.models.User || mongoose.model("User", userSchema);

export default User;
