"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readGuestCart, writeGuestCart } from "@/lib/guest-cart";

type Variant = { id: string; size: string; color: string; stock: number };

export default function ProductActions({
  variants,
  sizes,
  colors,
  productId,
  returnPath,
  isAuthenticated,
  initiallyWishlisted,
}: {
  variants: Variant[];
  sizes: string[];
  colors: string[];
  productId: string;
  returnPath: string;
  isAuthenticated: boolean;
  initiallyWishlisted: boolean;
}) {
  const router = useRouter();
  const available = variants.find((variant) => variant.stock > 0);
  const [size, setSize] = useState(available?.size ?? variants[0]?.size ?? "");
  const [color, setColor] = useState(available?.color ?? variants[0]?.color ?? "");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [busy, setBusy] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = variants.find((variant) => variant.size === size && variant.color === color);
  const stock = selected?.stock ?? 0;
  const selectClass = "rounded-lg border border-ink/20 bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40";

  async function addToCart(buyNow: boolean) {
    if (!selected || stock < 1) {
      setError("This size and colour are out of stock.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not add this item to your cart.");
        return;
      }

      if (!isAuthenticated) {
        const cart = readGuestCart();
        const existing = cart.find((item) => item.variantId === selected.id);
        const nextQuantity = (existing?.quantity ?? 0) + quantity;
        const availableQuantity = Math.min(data.stock, 100);
        if (nextQuantity > availableQuantity) {
          setError(`Only ${availableQuantity} of this item can be kept in your cart.`);
          return;
        }
        writeGuestCart(existing
          ? cart.map((item) => item.variantId === selected.id ? { ...item, quantity: item.quantity + quantity } : item)
          : [...cart, { variantId: selected.id, quantity }]);
      } else {
        window.dispatchEvent(new Event("cart-updated"));
      }

      setMessage("Added to your cart.");
      if (buyNow) router.push("/cart");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    setWishlistBusy(true);
    setError("");
    try {
      const response = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not update your wishlist.");
        return;
      }
      setWishlisted(!wishlisted);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setWishlistBusy(false);
    }
  }

  return (
    <div className="mt-7 space-y-5">
      <div>
        <label htmlFor="product-size" className="block text-sm font-semibold">Size</label>
        <select id="product-size" value={size} onChange={(event) => setSize(event.target.value)} className={`mt-2 ${selectClass}`}>
          {sizes.map((option) => (
            <option key={option} value={option} disabled={!variants.some((variant) => variant.size === option && variant.stock > 0)}>
              {option}{!variants.some((variant) => variant.size === option && variant.stock > 0) ? " - Out of stock" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="product-colour" className="block text-sm font-semibold">Colour</label>
        <select id="product-colour" value={color} onChange={(event) => setColor(event.target.value)} className={`mt-2 ${selectClass}`}>
          {colors.map((option) => (
            <option key={option} value={option} disabled={!variants.some((variant) => variant.color === option && variant.stock > 0)}>
              {option}{!variants.some((variant) => variant.color === option && variant.stock > 0) ? " - Out of stock" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="product-quantity" className="block text-sm font-semibold">Quantity</label>
        <select
          id="product-quantity"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          disabled={stock < 1}
          className={`mt-2 ${selectClass}`}
        >
          {Array.from({ length: Math.min(stock, 20) }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>
      <p className={`text-sm font-medium ${stock > 0 ? "text-green-700" : "text-madder"}`}>
        {stock > 0 ? `${stock} in stock` : "Out of stock"}
      </p>
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || stock < 1} onClick={() => void addToCart(false)} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Adding..." : "Add to cart"}
        </button>
        <button disabled={busy || stock < 1} onClick={() => void addToCart(true)} className="rounded-full border border-ink/25 px-6 py-3 text-sm font-bold disabled:opacity-50">
          Buy now
        </button>
        <button disabled={wishlistBusy} onClick={() => void toggleWishlist()} aria-pressed={wishlisted} className="rounded-full border border-madder/40 px-5 py-3 text-sm font-semibold text-madder disabled:opacity-50">
          {wishlisted ? "♥ Saved" : "♡ Add to wishlist"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-madder">{error}</p>}
      {message && <p role="status" className="text-sm font-medium text-green-700">{message}</p>}
    </div>
  );
}
