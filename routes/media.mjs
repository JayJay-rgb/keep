import { getMediaFeed } from "../controllers/mediaController.mjs";
import express from "express";
import { exportAlbum } from "../controllers/albums/upload.mjs";
import { reactToMedia,onThisDay,memoryOfTheWeek,getGroupStats,deleteMedia } from "../controllers/mediaController.mjs";
import verifyJwt from "../middleware/verifyJwt.mjs";
import {
    runDuplicateDetection,
    runAutoTagging,
    getWeeklyEmotionAwards,
    runFaceRecognition,
} from "../controllers/media/aiAnalysis.mjs";


const mediaRouter = express.Router();
mediaRouter.post("/:mediaId/react", verifyJwt, reactToMedia);
mediaRouter.get("/group/:groupId/feed", verifyJwt, getMediaFeed);
mediaRouter.delete("/:mediaId",verifyJwt,deleteMedia)
mediaRouter.get("/group/:groupId/on-this-day", verifyJwt, onThisDay);
mediaRouter.get("/group/:groupId/stats", verifyJwt, getGroupStats);
mediaRouter.get("/album/:albumId/export", verifyJwt, exportAlbum);
mediaRouter.get("/group/:groupId/memory-of-week", verifyJwt, memoryOfTheWeek);
mediaRouter.post("/album/:albumId/detect-duplicates", verifyJwt, runDuplicateDetection);
mediaRouter.post("/:mediaId/auto-tag", verifyJwt, runAutoTagging);
mediaRouter.get("/group/:groupId/emotion-awards", verifyJwt, getWeeklyEmotionAwards);
mediaRouter.post("/:mediaId/recognize-faces", verifyJwt, runFaceRecognition);

export default mediaRouter;