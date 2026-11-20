import { v2 as cloudinary } from "cloudinary";
import type { UploadFolder } from "@/lib/image-constraints";

export { ALLOWED_TYPES, MAX_BYTES, isUploadFolder, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/image-constraints";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function uploadBuffer(buffer: Buffer, folder: UploadFolder = "products"): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `clothing-store/${folder}`, resource_type: "image" }, (err, res) => {
        if (err || !res) return reject(err ?? new Error("Upload failed"));
        resolve({ url: res.secure_url, publicId: res.public_id });
      })
      .end(buffer);
  });
}

export const deleteImage = (publicId: string) => cloudinary.uploader.destroy(publicId);
