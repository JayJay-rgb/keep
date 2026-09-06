import express from "express";
import {
    getUserProfile,
    updateProfile,
    updateProfilePicture,
} from "../controllers/userController.mjs";
import verifyJwt from "../middleware/verifyJwt.mjs";
import upload from "../config/multer.mjs";

const userRouter = express.Router();

userRouter.get("/me", verifyJwt, getUserProfile);
userRouter.patch("/me", verifyJwt, updateProfile);
userRouter.patch("/me/picture", verifyJwt, upload.single("profilePicture"), updateProfilePicture);

export default userRouter;