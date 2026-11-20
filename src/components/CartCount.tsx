"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { mergeGuestCart, readGuestCart } from "@/lib/guest-cart";

export default function CartCount({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [count, setCount] = useState(0);
  const [syncError, setSyncError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setCount(readGuestCart().reduce((sum, item) => sum + item.quantity, 0));
      setSyncError("");
      if (isAuthenticated) {
        const warning = await mergeGuestCart();
        const response = await fetch("/api/cart", { cache: "no-store" });
        if (!response.ok) throw new Error("Your saved cart could not be synchronized.");
        const cart = await response.json();
        setCount(cart.count);
        if (warning) setSyncError(warning);
      }
    } catch (reason) {
      setSyncError(reason instanceof Error ? reason.message : "Your saved cart could not be synchronized.");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
    window.addEventListener("cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return (
    <Link href="/cart" className="inline-flex items-center gap-1">
      Cart
      {syncError && <span role="status" aria-label={syncError} title={syncError} className="text-xs font-bold text-madder">!</span>}
      {count > 0 && (
        <span aria-label={`${count} items`} className="inline-flex min-w-5 items-center justify-center rounded-full bg-turmeric px-1.5 py-0.5 text-[10px] font-bold text-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
