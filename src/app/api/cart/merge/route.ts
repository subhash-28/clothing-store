import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cartItemsSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before merging your cart." }, { status: 401 });
  const parsed = cartItemsSchema.safeParse((await req.json().catch(() => null))?.items);
  if (!parsed.success) return NextResponse.json({ error: "Your saved cart is invalid and could not be merged." }, { status: 400 });

  const result = await db.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    let removedCount = 0;
    let adjustedCount = 0;

    for (const guestItem of parsed.data) {
      const variant = await tx.productVariant.findFirst({
        where: { id: guestItem.variantId, product: { isActive: true } },
        include: { inventory: true },
      });
      const stock = variant?.inventory?.quantity ?? 0;
      if (!variant || stock < 1) {
        removedCount += 1;
        continue;
      }

      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId: guestItem.variantId } },
      });
      const quantity = Math.min(stock, 100, (existing?.quantity ?? 0) + guestItem.quantity);
      if (quantity < (existing?.quantity ?? 0) + guestItem.quantity) adjustedCount += 1;
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: cart.id, variantId: guestItem.variantId } },
        update: { quantity },
        create: { cartId: cart.id, variantId: guestItem.variantId, quantity },
      });
    }

    return { removedCount, adjustedCount };
  });

  const warning = result.removedCount || result.adjustedCount
    ? `Cart merged. ${result.removedCount} unavailable item(s) were removed and ${result.adjustedCount} quantity(ies) adjusted to stock.`
    : null;
  return NextResponse.json({ ok: true, ...result, warning });
}
