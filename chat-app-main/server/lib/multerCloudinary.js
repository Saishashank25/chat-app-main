import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

// Accepts images, videos, docs (PDF, Word, Excel)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "chat_uploads";
    let resource_type = "auto"; // will handle image/video/doc

    // Optionally, you can check file.mimetype and set resource_type/folder
    // if (file.mimetype.startsWith("image/")) resource_type = "image";
    // else if (file.mimetype.startsWith("video/")) resource_type = "video";

    return {
      folder,
      resource_type,
      public_id: Date.now() + '-' + file.originalname,
    };
  },
});

const upload = multer({ storage });
export default upload;
