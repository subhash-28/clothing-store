"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettingsContent } from "@/lib/site-settings";
import { uploadAdminImage } from "@/lib/admin-image-upload";

type ImageField = "logo" | "hero";
const input = "mt-2 w-full rounded-lg border border-ink/20 bg-white px-4 py-3 text-sm outline-none focus:border-madder focus:ring-1 focus:ring-madder";
const label = "block text-sm font-semibold";

export default function StorefrontForm({ initialSettings }: { initialSettings: SiteSettingsContent }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ImageField | null>(null);

  function setText(key: keyof SiteSettingsContent, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function setOptional(key: keyof SiteSettingsContent, value: string) {
    setSettings((current) => ({ ...current, [key]: value || null }));
  }

  async function upload(file: File | undefined, field: ImageField) {
    if (!file) return;
    setError("");
    setNotice("");
    setUploading(field);
    try {
      const asset = await uploadAdminImage(file, "site");
      setSettings((current) => field === "logo"
        ? { ...current, logoUrl: asset.url, logoPublicId: asset.publicId }
        : { ...current, heroBackgroundUrl: asset.url, heroBackgroundPublicId: asset.publicId });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save your website details.");
        return;
      }
      setNotice(data.warning ?? "Website details saved and published.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-8">
      <section className="max-w-3xl space-y-5 rounded-2xl border border-[#c8aa77]/50 bg-white/80 p-6">
        <div>
          <h2 className="font-display text-xl font-bold">Brand and contact</h2>
          <p className="mt-1 text-sm text-ink/60">These details appear in the storefront header and footer.</p>
        </div>
        <label className={label}>Store name<input required minLength={2} maxLength={60} value={settings.siteName} onChange={(event) => setText("siteName", event.target.value)} className={input} /></label>
        <label className={label}>Tagline<input required minLength={2} maxLength={120} value={settings.tagline} onChange={(event) => setText("tagline", event.target.value)} className={input} /></label>
        <label className={label}>Logo (JPG, PNG, or WebP; up to 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], "logo")} className={`${input} file:mr-3 file:rounded file:border-0 file:bg-mist file:px-3 file:py-1.5`} />
        </label>
        {settings.logoUrl && (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.logoUrl} alt="Current store logo" className="h-16 max-w-48 object-contain" />
            <button type="button" onClick={() => setSettings((current) => ({ ...current, logoUrl: null, logoPublicId: null }))} className="text-sm font-semibold text-madder">Remove logo</button>
          </div>
        )}
        {uploading === "logo" && <p className="text-sm text-ink/60">Uploading logo...</p>}
        <label className={label}>Footer information<textarea rows={3} maxLength={500} value={settings.footerText} onChange={(event) => setText("footerText", event.target.value)} className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>Contact email<input type="email" value={settings.contactEmail ?? ""} onChange={(event) => setOptional("contactEmail", event.target.value)} className={input} /></label>
          <label className={label}>Contact phone<input type="tel" maxLength={40} value={settings.contactPhone ?? ""} onChange={(event) => setOptional("contactPhone", event.target.value)} className={input} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>Instagram URL<input type="url" value={settings.instagramUrl ?? ""} onChange={(event) => setOptional("instagramUrl", event.target.value)} className={input} /></label>
          <label className={label}>Facebook URL<input type="url" value={settings.facebookUrl ?? ""} onChange={(event) => setOptional("facebookUrl", event.target.value)} className={input} /></label>
          <label className={label}>YouTube URL<input type="url" value={settings.youtubeUrl ?? ""} onChange={(event) => setOptional("youtubeUrl", event.target.value)} className={input} /></label>
        </div>
      </section>

      <section className="max-w-3xl space-y-5 rounded-2xl border border-[#c8aa77]/50 bg-white/80 p-6">
        <div>
          <h2 className="font-display text-xl font-bold">Homepage content</h2>
          <p className="mt-1 text-sm text-ink/60">Changes publish to the live homepage as soon as you save.</p>
        </div>
        <label className={label}>Hero headline<input required minLength={2} maxLength={120} value={settings.heroTitle} onChange={(event) => setText("heroTitle", event.target.value)} className={input} /></label>
        <label className={label}>Hero description<textarea required minLength={10} maxLength={300} rows={3} value={settings.heroDescription} onChange={(event) => setText("heroDescription", event.target.value)} className={input} /></label>
        <label className={label}>Hero background image (JPG, PNG, or WebP; up to 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], "hero")} className={`${input} file:mr-3 file:rounded file:border-0 file:bg-mist file:px-3 file:py-1.5`} />
        </label>
        {settings.heroBackgroundUrl && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.heroBackgroundUrl} alt="Current hero background" className="h-36 w-full rounded-lg object-cover" />
            <button type="button" onClick={() => setSettings((current) => ({ ...current, heroBackgroundUrl: null, heroBackgroundPublicId: null }))} className="text-sm font-semibold text-madder">Remove hero image</button>
          </div>
        )}
        {uploading === "hero" && <p className="text-sm text-ink/60">Uploading hero image...</p>}
        <label className={label}>Button text<input required minLength={2} maxLength={40} value={settings.ctaLabel} onChange={(event) => setText("ctaLabel", event.target.value)} className={input} /></label>
        <label className={label}>Button link (site path)<input required maxLength={2048} value={settings.ctaLink} onChange={(event) => setText("ctaLink", event.target.value)} className={input} placeholder="/search" /></label>
        <label className={label}>Promotional banner text (leave blank to hide)<input maxLength={160} value={settings.promoBannerText ?? ""} onChange={(event) => setOptional("promoBannerText", event.target.value)} className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>Featured section title<input required maxLength={80} value={settings.featuredTitle} onChange={(event) => setText("featuredTitle", event.target.value)} className={input} /></label>
          <label className={label}>New arrivals title<input required maxLength={80} value={settings.newArrivalsTitle} onChange={(event) => setText("newArrivalsTitle", event.target.value)} className={input} /></label>
          <label className={label}>Best sellers title<input required maxLength={80} value={settings.bestSellersTitle} onChange={(event) => setText("bestSellersTitle", event.target.value)} className={input} /></label>
        </div>
      </section>

      {error && <p role="alert" className="text-sm font-medium text-madder">{error}</p>}
      {notice && <p role="status" className="text-sm font-medium text-green-800">{notice}</p>}
      <button disabled={saving || uploading !== null} className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-madder disabled:opacity-60">
        {saving ? "Publishing..." : "Save and publish website"}
      </button>
    </form>
  );
}
