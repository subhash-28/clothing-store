import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCartSummary, getMemberCartSummary } from "@/lib/cart";
import { addCartItemSchema } from "@/lib/validation";

async function parseBody(req: Request) {
  return req.json().catch(() => null);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your saved cart." }, { status: 401 });
  return NextResponse.json(await getMemberCartSummary(user.id));
}

export async function POST(req: Request) {
  const parsed = addCartItemSchema.safeParse(await parseBody(req));
  if (!parsed.success) return NextResponse.json({ error: "Choose an available product and quantity." }, { status: 400 });
  const { variantId, quantity } = parsed.data;
  const variant = await db.productVariant.findFirst({
    where: { id: variantId, product: { isActive: true } },
    include: { inventory: true },
  });
  const stock = variant?.inventory?.quantity ?? 0;
  if (!variant || stock < 1) return NextResponse.json({ error: "This item is out of stock." }, { status: 409 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: true, stock });

  const cart = await db.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    select: { quantity: true },
  });
  const maxQuantity = Math.min(stock, 100);
  if ((existing?.quantity ?? 0) + quantity > maxQuantity) {
    return NextResponse.json({ error: `Only ${maxQuantity} of this item can be kept in your cart.`, stock }, { status: 409 });
  }
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, variantId, quantity },
  });
  return NextResponse.json({ ok: true, cart: await getMemberCartSummary(user.id) });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your saved cart." }, { status: 401 });
  const parsed = addCartItemSchema.safeParse(await parseBody(req));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid quantity." }, { status: 400 });
  const { variantId, quantity } = parsed.data;
  const cart = await db.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!cart) return NextResponse.json({ error: "Cart item not found." }, { status: 404 });

  const [item, variant] = await Promise.all([
    db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } }),
    db.productVariant.findFirst({ where: { id: variantId, product: { isActive: true } }, include: { inventory: true } }),
  ]);
  if (!item || !variant) return NextResponse.json({ error: "Cart item is no longer available." }, { status: 404 });
  const stock = variant.inventory?.quantity ?? 0;
  if (quantity > stock) return NextResponse.json({ error: `Only ${stock} of this item are available.` }, { status: 409 });
  await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return NextResponse.json(await getMemberCartSummary(user.id));
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your saved cart." }, { status: 401 });
  const parsed = addCartItemSchema.pick({ variantId: true }).safeParse(await parseBody(req));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid cart item." }, { status: 400 });
  const cart = await db.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (cart) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId: parsed.data.variantId } });
  }
  return NextResponse.json(await getMemberCartSummary(user.id));
}
