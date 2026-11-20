import Link from "next/link";
import { notFound } from "next/navigation";
import ProductEditForm from "@/components/ProductEditForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } }, variants: { include: { inventory: true } } },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/owner/products" className="text-sm font-semibold text-madder hover:underline">← Back to products</Link>
      <h1 className="mt-3 text-3xl font-extrabold">Edit product</h1>
      <p className="mt-1 text-sm text-ink/60">{product.name}</p>
      {categories.length === 0
        ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm">Create a category before editing products.</p>
        : <ProductEditForm product={product} categories={categories} />}
    </>
  );
}
