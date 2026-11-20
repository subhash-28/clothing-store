import BannerManager from "@/components/BannerManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await db.banner.findMany({ orderBy: { position: "asc" } });
  return (
    <>
      <h1 className="text-3xl font-extrabold">Homepage banners</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Upload banner images, add information and buttons, and choose their order on the homepage.</p>
      <BannerManager initialBanners={banners} />
    </>
  );
}
