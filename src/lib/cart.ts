import { db } from "@/lib/db";

export type CartEntry = { variantId: string; quantity: number };

export type CartSummaryItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  stock: number;
  originalPrice: number;
  sellingPrice: number;
  imageUrl: string | null;
};

export type CartSummary = {
  items: CartSummaryItem[];
  count: number;
  unavailableCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

const FREE_SHIPPING_THRESHOLD = 200_000;
const SHIPPING_FEE = 9_900;

export async function getCartSummary(entries: CartEntry[]): Promise<CartSummary> {
  const requested = new Map<string, number>();
  for (const entry of entries) {
    requested.set(entry.variantId, Math.min(100, (requested.get(entry.variantId) ?? 0) + entry.quantity));
  }

  if (requested.size === 0) {
    return { items: [], count: 0, unavailableCount: 0, subtotal: 0, discount: 0, shipping: 0, total: 0 };
  }

  const variants = await db.productVariant.findMany({
    where: { id: { in: Array.from(requested.keys()) }, product: { isActive: true } },
    include: { inventory: true, product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
  });
  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const items: CartSummaryItem[] = [];
  let unavailableCount = 0;

  for (const [variantId, requestedQuantity] of requested) {
    const variant = byId.get(variantId);
    const stock = variant?.inventory?.quantity ?? 0;
    if (!variant || stock < 1) {
      unavailableCount += 1;
      continue;
    }

    items.push({
      variantId,
      productId: variant.productId,
      slug: variant.product.slug,
      name: variant.product.name,
      size: variant.size,
      color: variant.color,
      quantity: Math.min(requestedQuantity, stock),
      stock,
      originalPrice: variant.product.originalPrice,
      sellingPrice: variant.product.sellingPrice,
      imageUrl: variant.product.images[0]?.url ?? null,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const discount = items.reduce((sum, item) => sum + (item.originalPrice - item.sellingPrice) * item.quantity, 0);
  const payable = subtotal - discount;
  const shipping = payable > 0 && payable < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;

  return {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    unavailableCount,
    subtotal,
    discount,
    shipping,
    total: payable + shipping,
  };
}

export async function getMemberCartSummary(userId: string): Promise<CartSummary> {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: { items: { select: { variantId: true, quantity: true } } },
  });
  return getCartSummary(cart?.items ?? []);
}
