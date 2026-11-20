-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "siteName" TEXT NOT NULL DEFAULT 'Ishtam',
    "tagline" TEXT NOT NULL DEFAULT 'Authentic by Tradition',
    "heroTitle" TEXT NOT NULL DEFAULT 'Rooted in tradition. Made for every day.',
    "heroDescription" TEXT NOT NULL DEFAULT 'Discover thoughtfully chosen styles inspired by heritage and made for modern life.',
    "ctaLabel" TEXT NOT NULL DEFAULT 'Explore the collection',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
