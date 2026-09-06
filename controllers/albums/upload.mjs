import { getIO } from "../../config/socket.mjs";
import axios from "axios";
import archiver from "archiver";
import Album from "../../models/Album.mjs";
import Media from "../../models/Media.mjs";
import { notifyGroupMembers } from "../../utils/notify.mjs";
import Group from "../../models/Group.mjs";

export const uploadMedia = async (req, res) => {
    try {
        const { albumId } = req.params;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const foundAlbum = await Album.findById(albumId);
        if (!foundAlbum) {
            return res.status(404).json({ message: "Album not found" });
        }

        const foundGroup = await Group.findById(foundAlbum.group);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

        const newMedia = await Media.create({
            album: foundAlbum._id,
            group: foundGroup._id,
            uploader: userId,
            url: req.file.path,
            type: mediaType,
        });

        // --- streak logic ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); // strip time, keep just the date

        const lastActive = foundGroup.lastActiveDate ? new Date(foundGroup.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);

        if (!lastActive) {
            // first ever upload for this group
            foundGroup.streakCount = 1;
        } else {
            const diffInDays = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));

            if (diffInDays === 0) {
                // already active today, do nothing to the count
            } else if (diffInDays === 1) {
                // active yesterday, streak continues
                foundGroup.streakCount += 1;
            } else {
                // streak broken
                foundGroup.streakCount = 1;
            }
        }

        if (foundGroup.streakCount > foundGroup.longestStreak) {
            foundGroup.longestStreak = foundGroup.streakCount;
        }

        foundGroup.lastActiveDate = today;
        await foundGroup.save();

        getIO().to(foundGroup._id.toString()).emit("new-media", newMedia);
        await notifyGroupMembers({
    group: foundGroup,
    excludeUserId: userId,
    type: "media_uploaded",
    message: `New ${mediaType} was added to the group`,
    fromUser: userId,
    media: newMedia._id,
});

        return res.status(201).json({ message: "Media uploaded successfully", media: newMedia });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Couldn't upload media" });
    }
};


export const exportAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const userId = req.user.id;

        const foundAlbum = await Album.findById(albumId);
        if (!foundAlbum) {
            return res.status(404).json({ message: "Album not found" });
        }

        const foundGroup = await Group.findById(foundAlbum.group);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const mediaItems = await Media.find({ album: albumId });
        if (mediaItems.length === 0) {
            return res.status(404).json({ message: "No media found in this album" });
        }

        res.set({
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${foundAlbum.title}.zip"`,
        });

        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(res);

        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i];
            const response = await axios.get(item.url, { responseType: "stream" });
            const extension = item.type === "video" ? "mp4" : "jpg";
            archive.append(response.data, { name: `photo-${i + 1}.${extension}` });
        }

        await archive.finalize();

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};