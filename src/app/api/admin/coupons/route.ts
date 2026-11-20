import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { couponCreateSchema } from "@/lib/validation";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json(await db.coupon.findMany({ orderBy: { code: "asc" } }));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const parsed = couponCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon details." }, { status: 400 });
  const coupon = parsed.data;

  try {
    const created = await db.coupon.create({
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
        usageLimit: coupon.usageLimit,
        expiresAt: coupon.expiresAt ? new Date(`${coupon.expiresAt}T23:59:59.999Z`) : null,
      },
    });
    revalidatePath("/owner/coupons");
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }
    throw error;
  }
}
