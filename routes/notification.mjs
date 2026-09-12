import express from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController.mjs";
import verifyJwt from "../middleware/verifyJwt.mjs";

const notificationRouter = express.Router();

notificationRouter.get("/", verifyJwt, getNotifications);
notificationRouter.patch("/:notificationId/read", verifyJwt, markAsRead);
notificationRouter.delete("/:notificationId", verifyJwt, deleteNotification);

export default notificationRouter;