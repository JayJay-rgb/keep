import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    eventDate: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const Album = mongoose.model("Album", albumSchema);
export default Album;