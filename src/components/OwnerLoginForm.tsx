"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OwnerLoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/auth/owner-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not sign in.");
        return;
      }
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/owner");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-6xl items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#c8aa77]/50 bg-[#1B1F3B] p-8 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E2A52E]">Ishtam · owner access</p>
        <h1 className="mt-4 font-serif text-3xl font-bold">Store management</h1>
        <p className="mt-2 text-sm text-white/70">Sign in with the owner email or phone number and password.</p>
        <p className="mt-2 text-xs text-white/55">For phone sign-in, set ADMIN_PHONE in .env.local and run npm run db:seed.</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="owner-identifier">Owner email or phone number</label>
        <input id="owner-identifier" name="identifier" type="text" inputMode="text" placeholder="Email or +91 98765 43210" required autoComplete="username" className="mt-2 w-full rounded-lg bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-[#E2A52E]" />
        <label className="mt-4 block text-sm font-medium" htmlFor="owner-password">Password</label>
        <input id="owner-password" name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-lg bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-[#E2A52E]" />
        {error && <p role="alert" className="mt-4 text-sm text-[#ffb4a9]">{error}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-[#E2A52E] py-3 font-bold text-ink disabled:opacity-60">
          {busy ? "Signing in..." : "Sign in to owner panel"}
        </button>
        <p className="mt-5 text-center text-sm text-white/65"><Link href="/login" className="underline underline-offset-4">Customer login</Link></p>
      </form>
    </section>
  );
}
