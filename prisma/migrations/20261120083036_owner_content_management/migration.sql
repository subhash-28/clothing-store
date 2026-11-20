-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imagePublicId" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "bestSellersTitle" TEXT NOT NULL DEFAULT 'Best sellers',
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "ctaLink" TEXT NOT NULL DEFAULT '/search',
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "featuredTitle" TEXT NOT NULL DEFAULT 'Featured',
ADD COLUMN     "footerText" TEXT NOT NULL DEFAULT 'Thoughtfully chosen styles inspired by heritage and made for modern life.',
ADD COLUMN     "heroBackgroundPublicId" TEXT,
ADD COLUMN     "heroBackgroundUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "logoPublicId" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "newArrivalsTitle" TEXT NOT NULL DEFAULT 'New arrivals',
ADD COLUMN     "promoBannerText" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_isActive_position_idx" ON "Banner"("isActive", "position");
