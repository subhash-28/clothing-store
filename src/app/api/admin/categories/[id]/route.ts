import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { categorySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid category details." }, { status: 400 });
  const current = await db.category.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  try {
    await db.category.update({
      where: { id: current.id },
      data: { ...parsed.data, slug: slugify(parsed.data.name) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
    }
    throw error;
  }

  const warning = current.imagePublicId && current.imagePublicId !== parsed.data.imagePublicId
    ? await deleteImage(current.imagePublicId).then(() => null).catch(() => "Category saved, but its previous image could not be deleted.")
    : null;
  revalidatePath("/");
  revalidatePath(`/category/${current.slug}`);
  return NextResponse.json({ ok: true, warning });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  if (await db.product.count({ where: { categoryId: category.id } })) {
    return NextResponse.json({ error: "Move or delete this category's products before deleting it." }, { status: 409 });
  }
  await db.category.delete({ where: { id: category.id } });
  const warning = category.imagePublicId
    ? await deleteImage(category.imagePublicId).then(() => null).catch(() => "Category deleted, but its image could not be removed from Cloudinary.")
    : null;
  revalidatePath("/");
  revalidatePath(`/category/${category.slug}`);
  return NextResponse.json({ ok: true, warning });
}
