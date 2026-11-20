export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_FOLDERS = ["products", "site", "banners", "categories"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const isUploadFolder = (folder: string): folder is UploadFolder =>
  (UPLOAD_FOLDERS as readonly string[]).includes(folder);
