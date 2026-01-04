import mongoose from "mongoose";

const HabitSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", index: true },
        name: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        active: { type: Boolean, default: true },
    },
    { versionKey: false }
);

const HabitEntrySchema = new mongoose.Schema(
    {
        habitId: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", index: true },
        date: { type: String, required: true }, // "YYYY-MM-DD"
        completed: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false }
);

// Prevent duplicates for the same habit and date
HabitEntrySchema.index({ habitId: 1, date: 1 }, { unique: true });

const Habit = mongoose.model("Habit", HabitSchema);
const HabitEntry = mongoose.model("HabitEntry", HabitEntrySchema);

export { Habit, HabitEntry };
