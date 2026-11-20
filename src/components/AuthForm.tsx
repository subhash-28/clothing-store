"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode, siteName, tagline }: { mode: "login" | "register"; siteName: string; tagline: string }) {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setBusy(false); return; }
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  const input = "w-full rounded-lg border border-ink/20 px-4 py-3 text-sm outline-none focus:border-madder";
  return (
    <form onSubmit={submit} className="mx-auto my-14 w-full max-w-sm space-y-4 rounded-2xl border border-[#c8aa77]/50 bg-white/80 p-6 shadow-[0_18px_50px_rgba(74,49,26,0.08)]">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-madder">{siteName} · {tagline}</p>
      <h1 className="font-serif text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="text-sm text-ink/65">{mode === "login" ? "Log in to continue to your account." : "Join us to shop styles rooted in tradition."}</p>
      {mode === "register" && <input name="name" placeholder="Full name" required className={input} />}
      <input name="email" type="email" placeholder="Email" required className={input} />
      <input name="password" type="password" placeholder="Password (8+ characters)" required minLength={mode === "register" ? 8 : 1} className={input} />
      {error && <p role="alert" className="text-sm text-madder">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-ink py-3 font-bold text-white transition-colors hover:bg-madder disabled:opacity-60">
        {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="text-sm text-ink/60">
        {mode === "login" ? <>New here? <Link href="/register" className="font-semibold text-madder">Create an account</Link></> : <>Already registered? <Link href="/login" className="font-semibold text-madder">Log in</Link></>}
      </p>
    </form>
  );
}
