import { db } from "@/lib/db";

export type SiteSettingsContent = {
  siteName: string;
  tagline: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  footerText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  heroTitle: string;
  heroDescription: string;
  heroBackgroundUrl: string | null;
  heroBackgroundPublicId: string | null;
  ctaLabel: string;
  ctaLink: string;
  promoBannerText: string | null;
  featuredTitle: string;
  newArrivalsTitle: string;
  bestSellersTitle: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsContent = {
  siteName: "Ishtam",
  tagline: "Authentic by Tradition",
  logoUrl: null,
  logoPublicId: null,
  footerText: "Thoughtfully chosen styles inspired by heritage and made for modern life.",
  contactEmail: null,
  contactPhone: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  heroTitle: "Rooted in tradition. Made for every day.",
  heroDescription: "Discover thoughtfully chosen styles inspired by heritage and made for modern life.",
  heroBackgroundUrl: null,
  heroBackgroundPublicId: null,
  ctaLabel: "Explore the collection",
  ctaLink: "/search",
  promoBannerText: null,
  featuredTitle: "Featured",
  newArrivalsTitle: "New arrivals",
  bestSellersTitle: "Best sellers",
};

export async function getSiteSettings(): Promise<SiteSettingsContent> {
  const settings = await db.siteSettings.findUnique({ where: { id: "main" } });
  if (!settings) return DEFAULT_SITE_SETTINGS;

  return {
    siteName: settings.siteName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    logoPublicId: settings.logoPublicId,
    footerText: settings.footerText,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    youtubeUrl: settings.youtubeUrl,
    heroTitle: settings.heroTitle,
    heroDescription: settings.heroDescription,
    heroBackgroundUrl: settings.heroBackgroundUrl,
    heroBackgroundPublicId: settings.heroBackgroundPublicId,
    ctaLabel: settings.ctaLabel,
    ctaLink: settings.ctaLink,
    promoBannerText: settings.promoBannerText,
    featuredTitle: settings.featuredTitle,
    newArrivalsTitle: settings.newArrivalsTitle,
    bestSellersTitle: settings.bestSellersTitle,
  };
}
