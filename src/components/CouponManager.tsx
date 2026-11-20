"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@prisma/client";
import { rupees } from "@/lib/utils";

const input = "mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm";

export default function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");
    setNotice("");
    setBusy(true);
    const value = Number(form.get("value"));
    const payload = {
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      type,
      value: type === "FLAT" ? Math.round(value * 100) : value,
      minOrder: Math.round(Number(form.get("minOrder") || 0) * 100),
      maxDiscount: form.get("maxDiscount") ? Math.round(Number(form.get("maxDiscount")) * 100) : null,
      usageLimit: form.get("usageLimit") ? Number(form.get("usageLimit")) : null,
      expiresAt: String(form.get("expiresAt") ?? "") || null,
    };

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not create this coupon.");
        return;
      }
      setCoupons((current) => [data, ...current]);
      formElement.reset();
      setNotice("Coupon created and enabled.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(coupon: Coupon) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update this coupon.");
      setCoupons((current) => current.map((item) => item.id === coupon.id ? { ...item, isActive: !item.isActive } : item));
      setNotice(coupon.isActive ? "Coupon disabled." : "Coupon enabled.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this coupon.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-madder">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-green-800">{notice}</p>}
      <form onSubmit={createCoupon} className="grid gap-4 rounded-2xl border border-ink/10 bg-white/80 p-5 sm:grid-cols-2">
        <h2 className="font-display text-xl font-bold sm:col-span-2">Create coupon</h2>
        <label className="block text-sm font-semibold">Coupon code
          <input name="code" required minLength={3} maxLength={32} className={input} placeholder="FESTIVE20" />
        </label>
        <label className="block text-sm font-semibold">Discount type
          <select value={type} onChange={(event) => setType(event.target.value as "PERCENT" | "FLAT")} className={input}>
            <option value="PERCENT">Percentage</option>
            <option value="FLAT">Fixed amount</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Discount {type === "PERCENT" ? "(%)" : "(₹)"}
          <input name="value" type="number" required min="1" max={type === "PERCENT" ? "100" : "1000000"} step="1" className={input} />
        </label>
        <label className="block text-sm font-semibold">Minimum order (₹)
          <input name="minOrder" type="number" min="0" max="1000000" step="1" defaultValue="0" className={input} />
        </label>
        <label className="block text-sm font-semibold">Maximum discount (₹, optional)
          <input name="maxDiscount" type="number" min="1" max="1000000" step="1" className={input} />
        </label>
        <label className="block text-sm font-semibold">Usage limit (optional)
          <input name="usageLimit" type="number" min="1" step="1" className={input} />
        </label>
        <label className="block text-sm font-semibold">Expiry date (optional)
          <input name="expiresAt" type="date" min={new Date().toISOString().slice(0, 10)} className={input} />
        </label>
        <button disabled={busy} className="self-end rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving..." : "Create coupon"}</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white/80">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/60"><tr><th className="p-3">Code</th><th>Discount</th><th>Minimum</th><th>Expires</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-mist last:border-0">
                <td className="p-3 font-bold">{coupon.code}</td>
                <td>{coupon.type === "PERCENT" ? `${coupon.value}%` : rupees(coupon.value)}</td>
                <td>{rupees(coupon.minOrder)}</td>
                <td>{coupon.expiresAt ? coupon.expiresAt.toLocaleDateString() : "No expiry"}</td>
                <td className={coupon.isActive ? "text-green-700" : "text-ink/50"}>{coupon.isActive ? "Enabled" : "Disabled"}</td>
                <td className="p-3 text-right"><button disabled={busy} onClick={() => void toggle(coupon)} className="font-semibold text-madder disabled:opacity-50">{coupon.isActive ? "Disable" : "Enable"}</button></td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink/60">No coupons created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
