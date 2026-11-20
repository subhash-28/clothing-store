import { NextResponse } from "next/server";
import { getCartSummary } from "@/lib/cart";
import { cartItemsSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = cartItemsSchema.safeParse((await req.json().catch(() => null))?.items);
  if (!parsed.success) return NextResponse.json({ error: "Your cart data is invalid. Remove the affected item and try again." }, { status: 400 });
  return NextResponse.json(await getCartSummary(parsed.data));
}
