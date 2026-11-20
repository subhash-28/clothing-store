import ProductCard from "@/components/ProductCard";
import type { CatalogFilters } from "@/lib/catalog";

type CatalogProduct = Parameters<typeof ProductCard>[0]["p"];

export default function CatalogResults({
  title,
  description,
  action,
  filters,
  products,
  error,
}: {
  title: string;
  description: string;
  action: string;
  filters: CatalogFilters | null;
  products: CatalogProduct[];
  error: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-ink/60">{description}</p>
      <form action={action} method="get" className="mt-6 grid gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_180px_140px_140px_auto]">
        <label className="text-xs font-semibold text-ink/65">
          Search
          <input name="q" defaultValue={filters?.q ?? ""} maxLength={100} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-normal text-ink" />
        </label>
        <label className="text-xs font-semibold text-ink/65">
          Sort by
          <select name="sort" defaultValue={filters?.sort ?? "newest"} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-normal text-ink">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink/65">
          Min price (₹)
          <input type="number" name="min" min="0" max="1000000" step="1" defaultValue={filters?.min} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-normal text-ink" />
        </label>
        <label className="text-xs font-semibold text-ink/65">
          Max price (₹)
          <input type="number" name="max" min="0" max="1000000" step="1" defaultValue={filters?.max} className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-normal text-ink" />
        </label>
        <button className="self-end rounded-lg bg-ink px-5 py-2 text-sm font-bold text-white">Apply</button>
      </form>

      {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>}
      {!error && products.length === 0 && <p className="mt-10 text-center text-ink/60">No products match these filters.</p>}
      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          {products.map((product) => <ProductCard key={product.slug} p={product} />)}
        </div>
      )}
    </section>
  );
}
