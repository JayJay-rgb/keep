import Notification from "../models/Notification.mjs";
import { getIO } from "../config/socket.mjs";

export const notifyGroupMembers = async ({ group, excludeUserId, type, message, fromUser, album, media }) => {
    const recipients = group.members.filter(
        memberId => memberId.toString() !== excludeUserId
    );

    const notifications = await Notification.insertMany(
        recipients.map(recipient => ({
            recipient,
            type,
            message,
            fromUser,
            group: group._id,
            album,
            media,
        }))
    );

    notifications.forEach(notification => {
        getIO().to(notification.recipient.toString()).emit("new-notification", notification);
    });
};