import Media from "../../models/Media.mjs";
import Album from "../../models/Album.mjs";
import Group from "../../models/Group.mjs";
import User from "../../models/User.mjs";
import { detectDuplicates, pickBestPhoto, getTags, getEmotions, matchFaces } from "../../config/aiService.mjs";

// Run duplicate detection + best photo picker together for an album
export const runDuplicateDetection = async (req, res) => {
    try {
        const { albumId } = req.params;
        const mediaItems = await Media.find({ album: albumId, type: "image" });
        const formatted = mediaItems.map((item) => ({ id: item._id.toString(), url: item.url }));

        const results = await detectDuplicates(formatted);

        // Group duplicates together, then pick the best in each group
        const groups = {};
        for (const result of results) {
            const key = result.isDuplicateOf || result.id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(result.id);
        }

        for (const [originalId, groupIds] of Object.entries(groups)) {
            if (groupIds.length < 2) continue;

            const groupMedia = formatted.filter((item) => groupIds.includes(item.id));
            const bestId = await pickBestPhoto(groupMedia);

            for (const item of groupMedia) {
                await Media.findByIdAndUpdate(item.id, {
                    isDuplicateOf: item.id === bestId ? null : bestId,
                });
            }
        }

        return res.status(200).json({ message: "Duplicate detection complete" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Duplicate detection failed" });
    }
};

// Auto-tag a single piece of media
export const runAutoTagging = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const foundMedia = await Media.findById(mediaId);
        if (!foundMedia) return res.status(404).json({ message: "Media not found" });
        if (foundMedia.type !== "image") return res.status(400).json({ message: "Tagging only supports images" });

        const tags = await getTags(foundMedia.url);
        foundMedia.tags = tags;
        await foundMedia.save();

        return res.status(200).json({ tags });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Tagging failed" });
    }
};

// Weekly emotion awards for a group
export const getDailyEmotionAwards = async (req, res) => {
    try {
        const { groupId } = req.params;
        // const sevenDaysAgo = new Date();
        // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getMinutes() - 1);

        const mediaItems = await Media.find({
            group: groupId,
            type: "image",
            createdAt: { $gte: oneDayAgo },
        });

        const emotionResults = [];
        for (const item of mediaItems) {
            try {
                const emotions = await getEmotions(item.url);
                if (emotions) {
                    emotionResults.push({ mediaId: item._id, url: item.url, emotions });
                    item.emotionTags = emotions;
                    await item.save();
                }
            } catch (e) {
                console.log(`Skipping emotion analysis for ${item._id}:`, e.message);
            }
        }

        if (emotionResults.length === 0) {
            return res.status(200).json({ awards: {} });
        }

        const findTopFor = (emotionKey) => {
            let best = null;
            let bestScore = -1;
            for (const result of emotionResults) {
                const score = result.emotions[emotionKey] || 0;
                if (score > bestScore) {
                    bestScore = score;
                    best = result;
                }
            }
            return best;
        };

        const awards = {
            happiest: findTopFor("happy"),
            saddest: findTopFor("sad"),
            mostSurprised: findTopFor("surprise"),
            angriest: findTopFor("angry"),
        };

        return res.status(200).json({ awards });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Emotion analysis failed" });
    }
};

// Face recognition for a single photo, against opted-in group members
export const runFaceRecognition = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const foundMedia = await Media.findById(mediaId);
        if (!foundMedia) return res.status(404).json({ message: "Media not found" });

        const foundGroup = await Group.findById(foundMedia.group).populate("members");
        const optedInMembers = foundGroup.members.filter(
            (m) => m.faceRecognitionOptIn && m.profilePicture
        );

        if (optedInMembers.length === 0) {
            return res.status(200).json({ matchedUserIds: [] });
        }

        const knownUsers = optedInMembers.map((m) => ({
            userId: m._id.toString(),
            profilePictureUrl: m.profilePicture,
        }));

        const matchedUserIds = await matchFaces(foundMedia.url, knownUsers);

        return res.status(200).json({ matchedUserIds });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Face recognition failed" });
    }
};