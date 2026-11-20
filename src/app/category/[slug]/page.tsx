import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CatalogResults from "@/components/CatalogResults";
import { parseCatalogFilters, productOrderBy, productWhere } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const category = await db.category.findUnique({ where: { slug }, select: { name: true, slug: true } });
  if (!category) notFound();

  const { filters, error } = parseCatalogFilters(resolvedSearchParams);
  const products = filters ? await db.product.findMany({
    where: productWhere(filters, category.slug),
    include: { images: { orderBy: { position: "asc" }, take: 2 } },
    orderBy: productOrderBy(filters.sort),
    take: 48,
  }) : [];

  return (
    <CatalogResults
      title={category.name}
      description={`Browse products in the ${category.name} collection.`}
      action={`/category/${category.slug}`}
      filters={filters}
      products={products}
      error={error}
    />
  );
}
