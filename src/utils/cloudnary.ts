import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

interface DeleteFromCloudinaryResponse {
  message: string;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath: string,
  folderName?: string
) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folderName,
    });
    console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error while uploading in cloudinary", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (
  imageUrls: string[] | string
): Promise<void | DeleteFromCloudinaryResponse> => {
  if (!Array.isArray(imageUrls)) {
    imageUrls = [imageUrls];
  }

  for (const imageUrl of imageUrls) {
    const imagePublicId: string =
      imageUrl.split("/").pop()?.split(".")[0] || "";

    try {
      await cloudinary.uploader.destroy(imagePublicId);
    } catch {
      return { message: "Error deleting image from Cloudinary" };
    }
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
