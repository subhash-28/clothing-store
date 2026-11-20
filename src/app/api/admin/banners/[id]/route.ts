import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { bannerSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const parsed = bannerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid banner details." }, { status: 400 });

  const current = await db.banner.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  await db.banner.update({ where: { id: current.id }, data: parsed.data });
  const warning = current.publicId !== parsed.data.publicId
    ? await deleteImage(current.publicId).then(() => null).catch(() => "Banner saved, but its previous image could not be deleted.")
    : null;
  revalidatePath("/");
  return NextResponse.json({ ok: true, warning });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  await db.banner.delete({ where: { id: banner.id } });
  const warning = await deleteImage(banner.publicId).then(() => null).catch(() => "Banner deleted, but its image could not be removed from Cloudinary.");
  revalidatePath("/");
  return NextResponse.json({ ok: true, warning });
}
