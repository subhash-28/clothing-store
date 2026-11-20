import CouponManager from "@/components/CouponManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { code: "asc" } });
  return (
    <>
      <h1 className="text-3xl font-extrabold">Coupons</h1>
      <p className="mt-2 text-sm text-ink/65">Create discount codes and disable codes that should no longer be used.</p>
      <CouponManager initialCoupons={coupons} />
    </>
  );
}
