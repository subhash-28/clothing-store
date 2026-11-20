import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const include = { images: { orderBy: { position: "asc" as const }, take: 1 } };
const base = { isActive: true };

function Row({ title, items }: { title: string; items: Parameters<typeof ProductCard>[0]["p"][] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto mt-14 max-w-7xl px-4">
      <h2 className="mb-5 text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {items.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </section>
  );
}

export default async function Home() {
  const [categories, featured, fresh, best, settings, banners] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({ where: { ...base, isFeatured: true }, include, take: 8 }),
    db.product.findMany({ where: base, include, orderBy: { createdAt: "desc" }, take: 8 }),
    db.product.findMany({ where: { ...base, isBestSeller: true }, include, take: 8 }),
    getSiteSettings(),
    db.banner.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <>
      {settings.promoBannerText && <p className="bg-ink px-4 py-2 text-center text-sm font-semibold text-white">{settings.promoBannerText}</p>}
      <section className="relative isolate overflow-hidden border-y border-[#c8aa77]/60 bg-[#f2e7d2]">
        {settings.heroBackgroundUrl && (
          <Image
            src={settings.heroBackgroundUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
        )}
        {settings.heroBackgroundUrl && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#f2e7d2]/75" />}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_22%,rgba(255,255,255,0.8),transparent_52%),radial-gradient(ellipse_at_78%_78%,rgba(191,147,82,0.14),transparent_48%)]" />
        <div className={`relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:gap-12 md:py-14 ${settings.heroBackgroundUrl ? "" : "md:grid-cols-[1fr_0.85fr]"}`}>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-madder">{settings.tagline}</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl font-bold leading-[1.05] md:text-7xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/75">{settings.heroDescription}</p>
            <Link href={settings.ctaLink} className="mt-8 inline-flex rounded-full bg-ink px-7 py-3 font-bold text-white transition-colors hover:bg-madder">
              {settings.ctaLabel}
            </Link>
          </div>
          {!settings.heroBackgroundUrl && <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#c8aa77]/50 bg-[#eee1c8] shadow-[0_24px_70px_rgba(74,49,26,0.16)]">
            <Image
              src="/ishtam-brand.jpeg"
              alt={`${settings.siteName} - ${settings.tagline}`}
              width={768}
              height={768}
              priority
              className="h-auto w-full"
            />
          </div>}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="group relative flex min-h-20 items-center justify-center overflow-hidden rounded-xl border border-[#bca77f]/60 bg-white/70 px-4 py-3 text-center text-sm font-semibold hover:text-madder">
              {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover opacity-25 transition-opacity group-hover:opacity-40" />}
              <span className="relative">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {banners.length > 0 && (
        <section className="mx-auto mt-14 grid max-w-7xl gap-5 px-4 md:grid-cols-2">
          {banners.map((banner) => (
            <article key={banner.id} className="relative min-h-56 overflow-hidden rounded-2xl bg-ink text-white">
              <Image src={banner.imageUrl} alt={banner.altText} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/35 to-transparent" />
              <div className="relative flex min-h-56 max-w-lg flex-col justify-end p-6">
                {banner.title && <h2 className="font-serif text-2xl font-bold">{banner.title}</h2>}
                {banner.description && <p className="mt-2 text-sm text-white/85">{banner.description}</p>}
                {banner.buttonText && banner.buttonLink && <Link href={banner.buttonLink} className="mt-4 w-fit rounded-full bg-white px-5 py-2 text-sm font-bold text-ink">{banner.buttonText}</Link>}
              </div>
            </article>
          ))}
        </section>
      )}

      <Row title={settings.featuredTitle} items={featured} />
      <div id="new"><Row title={settings.newArrivalsTitle} items={fresh} /></div>
      <Row title={settings.bestSellersTitle} items={best} />

      {!fresh.length && <p className="mx-auto mt-20 max-w-xl px-4 text-center text-ink/60">No products yet. Add your first one from the owner panel.</p>}
    </>
  );
}
