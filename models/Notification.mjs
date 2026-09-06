import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["album_created", "media_uploaded", "reaction", "kicked"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    },
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;