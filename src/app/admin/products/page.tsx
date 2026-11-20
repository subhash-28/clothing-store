import Link from "next/link";
import { db } from "@/lib/db";
import { rupees } from "@/lib/utils";
import ProductRowActions from "@/components/ProductRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, images: { take: 1, orderBy: { position: "asc" } }, variants: { include: { inventory: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Products</h1>
        <Link href="/owner/products/new" className="rounded-full bg-madder px-5 py-2.5 text-sm font-bold text-white">Add product</Link>
      </div>
      {products.length === 0 ? (
        <p className="mt-8 text-ink/60">No products yet. Add your first product to start selling.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-ink/60"><tr><th className="py-2">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + (v.inventory?.quantity ?? 0), 0);
                return (
                  <tr key={p.id} className="border-b border-mist">
                    <td className="flex items-center gap-3 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images[0] && <img src={p.images[0].url} alt="" className="h-12 w-10 rounded object-cover" />}
                      <span className="font-medium">{p.name}{!p.isActive && <em className="ml-2 text-xs text-ink/50">archived</em>}</span>
                    </td>
                    <td>{p.category.name}</td>
                    <td>{rupees(p.sellingPrice)}</td>
                    <td className={stock === 0 ? "font-bold text-madder" : ""}>{stock === 0 ? "Out of stock" : stock}</td>
                    <td>{p.isFeatured && "Featured "}{p.isBestSeller && "Best seller"}</td>
                    <td><ProductRowActions id={p.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
