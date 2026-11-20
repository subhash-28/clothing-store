import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import LogoutButton from "./LogoutButton";
import CartCount from "./CartCount";

export default async function Navbar() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  return (
    <header className="sticky top-0 z-30 border-b border-[#c8aa77]/40 bg-[#fbf7ef]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 flex-col font-serif text-2xl font-bold leading-none tracking-tight" aria-label={settings.siteName}>
          {settings.logoUrl
            ? <Image src={settings.logoUrl} alt={settings.siteName} width={148} height={48} className="h-10 w-auto object-contain" />
            : <span>{settings.siteName}</span>}
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.17em] text-madder">{settings.tagline}</span>
        </Link>
        <form action="/search" className="hidden flex-1 md:block">
          <input name="q" placeholder="Search shirts, kurtas, dresses" className="w-full rounded-full bg-mist px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-madder" />
        </form>
        <nav className="ml-auto flex items-center gap-3 text-xs font-medium sm:gap-5 sm:text-sm">
          <Link href="/wishlist" className="hidden sm:inline">Wishlist</Link>
          <CartCount isAuthenticated={Boolean(user)} />
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/owner" className="text-madder">Owner</Link>}
              <span className="hidden sm:inline text-ink/60">Hi, {user.name.split(" ")[0]}</span>
              <LogoutButton redirectTo={user.role === "ADMIN" ? "/owner/login" : "/"} />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full bg-ink px-3 py-2 text-white sm:px-4">Log in</Link>
              <Link href="/register" className="hidden rounded-full border border-ink/20 px-3 py-2 sm:inline-flex sm:px-4">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
