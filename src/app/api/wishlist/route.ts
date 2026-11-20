import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { wishlistItemSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save items to your wishlist." }, { status: 401 });
  const parsed = wishlistItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
  const product = await db.product.findFirst({ where: { id: parsed.data.productId, isActive: true }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const wishlist = await db.wishlist.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  await db.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
    update: {},
    create: { wishlistId: wishlist.id, productId: product.id },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your wishlist." }, { status: 401 });
  const parsed = wishlistItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
  await db.wishlistItem.deleteMany({ where: { productId: parsed.data.productId, wishlist: { userId: user.id } } });
  return NextResponse.json({ ok: true });
}
