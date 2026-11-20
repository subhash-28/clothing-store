import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { bannerSchema } from "@/lib/validation";
import { z } from "zod";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const banners = await db.banner.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json(banners);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const parsed = bannerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid banner details." }, { status: 400 });

  const last = await db.banner.aggregate({ _max: { position: true } });
  const banner = await db.banner.create({ data: { ...parsed.data, position: (last._max.position ?? -1) + 1 } });
  revalidatePath("/");
  return NextResponse.json({ id: banner.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const parsed = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data?.ids ?? []).size !== parsed.data?.ids.length) {
    return NextResponse.json({ error: "Provide every banner ID once to reorder banners." }, { status: 400 });
  }

  const current = await db.banner.findMany({ select: { id: true } });
  if (current.length !== parsed.data.ids.length || current.some((banner) => !parsed.data.ids.includes(banner.id))) {
    return NextResponse.json({ error: "The banner list changed. Refresh and try again." }, { status: 409 });
  }
  await db.$transaction(parsed.data.ids.map((id, position) => db.banner.update({ where: { id }, data: { position } })));
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
