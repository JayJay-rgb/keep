import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    inviteCode: {
        type: String,
        required: true,
        unique: true,
    },
    streakCount: {
        type: Number,
        default: 0,
    },
    longestStreak: {
        type: Number,
        default: 0,
    },
    lastActiveDate: {
        type: Date,
    },
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);
export default Group;