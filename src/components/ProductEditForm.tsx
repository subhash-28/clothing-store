"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIZES } from "@/lib/validation";
import { uploadAdminImage } from "@/lib/admin-image-upload";

type ProductEditData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string | null;
  originalPrice: number;
  sellingPrice: number;
  categoryId: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  images: { id: string; url: string; publicId: string }[];
  variants: { id: string; size: (typeof SIZES)[number]; color: string; inventory: { quantity: number } | null }[];
};
type VariantDraft = { id?: string; size: (typeof SIZES)[number]; color: string; stock: number };
type ImageDraft = { id?: string; url: string; publicId: string };
const input = "w-full rounded-lg border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-madder";
const label = "mb-1 block text-sm font-semibold";

export default function ProductEditForm({
  product,
  categories,
}: {
  product: ProductEditData;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<ImageDraft[]>(product.images);
  const [variants, setVariants] = useState<VariantDraft[]>(product.variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    stock: variant.inventory?.quantity ?? 0,
  })));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const image = await uploadAdminImage(file, "products");
        setImages((current) => [...current, image]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Product image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      description: String(form.get("description") ?? ""),
      material: String(form.get("material") ?? "").trim() || null,
      originalPrice: Math.round(Number(form.get("originalPrice")) * 100),
      sellingPrice: Math.round(Number(form.get("sellingPrice")) * 100),
      categoryId: String(form.get("categoryId") ?? ""),
      isFeatured: form.get("isFeatured") === "on",
      isBestSeller: form.get("isBestSeller") === "on",
      images,
      variants,
    };

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save product changes.");
        return;
      }
      setNotice(data.warning ?? "Product updated and published.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function moveImage(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  const numberOfVariants = variants.length;

  return (
    <form onSubmit={submit} className="mt-6 max-w-3xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
        <h2 className="font-display text-xl font-bold">Product details</h2>
        <label className="block"><span className={label}>Name</span><input name="name" required minLength={2} maxLength={120} defaultValue={product.name} className={input} /></label>
        <label className="block"><span className={label}>Product URL slug</span><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={140} defaultValue={product.slug} className={input} /></label>
        <label className="block"><span className={label}>Description</span><textarea name="description" required minLength={10} maxLength={5000} rows={5} defaultValue={product.description} className={input} /></label>
        <label className="block"><span className={label}>Material</span><input name="material" maxLength={200} defaultValue={product.material ?? ""} className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className={label}>Original price (₹)</span><input name="originalPrice" type="number" min="1" step="1" required defaultValue={product.originalPrice / 100} className={input} /></label>
          <label className="block"><span className={label}>Selling price (₹)</span><input name="sellingPrice" type="number" min="1" step="1" required defaultValue={product.sellingPrice / 100} className={input} /></label>
        </div>
        <label className="block"><span className={label}>Category</span>
          <select name="categoryId" defaultValue={product.categoryId} className={input}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isBestSeller" defaultChecked={product.isBestSeller} /> Best seller</label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Size, colour, and stock</h2>
            <p className="mt-1 text-sm text-ink/60">Stock is saved separately for each combination.</p>
          </div>
          <button type="button" onClick={() => setVariants((current) => [...current, { size: "M", color: "", stock: 0 }])} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold">Add variant</button>
        </div>
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id ?? `new-${index}`} className="grid items-end gap-3 rounded-xl bg-mist/60 p-3 sm:grid-cols-[1fr_1.5fr_1fr_auto]">
              <label className="block text-xs font-semibold">Size
                <select value={variant.size} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, size: event.target.value as VariantDraft["size"] } : item))} className={`${input} mt-1`}>
                  {SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold">Colour
                <input required minLength={1} maxLength={30} value={variant.color} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, color: event.target.value } : item))} className={`${input} mt-1`} />
              </label>
              <label className="block text-xs font-semibold">Stock
                <input type="number" required min={0} max={100000} value={variant.stock} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, stock: Number(event.target.value) } : item))} className={`${input} mt-1`} />
              </label>
              <button type="button" disabled={numberOfVariants <= 1} onClick={() => setVariants((current) => current.filter((_, i) => i !== index))} className="rounded px-3 py-2 text-sm font-semibold text-madder disabled:opacity-40">Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
        <h2 className="font-display text-xl font-bold">Product images</h2>
        <label className="block text-sm font-semibold">Add images (JPG, PNG, or WebP; up to 5 MB each)
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void addImages(event.target.files)} className={`${input} file:mr-3 file:rounded file:border-0 file:bg-mist file:px-3 file:py-1.5`} />
        </label>
        {uploading && <p className="text-sm text-ink/60">Uploading...</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id ?? image.publicId} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={`Product image ${index + 1}`} className="aspect-[3/4] w-full rounded-lg object-cover" />
              <div className="mt-1 flex justify-between">
                <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="text-xs font-semibold disabled:opacity-40">Move left</button>
                <button type="button" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} className="text-xs font-semibold disabled:opacity-40">Move right</button>
                <button type="button" disabled={images.length <= 1} onClick={() => setImages((current) => current.filter((_, i) => i !== index))} className="text-xs font-semibold text-madder disabled:opacity-40">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-green-800">{notice}</p>}
      <button disabled={saving || uploading || images.length === 0 || variants.length === 0} className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white disabled:opacity-50">
        {saving ? "Saving..." : "Save and publish product"}
      </button>
    </form>
  );
}
