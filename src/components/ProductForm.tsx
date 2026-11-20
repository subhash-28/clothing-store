"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAdminImage } from "@/lib/admin-image-upload";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
type Img = { url: string; publicId: string };

export default function ProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [images, setImages] = useState<Img[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const image = await uploadAdminImage(file, "products");
        setImages((previous) => [...previous, image]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Product image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      material: form.get("material"),
      originalPrice: Math.round(Number(form.get("originalPrice")) * 100),
      sellingPrice: Math.round(Number(form.get("sellingPrice")) * 100),
      categoryId: form.get("categoryId"),
      sizes,
      colors: String(form.get("colors")).split(",").map((color) => color.trim()).filter(Boolean),
      stock: Number(form.get("stock")),
      isFeatured: form.get("isFeatured") === "on",
      isBestSeller: form.get("isBestSeller") === "on",
      images,
    };
    setSaving(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save the product.");
        return;
      }
      router.push("/owner/products");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-lg border border-ink/20 px-4 py-2.5 text-sm outline-none focus:border-madder";
  const label = "mb-1 block text-sm font-semibold";

  return (
    <form onSubmit={submit} className="mt-6 max-w-2xl space-y-5">
      <div><label className={label}>Name</label><input name="name" required minLength={2} maxLength={120} className={input} /></div>
      <div><label className={label}>Description</label><textarea name="description" required minLength={10} maxLength={5000} rows={4} className={input} /></div>
      <div><label className={label}>Material and fabric</label><input name="material" maxLength={200} className={input} placeholder="e.g. 100% cotton, 180 GSM" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>Original price (₹)</label><input name="originalPrice" type="number" min="1" step="1" required className={input} /></div>
        <div><label className={label}>Selling price (₹)</label><input name="sellingPrice" type="number" min="1" step="1" required className={input} /></div>
      </div>
      <div>
        <label className={label}>Category</label>
        <select name="categoryId" required className={input} defaultValue="">
          <option value="" disabled>Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <span className={label}>Sizes</span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button type="button" key={s} aria-pressed={sizes.includes(s)}
              onClick={() => setSizes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
              className={`rounded border px-4 py-2 text-sm ${sizes.includes(s) ? "border-ink bg-ink text-white" : "border-ink/20"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>Colours (comma separated)</label><input name="colors" required placeholder="White, Navy" className={input} /></div>
        <div><label className={label}>Stock per size and colour</label><input name="stock" type="number" min="0" defaultValue={10} required className={input} /></div>
      </div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" /> Featured</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isBestSeller" /> Best seller</label>
      </div>
      <div>
        <label className={label}>Images (JPG, PNG, WebP, up to 5 MB each)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => onFiles(e.target.files)} />
        <p className="mt-1 text-xs text-ink/60">Image upload requires the store's Cloudinary settings to be configured.</p>
        {uploading && <p className="mt-2 text-sm text-ink/60">Uploading...</p>}
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.publicId} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Preview ${i + 1}`} className="aspect-[3/4] w-full rounded object-cover" />
              <button type="button" onClick={() => setImages((p) => p.filter((x) => x.publicId !== img.publicId))}
                className="absolute right-1 top-1 rounded bg-white px-2 text-xs font-bold text-madder">Remove</button>
            </div>
          ))}
        </div>
      </div>
      {categories.length === 0 && <p role="alert" className="text-sm text-madder">Create a category before adding a product.</p>}
      {error && <p role="alert" className="text-sm text-madder">{error}</p>}
      <button disabled={saving || uploading || images.length === 0 || sizes.length === 0 || categories.length === 0} className="rounded-full bg-madder px-7 py-3 font-bold text-white disabled:opacity-50">
        {saving ? "Saving..." : "Save product"}
      </button>
    </form>
  );
}
