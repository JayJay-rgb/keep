import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "./cloudinary.mjs";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "keep-uploads",
        allowed_formats: ["jpg", "jpeg", "png", "mp4", "mov"],
        resource_type: "auto",
    },
});

const upload = multer({ storage });

export default upload;