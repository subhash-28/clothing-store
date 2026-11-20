import { redirect } from "next/navigation";
import WishlistPage from "@/components/WishlistPage";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WishlistRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wishlist");

  const wishlist = await db.wishlist.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: { product: { include: { images: { orderBy: { position: "asc" }, take: 2 } } } },
      },
    },
  });
  const products = (wishlist?.items ?? []).map((item) => item.product);
  return <WishlistPage initialProducts={products} />;
}
