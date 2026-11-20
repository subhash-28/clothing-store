import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/owner/login?next=/owner");
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1 text-sm font-medium">
        <p className="mb-3 font-display text-lg font-bold">Dashboard</p>
        <Link href="/owner" className="block rounded px-3 py-2 hover:bg-mist">Overview</Link>
        <Link href="/owner/storefront" className="block rounded px-3 py-2 hover:bg-mist">Storefront</Link>
        <Link href="/owner/products" className="block rounded px-3 py-2 hover:bg-mist">Products</Link>
        <span className="block px-3 py-2 text-ink/40">Orders (Phase 4)</span>
      </aside>
      <section>{children}</section>
    </div>
  );
}
