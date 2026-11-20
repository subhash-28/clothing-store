import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { catalogFiltersSchema } from "@/lib/validation";

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const parsed = catalogFiltersSchema.safeParse({
    q: first(params.q),
    sort: first(params.sort),
    min: first(params.min),
    max: first(params.max),
  });
  if (!parsed.success) return { filters: null, error: parsed.error.issues[0]?.message ?? "Invalid search filters." };
  return { filters: parsed.data, error: "" };
}

export function productWhere(filters: CatalogFilters, categorySlug?: string): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (categorySlug) where.category = { slug: categorySlug };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { material: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.min !== undefined || filters.max !== undefined) {
    where.sellingPrice = {
      ...(filters.min !== undefined ? { gte: Math.round(filters.min * 100) } : {}),
      ...(filters.max !== undefined ? { lte: Math.round(filters.max * 100) } : {}),
    };
  }
  return where;
}

export function productOrderBy(sort: CatalogFilters["sort"]): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { sellingPrice: "asc" };
  if (sort === "price-desc") return { sellingPrice: "desc" };
  return { createdAt: "desc" };
}
