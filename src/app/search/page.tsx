import { db } from "@/lib/db";
import CatalogResults from "@/components/CatalogResults";
import { parseCatalogFilters, productOrderBy, productWhere } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { filters, error } = parseCatalogFilters(searchParams);
  const products = filters ? await db.product.findMany({
    where: productWhere(filters),
    include: { images: { orderBy: { position: "asc" }, take: 2 } },
    orderBy: productOrderBy(filters.sort),
    take: 48,
  }) : [];

  return (
    <CatalogResults
      title={filters?.q ? `Search: ${filters.q}` : "Shop all"}
      description="Find pieces made for your everyday wardrobe."
      action="/search"
      filters={filters}
      products={products}
      error={error}
    />
  );
}
