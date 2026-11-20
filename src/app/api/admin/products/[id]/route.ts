import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { productUpdateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;

  const product = await db.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const sold = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (sold > 0) {
    // keep order history intact: hide instead of delete
    await db.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, archived: true });
  }

  await db.product.delete({ where: { id } });
  await Promise.allSettled(product.images.map((i) => deleteImage(i.publicId)));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: { isFeatured?: boolean; isBestSeller?: boolean; isActive?: boolean } = {};
  for (const k of ["isFeatured", "isBestSeller", "isActive"] as const) if (typeof body[k] === "boolean") data[k] = body[k];
  await db.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const parsed = productUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product details." }, { status: 400 });

  const product = await db.product.findUnique({
    where: { id },
    include: { images: true, variants: { include: { inventory: true } } },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const requestedImageIds = parsed.data.images.flatMap((image) => image.id ? [image.id] : []);
  const requestedVariantIds = parsed.data.variants.flatMap((variant) => variant.id ? [variant.id] : []);
  if (new Set(requestedImageIds).size !== requestedImageIds.length) {
    return NextResponse.json({ error: "Product images are invalid." }, { status: 400 });
  }
  if (requestedImageIds.some((id) => !product.images.some((image) => image.id === id))) {
    return NextResponse.json({ error: "An image does not belong to this product." }, { status: 400 });
  }
  if (new Set(requestedVariantIds).size !== requestedVariantIds.length) {
    return NextResponse.json({ error: "Product variants are invalid." }, { status: 400 });
  }
  for (const draft of parsed.data.variants) {
    if (draft.id && !product.variants.some((variant) =>
      variant.id === draft.id && variant.size === draft.size && variant.color.toLowerCase() === draft.color.toLowerCase()
    )) {
      return NextResponse.json({ error: "A size or colour does not match this product's saved variant." }, { status: 400 });
    }
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Choose an existing category." }, { status: 400 });
  const removedVariants = product.variants.filter((variant) =>
    !parsed.data.variants.some((draft) => draft.size === variant.size && draft.color.toLowerCase() === variant.color.toLowerCase())
  );
  const soldVariantIds = new Set(removedVariants.length
    ? (await db.orderItem.findMany({ where: { variantId: { in: removedVariants.map((variant) => variant.id) } }, select: { variantId: true } }).then((rows) => rows.map((row) => row.variantId)))
    : []);
  const oldSlug = product.slug;

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          material: parsed.data.material,
          originalPrice: parsed.data.originalPrice,
          sellingPrice: parsed.data.sellingPrice,
          categoryId: parsed.data.categoryId,
          isFeatured: parsed.data.isFeatured,
          isBestSeller: parsed.data.isBestSeller,
        },
      });

      const requestedImageIdSet = new Set(requestedImageIds);
      await tx.productImage.deleteMany({ where: { productId: product.id, id: { notIn: Array.from(requestedImageIdSet) } } });
      for (const [position, image] of parsed.data.images.entries()) {
        if (image.id) {
          await tx.productImage.update({ where: { id: image.id }, data: { url: image.url, publicId: image.publicId, position } });
        } else {
          await tx.productImage.create({ data: { productId: product.id, url: image.url, publicId: image.publicId, position } });
        }
      }

      for (const variant of parsed.data.variants) {
        const existing = product.variants.find((saved) => saved.size === variant.size && saved.color.toLowerCase() === variant.color.toLowerCase());
        const savedVariant = existing ?? await tx.productVariant.create({
          data: {
            productId: product.id,
            size: variant.size,
            color: variant.color,
            sku: `${slugify(parsed.data.slug)}-${variant.size}-${slugify(variant.color)}`.toUpperCase(),
          },
        });
        if (existing && existing.color !== variant.color) {
          await tx.productVariant.update({ where: { id: existing.id }, data: { color: variant.color } });
        }
        await tx.inventory.upsert({
          where: { variantId: savedVariant.id },
          create: { variantId: savedVariant.id, quantity: variant.stock },
          update: { quantity: variant.stock },
        });
      }

      for (const variant of removedVariants) {
        if (soldVariantIds.has(variant.id)) {
          await tx.inventory.upsert({
            where: { variantId: variant.id },
            create: { variantId: variant.id, quantity: 0 },
            update: { quantity: 0 },
          });
        } else {
          await tx.productVariant.delete({ where: { id: variant.id } });
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That product name, slug, size, colour, or SKU is already in use." }, { status: 409 });
    }
    throw error;
  }

  const keptImageIds = new Set(requestedImageIds);
  const oldImagesToDelete = product.images.filter((image) =>
    !keptImageIds.has(image.id) || !parsed.data.images.some((draft) => draft.id === image.id && draft.publicId === image.publicId)
  );
  const cleanup = await Promise.allSettled(oldImagesToDelete.map((image) => deleteImage(image.publicId)));
  revalidatePath("/");
  revalidatePath(`/products/${oldSlug}`);
  revalidatePath(`/products/${parsed.data.slug}`);
  revalidatePath("/owner/products");
  return NextResponse.json({
    ok: true,
    warning: cleanup.some((result) => result.status === "rejected")
      ? "Product saved, but an old Cloudinary image could not be deleted."
      : null,
  });
}
