import axios from "axios";
import "dotenv/config";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

export const detectDuplicates = async (mediaItems) => {
    const res = await axios.post(`${AI_SERVICE_URL}/analyze/duplicates`, { media: mediaItems });
    return res.data.results;
};

export const pickBestPhoto = async (mediaItems) => {
    const res = await axios.post(`${AI_SERVICE_URL}/analyze/best-photo`, { media: mediaItems });
    return res.data.bestId;
};

export const getTags = async (url) => {
    const res = await axios.post(`${AI_SERVICE_URL}/analyze/tags`, { url });
    return res.data.tags;
};

export const getEmotions = async (url) => {
    const res = await axios.post(`${AI_SERVICE_URL}/analyze/emotions`, { url });
    return res.data.emotions;
};

export const matchFaces = async (url, knownUsers) => {
    const res = await axios.post(`${AI_SERVICE_URL}/analyze/faces`, { url, knownUsers });
    return res.data.matchedUserIds;
};