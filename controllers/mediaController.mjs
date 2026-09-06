import mongoose from "mongoose";
import Group from "../models/Group.mjs";
import { getIO } from "../config/socket.mjs";
import Media from "../models/Media.mjs";
import Notification from "../models/Notification.mjs";
import { notifyGroupMembers } from "../utils/notify.mjs";



export const memoryOfTheWeek = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const foundGroup = await Group.findById(groupId);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recap = await Media.aggregate([
            {
                $match: {
                    group: new mongoose.Types.ObjectId(groupId),
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            { $sample: { size: 10 } },
        ]);

        return res.status(200).json({ recap });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const getGroupStats = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const foundGroup = await Group.findById(groupId);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const totalMedia = await Media.countDocuments({ group: groupId });

        const uploaderStats = await Media.aggregate([
            { $match: { group: new mongoose.Types.ObjectId(groupId) } },
            {
                $group: {
                    _id: "$uploader",
                    uploadCount: { $sum: 1 },
                },
            },
            { $sort: { uploadCount: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "uploaderInfo",
                },
            },
            { $unwind: "$uploaderInfo" },
            {
                $project: {
                    _id: 0,
                    uploadCount: 1,
                    username: "$uploaderInfo.username",
                },
            },
        ]);

        return res.status(200).json({
            totalMedia,
            mostActiveUploader: uploaderStats[0] || null,
            currentStreak: foundGroup.streakCount,
            longestStreak: foundGroup.longestStreak,
            totalMembers: foundGroup.members.length,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const getMediaFeed = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const foundGroup = await Group.findById(groupId);
        if (!foundGroup) return res.status(404).json({ message: "Group not found" });

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) return res.status(403).json({ message: "You are not a member of this group" });

        // Prefer non-duplicate media first; only include duplicates if not enough originals exist
        const feed = await Media.aggregate([
            {
                $match: {
                    group: new mongoose.Types.ObjectId(groupId),
                    isDuplicateOf: null,
                },
            },
            { $sample: { size: 20 } },
        ]);

        return res.status(200).json({ feed });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};



export const reactToMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const allowedEmojis = ["❤️", "😂", "🔥","💔"];
        if (!allowedEmojis.includes(emoji)) {
            return res.status(400).json({ message: "Invalid reaction" });
        }

        const foundMedia = await Media.findById(mediaId);
        if (!foundMedia) {
            return res.status(404).json({ message: "Media not found" });
        }

        const foundGroup = await Group.findById(foundMedia.group);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

const existingReactors = foundMedia.reactions.get(emoji) || [];

const alreadyReacted = existingReactors.some(
    id => id.toString() === userId
);

let updatedReactions;

if (alreadyReacted) {
    await Media.updateOne(
        { _id: mediaId },
        {
            $pull: {
                [`reactions.${emoji}`]: userId
            }
        }
    );
} else {
    await Media.updateOne(
        { _id: mediaId },
        {
            $addToSet: {
                [`reactions.${emoji}`]: userId
            }
        }
    );
}

const updatedMedia = await Media.findById(mediaId);

updatedReactions = updatedMedia.reactions;
        if (foundMedia.uploader.toString() !== userId) {
    await Notification.create({
        recipient: foundMedia.uploader,
        type: "reaction",
        message: `Someone reacted ${emoji} to your photo`,
        fromUser: userId,
        media: foundMedia._id,
    });
    getIO().to(foundMedia.uploader.toString()).emit("new-notification", { type: "reaction" });
}
getIO().to(foundGroup._id.toString()).emit("new-reaction", {
    mediaId: foundMedia._id,
    emoji,
    userId,
    reactions: updatedReactions
});

return res.status(200).json({
    message: "Reaction updated",
    reactions: updatedReactions
});
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


export const onThisDay = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const foundGroup = await Group.findById(groupId);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const today = new Date();
        const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
        const currentDay = today.getDate();
        const currentYear = today.getFullYear();

        const memories = await Media.aggregate([
            { $match: { group: new mongoose.Types.ObjectId(groupId) } },
            {
                $addFields: {
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                    year: { $year: "$createdAt" },
                },
            },
            {
                $match: {
                    month: currentMonth,
                    day: currentDay,
                    year: { $ne: currentYear },
                },
            },
        ]);

        return res.status(200).json({ memories });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


export const deleteMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.id;

        const foundMedia = await Media.findById(mediaId);
        if (!foundMedia) {
            return res.status(404).json({ message: "Media not found" });
        }

        const foundGroup = await Group.findById(foundMedia.group);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isAdmin = foundGroup.admin.toString() === userId;
        const isUploader = foundMedia.uploader.toString() === userId;

        if (!isAdmin && !isUploader) {
            return res.status(403).json({ message: "You don't have permission to delete this media" });
        }

        await Media.findByIdAndDelete(mediaId);

        return res.status(200).json({ message: "Media deleted successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};