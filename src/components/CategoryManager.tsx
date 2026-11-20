"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import { uploadAdminImage } from "@/lib/admin-image-upload";

type CategoryDraft = { name: string; imageUrl: string | null; imagePublicId: string | null };
const input = "mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm";
const emptyDraft: CategoryDraft = { name: "", imageUrl: null, imagePublicId: null };

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft);
  const [busy, setBusy] = useState("");
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function upload(file: File | undefined, target: string) {
    if (!file) return;
    setError("");
    setUploading(target);
    try {
      const image = await uploadAdminImage(file, "categories");
      if (target === "new") setDraft((current) => ({ ...current, imageUrl: image.url, imagePublicId: image.publicId }));
      else setCategories((current) => current.map((category) => category.id === target
        ? { ...category, imageUrl: image.url, imagePublicId: image.publicId }
        : category));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Category image upload failed.");
    } finally {
      setUploading("");
    }
  }

  async function saveCategory(id: string | null, value: CategoryDraft) {
    setError("");
    setNotice("");
    setBusy(id ?? "new");
    try {
      const response = await fetch(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this category.");
      if (id) {
        setNotice(data.warning ?? "Category saved.");
      } else {
        setCategories((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
        setDraft(emptyDraft);
        setNotice("Category created.");
      }
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this category.");
    } finally {
      setBusy("");
    }
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`Delete the ${category.name} category?`)) return;
    setBusy(category.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete this category.");
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setNotice(data.warning ?? "Category deleted.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this category.");
    } finally {
      setBusy("");
    }
  }

  function editField(id: string, key: "name" | "imageUrl" | "imagePublicId", value: string | null) {
    setCategories((current) => current.map((category) => category.id === id ? { ...category, [key]: value } : category));
  }

  function imageInput(target: string) {
    return <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], target)} className={`${input} file:mr-3 file:rounded file:border-0 file:bg-mist file:px-3 file:py-1.5`} />;
  }

  return (
    <div className="mt-6 space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-green-800">{notice}</p>}
      <section className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
        <h2 className="font-display text-xl font-bold">Add category</h2>
        <label className="block text-sm font-semibold">Category name<input required minLength={2} maxLength={80} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className={input} /></label>
        <label className="block text-sm font-semibold">Category image (optional, JPG/PNG/WebP; up to 5 MB){imageInput("new")}</label>
        {draft.imageUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.imageUrl} alt="Category preview" className="h-20 w-28 rounded object-cover" />
            <button type="button" onClick={() => setDraft((current) => ({ ...current, imageUrl: null, imagePublicId: null }))} className="text-sm text-madder">Remove image</button>
          </div>
        )}
        <button disabled={busy !== "" || uploading !== ""} onClick={(event) => {
          event.preventDefault();
          if (draft.name.trim().length < 2) { setError("Enter a category name with at least 2 characters."); return; }
          void saveCategory(null, draft);
        }} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Add category</button>
      </section>

      <div className="space-y-4">
        {categories.map((category) => (
          <section key={category.id} className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
            <label className="block text-sm font-semibold">Category name<input required minLength={2} maxLength={80} value={category.name} onChange={(event) => editField(category.id, "name", event.target.value)} className={input} /></label>
            <label className="block text-sm font-semibold">Replace image (optional){imageInput(category.id)}</label>
            {category.imageUrl && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={category.imageUrl} alt={`${category.name} category`} className="h-20 w-28 rounded object-cover" />
                <button type="button" onClick={() => { editField(category.id, "imageUrl", null); editField(category.id, "imagePublicId", null); }} className="text-sm text-madder">Remove image</button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button disabled={busy !== "" || uploading !== ""} onClick={() => void saveCategory(category.id, { name: category.name, imageUrl: category.imageUrl, imagePublicId: category.imagePublicId })} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === category.id ? "Saving..." : "Save category"}</button>
              <button disabled={busy !== ""} onClick={() => void removeCategory(category)} className="rounded-full border border-madder/30 px-5 py-2.5 text-sm font-semibold text-madder disabled:opacity-50">Delete</button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
