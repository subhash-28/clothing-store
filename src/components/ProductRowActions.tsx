"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductRowActions({ id }: { id: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm("Delete this product? Products with past orders are archived instead.")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Could not delete the product.");
    router.refresh();
  }
  return (
    <div className="flex gap-3">
      <Link href={`/owner/products/${id}/edit`} className="font-semibold hover:text-madder">Edit</Link>
      <button onClick={remove} className="text-madder hover:underline">Delete</button>
    </div>
  );
}
