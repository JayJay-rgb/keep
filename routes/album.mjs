import express from "express";
import upload from "../config/multer.mjs";
import { uploadMedia } from "../controllers/albums/upload.mjs";
import { createAlbum,deleteAlbum } from "../controllers/albums/createAlbums.mjs";
import {     getAlbums, getAlbum } from "../controllers/albums/getAlbum.mjs"
import verifyJwt from "../middleware/verifyJwt.mjs";

const albumRouter = express.Router();

albumRouter.post("/group/:groupId", verifyJwt, createAlbum);
albumRouter.get("/group/:groupId", verifyJwt, getAlbums);
albumRouter.delete("/:albumId", verifyJwt, deleteAlbum);
albumRouter.get("/:albumId", verifyJwt, getAlbum);
albumRouter.post("/:albumId/media", verifyJwt, upload.single("file"), uploadMedia);

export default albumRouter;