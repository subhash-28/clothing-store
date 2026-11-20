"use client";

import { ALLOWED_TYPES, MAX_BYTES, type UploadFolder } from "@/lib/image-constraints";

export async function uploadAdminImage(file: File, folder: UploadFolder) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Image must be 5 MB or smaller.");

  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const response = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Image upload failed.");
  return data as { url: string; publicId: string };
}
