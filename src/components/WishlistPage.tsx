"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";

type WishlistProduct = {
  id: string;
  slug: string;
  name: string;
  originalPrice: number;
  sellingPrice: number;
  images: { url: string }[];
};

export default function WishlistPage({ initialProducts }: { initialProducts: WishlistProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [error, setError] = useState("");

  async function remove(productId: string) {
    setError("");
    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not remove this item.");
        return;
      }
      setProducts((current) => current.filter((product) => product.id !== productId));
    } catch {
      setError("Could not reach the server. Please try again.");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Your wishlist</h1>
      {error && <p role="alert" className="mt-4 text-sm text-madder">{error}</p>}
      {products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-ink/10 bg-white/70 p-8 text-center text-ink/60">Your wishlist is empty.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard p={product} />
              <button onClick={() => void remove(product.id)} className="mt-2 text-sm font-semibold text-madder">Remove from wishlist</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
