import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product data." }, { status: 400 });
  const p = parsed.data;

  const base = slugify(p.name);
  const slug = (await db.product.findUnique({ where: { slug: base } })) ? `${base}-${Date.now().toString(36)}` : base;

  const product = await db.product.create({
    data: {
      name: p.name, slug, description: p.description, material: p.material || null,
      originalPrice: p.originalPrice, sellingPrice: p.sellingPrice, categoryId: p.categoryId,
      isFeatured: p.isFeatured, isBestSeller: p.isBestSeller,
      images: { create: p.images.map((img, position) => ({ ...img, position })) },
      variants: {
        create: p.sizes.flatMap((size) =>
          p.colors.map((color) => ({
            size, color,
            sku: `${slug}-${size}-${slugify(color)}`.toUpperCase(),
            inventory: { create: { quantity: p.stock } },
          }))
        ),
      },
    },
  });
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/products/[slug]", "page");
  revalidatePath("/owner/products");
  return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 });
}
