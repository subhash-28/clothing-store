import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const parsed = z.object({ isActive: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose whether this coupon is enabled or disabled." }, { status: 400 });
  const result = await db.coupon.updateMany({ where: { id }, data: { isActive: parsed.data.isActive } });
  if (result.count === 0) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  revalidatePath("/owner/coupons");
  return NextResponse.json({ ok: true });
}
