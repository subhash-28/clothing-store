"use client";

import { cartItemsSchema } from "@/lib/validation";
import type { CartEntry } from "@/lib/cart";

export const CART_STORAGE_KEY = "ishtam-cart";

export function readGuestCart(): CartEntry[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new Error("Your saved cart could not be read. Clear it and try again.");
  }

  const result = cartItemsSchema.safeParse(parsed);
  if (!result.success) throw new Error("Your saved cart is invalid. Clear it and try again.");
  return result.data;
}

export function writeGuestCart(items: CartEntry[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearGuestCart() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export async function mergeGuestCart(): Promise<string | null> {
  const items = readGuestCart();
  if (items.length === 0) return null;

  const response = await fetch("/api/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Could not merge your guest cart.");
  clearGuestCart();
  return typeof data.warning === "string" ? data.warning : null;
}
