import { db } from "@/lib/db";
import { rupees } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [products, orders, customers, sales, recent] = await Promise.all([
    db.product.count(),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } }),
  ]);

  const stats = [
    ["Total products", products],
    ["Total orders", orders],
    ["Total sales", rupees(sales._sum.amount ?? 0)],
    ["Customers", customers],
  ];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-ink/10 p-5">
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-xl font-bold">Recent orders</h2>
      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">No orders yet. They will show up here once customers check out.</p>
      ) : (
        <ul className="mt-3 divide-y divide-mist text-sm">
          {recent.map((o) => (
            <li key={o.id} className="flex justify-between py-3"><span>{o.orderNumber} · {o.user.name}</span><span>{rupees(o.total)} · {o.status}</span></li>
          ))}
        </ul>
      )}
    </>
  );
}
