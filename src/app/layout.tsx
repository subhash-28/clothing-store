import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSiteSettings } from "@/lib/site-settings";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `${settings.siteName} | ${settings.tagline}`,
    description: settings.heroDescription,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <footer className="mt-20 border-t border-mist py-10 text-sm text-ink/60">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p>© {new Date().getFullYear()} {settings.siteName}. {settings.footerText}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-4 sm:justify-start">
                {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="hover:text-madder">{settings.contactEmail}</a>}
                {settings.contactPhone && <a href={`tel:${settings.contactPhone}`} className="hover:text-madder">{settings.contactPhone}</a>}
              </div>
            </div>
            <nav aria-label="Social links" className="flex justify-center gap-4">
              {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-madder">Instagram</a>}
              {settings.facebookUrl && <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-madder">Facebook</a>}
              {settings.youtubeUrl && <a href={settings.youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-madder">YouTube</a>}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
