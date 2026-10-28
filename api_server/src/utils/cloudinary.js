import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads a local file; the caller is responsible for removing the temp file.
const uploadOnCloudinary = async (localFilePath) => {
   try {
      if (!localFilePath) return null;
      return await cloudinary.uploader.upload(localFilePath, {
         upload_preset: "chat-profile",
         resource_type: "image",
      });
   } catch (error) {
      console.error("cloudinary upload failed", error?.message);
      return null;
   }
};

const deleteCloudinaryImage = async (public_id) => {
   try {
      if (!public_id) return null;
      return await cloudinary.uploader.destroy(public_id);
   } catch (error) {
      return null;
   }
};

export { uploadOnCloudinary, deleteCloudinaryImage };
