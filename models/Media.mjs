import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
        required: true,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["image", "video"],
        required: true,
    },
    tags: [{
        type: String,
    }],
    reactions: {
        type: Map,
        of: [mongoose.Schema.Types.ObjectId],
        default: {},
    },
    isDuplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
    },
    qualityScore: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

const Media = mongoose.model("Media", mediaSchema);
export default Media;