"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { rupees } from "@/lib/utils";
import type { CartSummary } from "@/lib/cart";
import { mergeGuestCart, readGuestCart, writeGuestCart } from "@/lib/guest-cart";

export default function CartPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [error, setError] = useState("");
  const [busyVariant, setBusyVariant] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    setError("");
    if (isAuthenticated) {
      const warning = await mergeGuestCart();
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load your cart.");
      setCart(data);
      if (warning) setError(warning);
    } else {
      const items = readGuestCart();
      const response = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load your cart.");
      setCart(data);
      writeGuestCart(data.items.map((item: CartSummary["items"][number]) => ({ variantId: item.variantId, quantity: item.quantity })));
      if (data.unavailableCount) setError(`${data.unavailableCount} unavailable cart item(s) were removed.`);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadCart()
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your cart.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadCart]);

  async function changeQuantity(variantId: string, quantity: number) {
    setBusyVariant(variantId);
    setError("");
    try {
      if (isAuthenticated) {
        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not update quantity.");
      } else {
        const items = readGuestCart().map((item) => item.variantId === variantId ? { ...item, quantity } : item);
        writeGuestCart(items);
      }
      await loadCart();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update quantity.");
    } finally {
      setBusyVariant("");
    }
  }

  async function removeItem(variantId: string) {
    setBusyVariant(variantId);
    setError("");
    try {
      if (isAuthenticated) {
        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not remove item.");
      } else {
        writeGuestCart(readGuestCart().filter((item) => item.variantId !== variantId));
      }
      await loadCart();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove item.");
    } finally {
      setBusyVariant("");
    }
  }

  if (loading) return <p className="mx-auto max-w-7xl px-4 py-12 text-ink/60">Loading your cart...</p>;
  if (error && !cart) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold">Your cart</h1>
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>
        <button onClick={() => { setLoading(true); void loadCart().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load your cart.")).finally(() => setLoading(false)); }} className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">Try again</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Your cart</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>}
      {cart?.unavailableCount ? <p className="mt-4 text-sm text-madder">Some items are no longer available and were removed from your cart.</p> : null}
      {!cart?.items.length ? (
        <div className="mt-8 rounded-2xl border border-ink/10 bg-white/70 p-8 text-center">
          <p>Your cart is empty.</p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/70 px-4">
            {cart.items.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-5">
                <Link href={`/products/${item.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-mist">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="font-semibold hover:text-madder">{item.name}</Link>
                  <p className="mt-1 text-sm text-ink/60">{item.color} · Size {item.size}</p>
                  <p className="mt-2 text-sm font-bold">{rupees(item.sellingPrice)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="text-xs text-ink/60">
                      Quantity
                      <select
                        aria-label={`Quantity for ${item.name}`}
                        value={item.quantity}
                        disabled={busyVariant === item.variantId}
                        onChange={(event) => void changeQuantity(item.variantId, Number(event.target.value))}
                        className="ml-2 rounded border border-ink/20 bg-white px-2 py-1 text-sm text-ink"
                      >
                        {Array.from({ length: Math.min(item.stock, 100) }, (_, index) => index + 1).map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    <button disabled={busyVariant === item.variantId} onClick={() => void removeItem(item.variantId)} className="text-xs font-semibold text-madder disabled:opacity-50">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-ink/10 bg-white/70 p-5">
            <h2 className="font-display text-xl font-bold">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(cart.subtotal)}</dd></div>
              <div className="flex justify-between text-green-700"><dt>Product discount</dt><dd>-{rupees(cart.discount)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{cart.shipping ? rupees(cart.shipping) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-bold"><dt>Total</dt><dd>{rupees(cart.total)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-ink/60">Free shipping on orders of ₹2,000 or more.</p>
            <button disabled className="mt-5 w-full cursor-not-allowed rounded-full bg-ink/40 px-5 py-3 text-sm font-bold text-white" title="Checkout will be available in the next phase">
              Checkout coming soon
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
