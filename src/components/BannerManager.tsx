"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Banner } from "@prisma/client";
import { uploadAdminImage } from "@/lib/admin-image-upload";

const textInput = "mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm";
type BannerDraft = Omit<Banner, "id" | "position" | "createdAt" | "updatedAt">;

const blankBanner: BannerDraft = {
  imageUrl: "",
  publicId: "",
  altText: "",
  title: null,
  description: null,
  buttonText: null,
  buttonLink: null,
  isActive: true,
};

export default function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState(initialBanners);
  const [draft, setDraft] = useState<BannerDraft>(blankBanner);
  const [uploading, setUploading] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function upload(file: File | undefined, target: string) {
    if (!file) return;
    setError("");
    setUploading(target);
    try {
      const asset = await uploadAdminImage(file, "banners");
      if (target === "new") setDraft((current) => ({ ...current, imageUrl: asset.url, publicId: asset.publicId }));
      else setBanners((current) => current.map((banner) => banner.id === target ? { ...banner, imageUrl: asset.url, publicId: asset.publicId } : banner));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Banner image upload failed.");
    } finally {
      setUploading("");
    }
  }

  async function saveNew(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy("new");
    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add the banner.");
      setDraft(blankBanner);
      setNotice("Banner added and published.");
      router.refresh();
      const refreshed = await fetch("/api/admin/banners", { cache: "no-store" });
      if (refreshed.ok) setBanners(await refreshed.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add the banner.");
    } finally {
      setBusy("");
    }
  }

  async function saveBanner(banner: Banner) {
    setError("");
    setNotice("");
    setBusy(banner.id);
    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: banner.imageUrl,
          publicId: banner.publicId,
          altText: banner.altText,
          title: banner.title || null,
          description: banner.description || null,
          buttonText: banner.buttonText || null,
          buttonLink: banner.buttonLink || null,
          isActive: banner.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this banner.");
      setNotice(data.warning ?? "Banner saved and published.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this banner.");
    } finally {
      setBusy("");
    }
  }

  async function removeBanner(id: string) {
    if (!window.confirm("Delete this homepage banner?")) return;
    setError("");
    setBusy(id);
    try {
      const response = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete the banner.");
      setBanners((current) => current.filter((banner) => banner.id !== id));
      setNotice(data.warning ?? "Banner deleted.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the banner.");
    } finally {
      setBusy("");
    }
  }

  async function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setError("");
    setBusy("order");
    try {
      const response = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((banner) => banner.id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not reorder banners.");
      setBanners(reordered.map((banner, position) => ({ ...banner, position })));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reorder banners.");
    } finally {
      setBusy("");
    }
  }

  function patchDraft<K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchBanner<K extends keyof BannerDraft>(id: string, key: K, value: BannerDraft[K]) {
    setBanners((current) => current.map((banner) => banner.id === id ? { ...banner, [key]: value } : banner));
  }

  function editorFields(value: BannerDraft, change: <K extends keyof BannerDraft>(key: K, next: BannerDraft[K]) => void, target: string) {
    return (
      <>
        <label className="block text-sm font-semibold">Image description (alt text)
          <input required minLength={2} maxLength={160} value={value.altText} onChange={(event) => change("altText", event.target.value)} className={textInput} />
        </label>
        <label className="block text-sm font-semibold">Heading
          <input maxLength={120} value={value.title ?? ""} onChange={(event) => change("title", event.target.value || null)} className={textInput} />
        </label>
        <label className="block text-sm font-semibold">Description
          <textarea maxLength={300} rows={2} value={value.description ?? ""} onChange={(event) => change("description", event.target.value || null)} className={textInput} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Button text
            <input maxLength={40} value={value.buttonText ?? ""} onChange={(event) => change("buttonText", event.target.value || null)} className={textInput} />
          </label>
          <label className="block text-sm font-semibold">Button link (site path)
            <input maxLength={2048} value={value.buttonLink ?? ""} onChange={(event) => change("buttonLink", event.target.value || null)} className={textInput} placeholder="/search" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={value.isActive} onChange={(event) => change("isActive", event.target.checked)} />
          Show on homepage
        </label>
        <label className="block text-sm font-semibold">Replace image (JPG, PNG, or WebP; up to 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], target)} className={`${textInput} file:mr-3 file:rounded file:border-0 file:bg-mist file:px-3 file:py-1.5`} />
        </label>
        {uploading === target && <p className="text-sm text-ink/60">Uploading image...</p>}
      </>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-green-800">{notice}</p>}
      <form onSubmit={saveNew} className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
        <h2 className="font-display text-xl font-bold">Add a banner</h2>
        <label className="block text-sm font-semibold">Image (JPG, PNG, or WebP; up to 5 MB)
          <input type="file" required accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], "new")} className={textInput} />
        </label>
        {draft.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.imageUrl} alt="New banner preview" className="h-40 w-full rounded-lg object-cover" />
        )}
        {editorFields(draft, patchDraft, "new")}
        <button disabled={busy !== "" || uploading !== "" || !draft.imageUrl} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy === "new" ? "Saving..." : "Add banner"}
        </button>
      </form>

      <div className="space-y-5">
        {banners.length === 0 && <p className="rounded-xl border border-ink/10 bg-white/70 p-6 text-sm text-ink/60">No banners yet. Add one above to show it on the homepage.</p>}
        {banners.map((banner, index) => {
          const value: BannerDraft = {
            imageUrl: banner.imageUrl,
            publicId: banner.publicId,
            altText: banner.altText,
            title: banner.title,
            description: banner.description,
            buttonText: banner.buttonText,
            buttonLink: banner.buttonLink,
            isActive: banner.isActive,
          };
          return (
            <form key={banner.id} onSubmit={(event) => { event.preventDefault(); void saveBanner(banner); }} className="space-y-4 rounded-2xl border border-ink/10 bg-white/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">Banner {index + 1}</h2>
                <div className="flex gap-2">
                  <button type="button" disabled={index === 0 || busy !== ""} onClick={() => void move(index, -1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40">Move up</button>
                  <button type="button" disabled={index === banners.length - 1 || busy !== ""} onClick={() => void move(index, 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40">Move down</button>
                  <button type="button" disabled={busy !== ""} onClick={() => void removeBanner(banner.id)} className="rounded border border-madder/30 px-3 py-1 text-sm text-madder disabled:opacity-40">Delete</button>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.imageUrl} alt={banner.altText} className="h-40 w-full rounded-lg object-cover" />
              {editorFields(value, (key, next) => patchBanner(banner.id, key, next), banner.id)}
              <button disabled={busy !== "" || uploading !== ""} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === banner.id ? "Saving..." : "Save banner"}</button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
