import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { percentOff, rupees } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import ProductActions from "@/components/ProductActions";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { include: { inventory: true } },
      reviews: true,
    },
  });
  if (!p) notFound();

  const sizes = Array.from(new Set(p.variants.map((v) => v.size)));
  const colors = Array.from(new Set(p.variants.map((v) => v.color)));
  const off = percentOff(p.originalPrice, p.sellingPrice);
  const avg = p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;
  const user = await getCurrentUser();
  const saved = user ? await db.wishlistItem.findFirst({
    where: { productId: p.id, wishlist: { userId: user.id } },
    select: { id: true },
  }) : null;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        {p.images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt={`${p.name} ${i + 1}`} className={`w-full rounded-lg bg-mist object-cover ${i === 0 ? "col-span-2" : ""}`} />
        ))}
      </div>
      <div>
        <p className="text-sm text-ink/60">{p.category.name}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{p.name}</h1>
        <p className="mt-1 text-sm text-ink/60">{p.reviews.length ? `${avg.toFixed(1)} / 5 from ${p.reviews.length} reviews` : "No reviews yet"}</p>
        <p className="mt-4 text-2xl font-bold">
          {rupees(p.sellingPrice)}
          {off > 0 && <><span className="ml-3 text-base font-normal text-ink/50 line-through">{rupees(p.originalPrice)}</span><span className="ml-3 text-base text-madder">{off}% off</span></>}
        </p>

        <ProductActions
          variants={p.variants.map((variant) => ({ id: variant.id, size: variant.size, color: variant.color, stock: variant.inventory?.quantity ?? 0 }))}
          sizes={sizes}
          colors={colors}
          productId={p.id}
          returnPath={`/products/${p.slug}`}
          isAuthenticated={Boolean(user)}
          initiallyWishlisted={Boolean(saved)}
        />
        <p className="mt-6 leading-relaxed text-ink/80">{p.description}</p>
        {p.material && <p className="mt-4 text-sm"><span className="font-semibold">Material:</span> {p.material}</p>}
      </div>
    </div>
  );
}
