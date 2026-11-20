import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function OwnerCustomersPage() {
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: [{ lastLoginAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { orders: true } },
    },
  });

  return (
    <>
      <h1 className="text-3xl font-extrabold">Customers</h1>
      <p className="mt-2 text-sm text-ink/60">
        Customer accounts and their most recent sign-in activity.
      </p>
      {customers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-ink/10 p-5 text-sm text-ink/60">
          No customer accounts yet. Customers will appear here after registering.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-ink/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Last login</th>
                <th className="px-4 py-3 text-right font-semibold">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{customer.name}</p>
                    <p className="mt-0.5 text-ink/60">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3">{customer.phone || "—"}</td>
                  <td className="px-4 py-3">{dateFormat.format(customer.createdAt)}</td>
                  <td className="px-4 py-3">
                    {customer.lastLoginAt ? dateFormat.format(customer.lastLoginAt) : "Not recorded"}
                  </td>
                  <td className="px-4 py-3 text-right">{customer._count.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
