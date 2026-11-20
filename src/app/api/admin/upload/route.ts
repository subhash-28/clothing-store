import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ALLOWED_TYPES, MAX_BYTES, isUploadFolder, uploadBuffer } from "@/lib/cloudinary";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { error: "Image uploads are not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local, then restart the server." },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const requestedFolder = form.get("folder");
  const folder = requestedFolder === null ? "products" : requestedFolder;
  if (typeof folder !== "string" || !isUploadFolder(folder)) {
    return NextResponse.json({ error: "Choose a valid image destination." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });

  try {
    const result = await uploadBuffer(Buffer.from(await file.arrayBuffer()), folder);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Upload failed. Check your Cloudinary keys." }, { status: 502 });
  }
}
