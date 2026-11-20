import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { storefrontSchema } from "@/lib/validation";
import { deleteImage } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = storefrontSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid storefront details." }, { status: 400 });
  }

  const previous = await db.siteSettings.findUnique({ where: { id: "main" } });
  await db.siteSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...parsed.data },
    update: parsed.data,
  });

  const obsoletePublicIds = [
    previous?.logoPublicId && previous.logoPublicId !== parsed.data.logoPublicId ? previous.logoPublicId : null,
    previous?.heroBackgroundPublicId && previous.heroBackgroundPublicId !== parsed.data.heroBackgroundPublicId ? previous.heroBackgroundPublicId : null,
  ].filter((publicId): publicId is string => Boolean(publicId));
  const cleanup = await Promise.allSettled(obsoletePublicIds.map(deleteImage));
  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/register");
  revalidatePath("/owner/storefront");
  return NextResponse.json({
    ok: true,
    warning: cleanup.some((result) => result.status === "rejected")
      ? "Settings saved, but an old Cloudinary image could not be deleted."
      : null,
  });
}
